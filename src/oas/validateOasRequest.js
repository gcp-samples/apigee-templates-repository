/**
 * Main OpenAPI Request Validator - ES5 Apigee Compatible
 * Validates path, method, headers, query parameters, and request body against an OAS 3.0/3.1/3.2 spec.
 */

if (typeof require !== "undefined") {
  var refM = require("./refResolver");
  var resolveSchemaRef = refM.resolveSchemaRef;
  var pathM = require("./pathMatcher");
  var matchOasPath = pathM.matchOasPath;
  var paramM = require("./paramValidator");
  var validateParameters = paramM.validateParameters;
  var getHeaderCaseInsensitive = paramM.getHeaderCaseInsensitive;
  var schemaM = require("./schemaValidator");
  var validateSchema = schemaM.validateSchema;
}

function parseJsonSafe(str) {
  if (!str) return null;
  if (typeof str === "object") return str;
  if (typeof str !== "string") return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function getContentType(headers) {
  var ct = getHeaderCaseInsensitive(headers, "content-type") || "";
  var scIdx = ct.indexOf(";");
  if (scIdx !== -1) {
    ct = ct.substring(0, scIdx);
  }
  return ct.trim().toLowerCase();
}

function findMatchingMediaType(contentObj, reqContentType) {
  if (!contentObj || typeof contentObj !== "object") {
    return null;
  }
  if (reqContentType && contentObj[reqContentType]) {
    return contentObj[reqContentType];
  }
  if (contentObj["application/json"]) {
    return contentObj["application/json"];
  }
  if (contentObj["*/*"]) {
    return contentObj["*/*"];
  }
  var keys = Object.keys(contentObj);
  return keys.length > 0 ? contentObj[keys[0]] : null;
}

function validateOasRequest(specInput, requestData, options) {
  if (!options) {
    options = {};
  }

  // 1. Parse Specification
  var spec = typeof specInput === "string" ? parseJsonSafe(specInput) : specInput;
  if (!spec || typeof spec !== "object") {
    return {
      valid: false,
      statusCode: 500,
      message: "Invalid OpenAPI specification: Unable to parse as JSON object",
      errors: [{ path: "/", keyword: "spec", message: "Invalid OpenAPI specification" }]
    };
  }

  if (!requestData || typeof requestData !== "object") {
    requestData = {};
  }

  var reqPath = requestData.path || "/";
  var reqMethod = requestData.method || "GET";
  var reqHeaders = requestData.headers || {};
  var reqQueryParams = requestData.queryParams || {};
  var rawBody = requestData.body;

  // 2. Match Path and Method
  var pathMatchResult = matchOasPath(spec, reqPath, reqMethod);
  if (!pathMatchResult.matched) {
    return {
      valid: false,
      statusCode: pathMatchResult.statusCode || 404,
      message: pathMatchResult.message || "Route not found in OpenAPI specification",
      errors: [{
        path: reqPath,
        keyword: pathMatchResult.reason || "routing",
        message: pathMatchResult.message
      }]
    };
  }

  var pathItem = pathMatchResult.pathItem;
  var operation = pathMatchResult.operation;
  var pathParams = pathMatchResult.pathParams || {};
  var allErrors = [];

  // 3. Parameter Validation
  if (options.validateParams !== false) {
    var paramErrors = validateParameters(pathItem, operation, requestData, spec, pathParams);
    if (paramErrors && paramErrors.length > 0) {
      for (var pe = 0; pe < paramErrors.length; pe++) {
        allErrors.push(paramErrors[pe]);
      }
    }
  }

  // 4. Request Body Validation
  if (options.validateBody !== false && operation.requestBody) {
    var reqBodyDef = resolveSchemaRef(spec, operation.requestBody);
    if (reqBodyDef && typeof reqBodyDef === "object") {
      var isBodyRequired = reqBodyDef.required === true;
      var hasBody = rawBody !== undefined && rawBody !== null && rawBody !== "";

      if (isBodyRequired && !hasBody) {
        allErrors.push({
          path: "/body",
          keyword: "required",
          message: "Request body is required for operation"
        });
      } else if (hasBody && reqBodyDef.content) {
        var reqContentType = getContentType(reqHeaders);
        var mediaTypeObj = findMatchingMediaType(reqBodyDef.content, reqContentType);

        if (mediaTypeObj && mediaTypeObj.schema) {
          var parsedBody = rawBody;
          if (typeof rawBody === "string") {
            try {
              parsedBody = JSON.parse(rawBody);
            } catch (err) {
              allErrors.push({
                path: "/body",
                keyword: "json",
                message: "Request body contains invalid JSON: " + err.message
              });
              parsedBody = null;
            }
          }

          if (parsedBody !== null && parsedBody !== undefined) {
            validateSchema(parsedBody, mediaTypeObj.schema, spec, "", allErrors);
          }
        }
      }
    }
  }

  var isValid = allErrors.length === 0;
  var statusCode = isValid ? 200 : 400;

  var errorSummary = "";
  if (!isValid) {
    var msgs = [];
    for (var m = 0; m < Math.min(allErrors.length, 5); m++) {
      msgs.push(allErrors[m].path + ": " + allErrors[m].message);
    }
    errorSummary = msgs.join("; ");
  }

  return {
    valid: isValid,
    statusCode: statusCode,
    matchedPath: pathMatchResult.matchedPath,
    pathTemplate: pathMatchResult.pathTemplate,
    operationId: operation.operationId || null,
    errors: allErrors,
    message: isValid ? "Validation successful" : errorSummary
  };
}

if (typeof exports !== "undefined") {
  exports.parseJsonSafe = parseJsonSafe;
  exports.getContentType = getContentType;
  exports.findMatchingMediaType = findMatchingMediaType;
  exports.validateOasRequest = validateOasRequest;
}
