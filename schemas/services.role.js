/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const schemas = require('bedrock-validation').schemas;

const postRole = {
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

const patchRole = {
  type: 'array',
  required: true,
  minItems: 1,
  maxItems: 1,
  items: {
    type: 'object',
    properties: {
      op: {type: 'string', required: true},
      changes: {
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
      }
    },
    additionalProperties: false
  }
};

module.exports.postRole = function() {
  return postRole;
};

module.exports.patchRole = function() {
  return patchRole;
};
