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

bedrock.events.on('bedrock-express.configure.routes', function(app) {
  var permissionsBasePath = config['permission-http'].routes.permissions;
  var permissionsBaseUrl = config.server.baseUri + permissionsBasePath;
  var rolesBasePath = config['permission-http'].routes.roles;
  var rolesBaseUrl = config.server.baseUri + rolesBasePath;

  /**
   * Retrieves all permissions from the config held permissions.
   */
  app.get(permissionsBasePath, ensureAuthenticated, function(req, res, next) {
    var permissions = config.permission.permissions;
    res.json(permissions);
  });

  /**
   * Gets single role
   */
  app.get(
    rolesBasePath + '/:id', ensureAuthenticated, function(req, res, next) {
    brPermission.getRole(req.user.identity, req.params.id, function(err, role) {
      if (err) {
        return next(err);
      }
      role.id = rolesBaseUrl + '/' + role.id;
      res.json(role);
    });
  });

  /**
   * Gets all existing roles
   */
  app.get(rolesBasePath, ensureAuthenticated, function(req, res, next) {
    brPermission.getRoles(req.user.identity, function(err, roles) {
      if (err) {
        return next(err);
      }
      var result = roles.map(function(role) {
        role.id = rolesBaseUrl + '/' + role.id;
        return role;
      });
      res.json(roles);
    });
  });

  /**
   * Inserts a newly created role to the database
   *
   * @param role role that is to be added to store.
   *
   * @return role that is stored.
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
      result.role.id = rolesBaseUrl + '/' + result.role.id;
      res.status(201).json(result.role);
    });
  });

  /**
   * Edits a role that is already in the database
   *
   * @param role new role that is to replace the previous role with the same ID.
   *
   * @return resulting updated role that is stored.
   */
  app.patch(
    rolesBasePath + '/:id', ensureAuthenticated,
    validate('services.role.patchRole'), function(req, res, next) {
    // strip out the baseURL from the id to match the id in the roles database
    req.body.id = req.body.id.replace(rolesBaseUrl + '/', '');
    brPermission.updateRole(req.user.identity, req.body, function(err, result) {
      if(err) {
        return next(err);
      }
      res.json(result);
    });
  });

  /**
   * Deletes a role with the specified ID
   *
   * @param id id of the role that is being deleted.
   *
   * @return success status indicating that the role was deleted from the store.
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

bedrock.events.on(
  'bedrock-session-http.session.get', function(req, session, callback) {
  if(req.isAuthenticated() && req.user.identity && req.user.identity.id) {
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
