/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
/* jshint node: true */
var config = require('bedrock').config;
var path = require('path');
require('bedrock-validation');

config['permission-http'] = {};
config['permission-http'].routes = {};
config['permission-http'].routes.permissions = '/permissions';
config['permission-http'].routes.roles = '/roles';

// validation schemas
config.validation.schema.paths.push(
  path.join(__dirname, '..', 'schemas')
);
