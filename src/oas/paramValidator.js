/**
 * OpenAPI Parameter Validator - ES5 Apigee Compatible
 * Validates query, header, and path parameters.
 */

if (typeof require !== "undefined") {
  var refMod = require("./refResolver");
  var resolveSchemaRef = refMod.resolveSchemaRef;
  var schemaMod = require("./schemaValidator");
  var validateSchema = schemaMod.validateSchema;
}

function coerceValue(val, schema) {
  if (val === undefined || val === null) {
    return val;
  }
  if (!schema || typeof schema !== "object") {
    return val;
  }
  var type = schema.type;
  if (type === "integer") {
    var num = parseInt(val, 10);
    return isNaN(num) ? val : num;
  }
  if (type === "number") {
    var flt = parseFloat(val);
    return isNaN(flt) ? val : flt;
  }
  if (type === "boolean") {
    if (val === "true" || val === true || val === "1") return true;
    if (val === "false" || val === false || val === "0") return false;
    return val;
  }
  return val;
}

function getHeaderCaseInsensitive(headers, name) {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }
  var target = name.toLowerCase();
  for (var k in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, k) && k.toLowerCase() === target) {
      return headers[k];
    }
  }
  return undefined;
}

function validateParameters(pathItem, operation, requestData, rootDoc, pathParams) {
  var errors = [];
  var allParams = [];

  // 1. Collect parameters from pathItem
  if (pathItem && Array.isArray(pathItem.parameters)) {
    for (var pi = 0; pi < pathItem.parameters.length; pi++) {
      allParams.push(pathItem.parameters[pi]);
    }
  }

  // 2. Collect/override with operation parameters
  if (operation && Array.isArray(operation.parameters)) {
    for (var oi = 0; oi < operation.parameters.length; oi++) {
      var opParam = operation.parameters[oi];
      // Resolve $ref if present
      var resolvedOpParam = resolveSchemaRef(rootDoc, opParam);
      var overridden = false;
      for (var ap = 0; ap < allParams.length; ap++) {
        var resolvedAp = resolveSchemaRef(rootDoc, allParams[ap]);
        if (resolvedAp && resolvedOpParam && resolvedAp.name === resolvedOpParam.name && resolvedAp.in === resolvedOpParam.in) {
          allParams[ap] = opParam;
          overridden = true;
          break;
        }
      }
      if (!overridden) {
        allParams.push(opParam);
      }
    }
  }

  // 3. Validate each parameter
  for (var i = 0; i < allParams.length; i++) {
    var rawParam = allParams[i];
    var param = resolveSchemaRef(rootDoc, rawParam);
    if (!param || typeof param !== "object" || !param.name || !param.in) {
      continue;
    }

    var val;
    var paramIn = param.in.toLowerCase();
    var paramName = param.name;

    if (paramIn === "query") {
      val = requestData.queryParams ? requestData.queryParams[paramName] : undefined;
    } else if (paramIn === "header") {
      val = getHeaderCaseInsensitive(requestData.headers, paramName);
    } else if (paramIn === "path") {
      val = pathParams ? pathParams[paramName] : undefined;
    }

    // Required check
    if (param.required === true && (val === undefined || val === null || val === "")) {
      errors.push({
        path: "/parameters/" + paramIn + "/" + paramName,
        keyword: "required",
        message: "Missing required " + paramIn + " parameter: " + paramName
      });
      continue;
    }

    if (val !== undefined && val !== null && param.schema) {
      var coerced = coerceValue(val, param.schema);
      validateSchema(coerced, param.schema, rootDoc, "/parameters/" + paramIn + "/" + paramName, errors);
    }
  }

  return errors;
}

if (typeof exports !== "undefined") {
  exports.coerceValue = coerceValue;
  exports.validateParameters = validateParameters;
  exports.getHeaderCaseInsensitive = getHeaderCaseInsensitive;
}
