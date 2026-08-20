/**
 * OpenAPI Path and Method Matcher - ES5 Apigee Compatible
 */

function normalizePath(p) {
  if (!p || typeof p !== "string") {
    return "/";
  }
  // Strip query string if present
  var qIndex = p.indexOf("?");
  if (qIndex !== -1) {
    p = p.substring(0, qIndex);
  }
  // Ensure starts with /
  if (p.indexOf("/") !== 0) {
    p = "/" + p;
  }
  // Remove trailing slash unless root /
  if (p.length > 1 && p.lastIndexOf("/") === p.length - 1) {
    p = p.substring(0, p.length - 1);
  }
  return p;
}

function getServerPrefixes(spec) {
  var prefixes = [];
  if (!spec || !Array.isArray(spec.servers)) {
    return prefixes;
  }
  for (var i = 0; i < spec.servers.length; i++) {
    var server = spec.servers[i];
    if (server && typeof server.url === "string") {
      var sUrl = server.url.trim();
      // Extract pathname from full URL or relative path
      var pathPart = "";
      if (sUrl.indexOf("://") !== -1) {
        var slashIdx = sUrl.indexOf("/", sUrl.indexOf("://") + 3);
        if (slashIdx !== -1) {
          pathPart = sUrl.substring(slashIdx);
        }
      } else {
        pathPart = sUrl;
      }
      pathPart = normalizePath(pathPart);
      if (pathPart && pathPart !== "/" && prefixes.indexOf(pathPart) === -1) {
        prefixes.push(pathPart);
      }
    }
  }
  return prefixes;
}

function matchOasPath(spec, rawPath, rawMethod) {
  if (!spec || typeof spec !== "object" || !spec.paths || typeof spec.paths !== "object") {
    return {
      matched: false,
      reason: "SPEC_EMPTY_PATHS",
      statusCode: 404,
      message: "OpenAPI specification contains no paths"
    };
  }

  var normalizedReqPath = normalizePath(rawPath);
  var method = (rawMethod || "GET").toLowerCase();

  // Try candidate paths (original request path and after stripping server prefix)
  var candidatePaths = [normalizedReqPath];
  var serverPrefixes = getServerPrefixes(spec);
  for (var pi = 0; pi < serverPrefixes.length; pi++) {
    var pfx = serverPrefixes[pi];
    if (normalizedReqPath.indexOf(pfx) === 0) {
      var stripped = normalizedReqPath.substring(pfx.length);
      candidatePaths.push(normalizePath(stripped));
    }
  }

  var pathKeys = Object.keys(spec.paths);
  var matchedPathKey = null;
  var pathParams = {};
  var candidateUsed = "";

  // 1. Try exact matches first
  for (var c = 0; c < candidatePaths.length; c++) {
    var cand = candidatePaths[c];
    for (var k = 0; k < pathKeys.length; k++) {
      var pk = pathKeys[k];
      if (normalizePath(pk) === cand) {
        matchedPathKey = pk;
        candidateUsed = cand;
        break;
      }
    }
    if (matchedPathKey) {
      break;
    }
  }

  // 2. If no exact match, try templated matches (e.g., /pets/{petId})
  if (!matchedPathKey) {
    for (var c2 = 0; c2 < candidatePaths.length; c2++) {
      var cand2 = candidatePaths[c2];
      for (var k2 = 0; k2 < pathKeys.length; k2++) {
        var tpl = pathKeys[k2];
        if (tpl.indexOf("{") === -1) {
          continue;
        }

        // Extract parameter names and convert to regex
        var paramNames = [];
        var regexStr = "^" + normalizePath(tpl).replace(/\{([^}]+)\}/g, function(_, name) {
          paramNames.push(name);
          return "([^/]+)";
        }) + "$";

        var regex = new RegExp(regexStr);
        var match = regex.exec(cand2);
        if (match) {
          matchedPathKey = tpl;
          candidateUsed = cand2;
          for (var p = 0; p < paramNames.length; p++) {
            pathParams[paramNames[p]] = decodeURIComponent(match[p + 1]);
          }
          break;
        }
      }
      if (matchedPathKey) {
        break;
      }
    }
  }

  if (!matchedPathKey) {
    return {
      matched: false,
      reason: "PATH_NOT_FOUND",
      statusCode: 404,
      message: "Path '" + normalizedReqPath + "' not found in OpenAPI specification"
    };
  }

  var pathItem = spec.paths[matchedPathKey];
  if (!pathItem || typeof pathItem !== "object") {
    return {
      matched: false,
      reason: "PATH_NOT_FOUND",
      statusCode: 404,
      message: "Path '" + matchedPathKey + "' has no valid configuration"
    };
  }

  // Check method in pathItem
  var operation = pathItem[method];
  if (!operation || typeof operation !== "object") {
    var allowedMethods = [];
    var standardVerbs = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
    for (var v = 0; v < standardVerbs.length; v++) {
      if (pathItem[standardVerbs[v]]) {
        allowedMethods.push(standardVerbs[v].toUpperCase());
      }
    }
    return {
      matched: false,
      reason: "METHOD_NOT_ALLOWED",
      statusCode: 405,
      allowedMethods: allowedMethods,
      pathTemplate: matchedPathKey,
      message: "HTTP method " + method.toUpperCase() + " not allowed for path '" + matchedPathKey + "'. Allowed: " + allowedMethods.join(", ")
    };
  }

  return {
    matched: true,
    statusCode: 200,
    pathTemplate: matchedPathKey,
    matchedPath: candidateUsed,
    pathItem: pathItem,
    operation: operation,
    pathParams: pathParams
  };
}

if (typeof exports !== "undefined") {
  exports.normalizePath = normalizePath;
  exports.matchOasPath = matchOasPath;
  exports.getServerPrefixes = getServerPrefixes;
}
