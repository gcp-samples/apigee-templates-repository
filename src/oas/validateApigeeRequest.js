/**
 * Apigee Runtime Adapter for OpenAPI Request Validation - ES5 Compatible
 * Reads Apigee flow context variables and sets validation results.
 */

if (typeof require !== "undefined") {
  var valMod = require("./validateOasRequest");
  var validateOasRequest = valMod.validateOasRequest;
}

function parseQueryString(qs) {
  var params = {};
  if (!qs || typeof qs !== "string") {
    return params;
  }
  if (qs.indexOf("?") === 0) {
    qs = qs.substring(1);
  }
  var pairs = qs.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    if (!pair) continue;
    var eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      var k = decodeURIComponent(pair.substring(0, eqIdx));
      var v = decodeURIComponent(pair.substring(eqIdx + 1));
      params[k] = v;
    } else {
      params[decodeURIComponent(pair)] = "";
    }
  }
  return params;
}

function validateApigeeRequest(customSpec, options) {
  if (!options) {
    options = {};
  }

  // 1. Resolve OAS Specification
  var spec = customSpec;
  if (!spec && typeof context !== "undefined") {
    spec = context.getVariable("oas.spec") ||
           context.getVariable("oas.spec.content") ||
           context.getVariable("flow.oas.spec");
  }

  if (!spec) {
    var noSpecResult = {
      valid: false,
      statusCode: 500,
      message: "No OpenAPI specification provided in context variable 'oas.spec'",
      errors: [{ path: "/", keyword: "spec", message: "Missing OpenAPI specification" }]
    };
    if (typeof context !== "undefined") {
      context.setVariable("oas.validation.valid", "false");
      context.setVariable("oas.validation.status_code", "500");
      context.setVariable("oas.validation.error_message", noSpecResult.message);
    }
    return noSpecResult;
  }

  // 2. Extract Apigee Request Attributes
  var path = "/";
  var method = "GET";
  var rawBody = "";
  var headers = {};
  var queryParams = {};

  if (typeof context !== "undefined") {
    // Determine path: prefer proxy.pathsuffix (relative to basepath) or proxy.url / request.path
    var pathSuffix = context.getVariable("proxy.pathsuffix");
    var basePath = context.getVariable("proxy.basepath") || "";
    var fullPath = context.getVariable("request.path");

    if (pathSuffix !== null && pathSuffix !== undefined) {
      path = pathSuffix;
    } else if (fullPath) {
      path = fullPath;
    }

    // HTTP Verb
    var verb = context.getVariable("request.verb");
    if (verb) {
      method = verb;
    }

    // Content-Type & Headers
    var contentType = context.getVariable("request.header.Content-Type") ||
                      context.getVariable("request.header.content-type") || "";
    headers["content-type"] = contentType;

    // Body content
    var content = context.getVariable("request.content");
    if (content !== null && content !== undefined) {
      rawBody = content;
    } else if (typeof request !== "undefined" && request.content) {
      rawBody = request.content;
    }

    // Query parameters
    var querystring = context.getVariable("request.querystring") || "";
    queryParams = parseQueryString(querystring);
  }

  var requestData = {
    path: path,
    method: method,
    headers: headers,
    queryParams: queryParams,
    body: rawBody
  };

  // 3. Execute Validation
  var result = validateOasRequest(spec, requestData, options);

  // 4. Populate Apigee Context Variables
  if (typeof context !== "undefined") {
    context.setVariable("oas.validation.valid", result.valid ? "true" : "false");
    context.setVariable("oas.validation.status_code", String(result.statusCode));
    context.setVariable("oas.validation.operation_id", result.operationId || "");
    context.setVariable("oas.validation.matched_path", result.matchedPath || "");
    context.setVariable("oas.validation.path_template", result.pathTemplate || "");
    context.setVariable("oas.validation.error_count", String(result.errors ? result.errors.length : 0));
    context.setVariable("oas.validation.error_message", result.message || "");
    context.setVariable("oas.validation.errors_json", JSON.stringify(result.errors || []));
  }

  return result;
}

if (typeof exports !== "undefined") {
  exports.parseQueryString = parseQueryString;
  exports.validateApigeeRequest = validateApigeeRequest;
}
