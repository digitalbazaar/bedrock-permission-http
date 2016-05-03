/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
/* jshint node: true */
'use strict';

var _ = require('lodash');
var bedrock = require('bedrock');
var BedrockError = bedrock.util.BedrockError;
var config = bedrock.config;
var brPermission = require('bedrock-permission');
var brPassport = require('bedrock-passport');
var database = require('bedrock-mongodb');
var ensureAuthenticated = brPassport.ensureAuthenticated;
var validate = require('bedrock-validation').validate;

require('bedrock-express');

// load config
require('./config');

bedrock.events.on('bedrock.configure', function() {
  config.permission.roleBaseUrl =
    config.server.baseUri + config['permission-http'].routes.roles;
});

bedrock.events.on('bedrock-express.configure.routes', function(app) {
  var permissionsBasePath = config['permission-http'].routes.permissions;
  var permissionsBaseUrl = config.server.baseUri + permissionsBasePath;
  var rolesBasePath = config['permission-http'].routes.roles;

  /**
   * Retrieves all permissions from the config held permissions.
   */
  app.get(permissionsBasePath, ensureAuthenticated, function(req, res, next) {
    brPermission.getPermissions(req.user.identity, function(err, permissions) {
      if(err) {
        return next(err);
      }
      res.json(permissions);
    });
  });

  /**
   * Gets single role
   */
  app.get(
    rolesBasePath + '/:id', ensureAuthenticated, function(req, res, next) {
    var roleId = req.params.id;
    if(config.permission.roleBaseUrl.length !== 0) {
      roleId = config.permission.roleBaseUrl + '/' + roleId;
    }
    brPermission.getRole(req.user.identity, roleId, function(err, role) {
      if(err) {
        return next(err);
      }
      res.json(role);
    });
  });

  /**
   * Gets all existing roles
   */
  app.get(rolesBasePath, ensureAuthenticated, function(req, res, next) {
    brPermission.getRoles(req.user.identity, function(err, roles) {
      if(err) {
        return next(err);
      }
      res.json(roles);
    });
  });

  /**
   * Inserts a newly created role to the database
   */
  app.post(
    rolesBasePath, ensureAuthenticated, validate('services.role.postRole'),
    function(req, res, next) {
    brPermission.addRole(req.user.identity, req.body, function(err, result) {
      if(err) {
        if(database.isDuplicateError(err)) {
          return next(new BedrockError(
            'Duplicate role.', 'DuplicateRole', {
            httpStatusCode: 409,
            public: true
          }));
        }
        return next(err);
      }
      res.status(201).json(result.role);
    });
  });

  /**
   * Edits a role that is already in the database
   */
  app.patch(
    rolesBasePath + '/:id', ensureAuthenticated,
    validate('services.role.patchRole'), function(req, res, next) {
    var updateOperations = req.body.filter(function(o) {
      return o.op == 'updateRole';
    }).map(function(o) {
      return o.changes;
    });
    if(updateOperations.length !== req.body.length) {
      return next(new BedrockError(
        'Operations not implemented.', 'NotImplemented',
        {httpStatusCode: 400, 'public': true}
      ));
    }
    // the validation schema specifies that the must be only one operation
    brPermission.updateRole(
      req.user.identity, updateOperations[0], function(err, result) {
      if(err) {
        return next(err);
      }
      res.json(result);
    });
  });

  /**
   * Deletes a role with the specified ID
   */
  app.delete(
    rolesBasePath + '/:id', ensureAuthenticated, function(req, res, next) {
    var roleId = req.params.id;
    brPermission.removeRole(req.user.identity, roleId, function(err, result) {
      if(err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });

}); // end configure routes

// add a permission table to the session data
bedrock.events.on(
  'bedrock-session-http.session.get', function(req, session, callback) {
  if(req.isAuthenticated() && req.user.identity &&
    req.user.identity.sysResourceRole) {
    session.identity = session.identity || {};
    session.identity.sysResourceRole = req.user.identity.sysResourceRole;
    return brPermission.createPermissionTable(
      session.identity.sysResourceRole, function(err, table) {
      if(err) {
        return callback(err);
      }
      session.identity.sysPermissionTable = table;
      callback();
    });
  }
  callback();
});
