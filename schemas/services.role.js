/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
var constants = require('bedrock').config.constants;
var schemas = require('bedrock-validation').schemas;

var postRole = {
  type: 'object',
  properties: {
    comment: schemas.description({required: false}),
    label: schemas.label({required: false}),
    sysPermission: {
      type: 'array',
      required: true,
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false
};

var patchRole = {
  type: 'object',
  properties: {
    id: schemas.identifier(),
    comment: schemas.description({required: false}),
    label: schemas.label({required: false}),
    sysPermission: {
      type: 'array',
      required: true,
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false
};

module.exports.postRole = function() {
  return postRole;
};

module.exports.patchRole = function() {
  return patchRole;
};
