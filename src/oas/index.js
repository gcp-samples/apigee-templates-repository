/**
 * OAS Validator Module Entrypoint
 */

var refResolver = require("./refResolver");
var schemaValidator = require("./schemaValidator");
var pathMatcher = require("./pathMatcher");
var paramValidator = require("./paramValidator");
var validateOasRequest = require("./validateOasRequest");
var validateApigeeRequest = require("./validateApigeeRequest");

module.exports = {
  // Reference resolution
  resolveJsonPointer: refResolver.resolveJsonPointer,
  resolveSchemaRef: refResolver.resolveSchemaRef,

  // Schema validation
  validateSchema: schemaValidator.validateSchema,
  getType: schemaValidator.getType,
  deepEqual: schemaValidator.deepEqual,

  // Path matching
  matchOasPath: pathMatcher.matchOasPath,
  normalizePath: pathMatcher.normalizePath,
  getServerPrefixes: pathMatcher.getServerPrefixes,

  // Parameter validation
  coerceValue: paramValidator.coerceValue,
  validateParameters: paramValidator.validateParameters,
  getHeaderCaseInsensitive: paramValidator.getHeaderCaseInsensitive,

  // Core Request validation
  validateOasRequest: validateOasRequest.validateOasRequest,
  parseJsonSafe: validateOasRequest.parseJsonSafe,
  getContentType: validateOasRequest.getContentType,
  findMatchingMediaType: validateOasRequest.findMatchingMediaType,

  // Apigee integration
  validateApigeeRequest: validateApigeeRequest.validateApigeeRequest,
  parseQueryString: validateApigeeRequest.parseQueryString
};
