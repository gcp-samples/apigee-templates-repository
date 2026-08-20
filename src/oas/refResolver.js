/**
 * OpenAPI JSON Reference ($ref) Resolver - ES5 Apigee Compatible
 */

function resolveJsonPointer(rootDoc, pointer) {
  if (!pointer || typeof pointer !== "string") {
    return null;
  }
  if (pointer.indexOf("#/") !== 0) {
    return null;
  }
  var parts = pointer.substring(2).split("/");
  var current = rootDoc;
  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined || typeof current !== "object") {
      return null;
    }
    // Handle JSON pointer escaped characters ~1 (/), ~0 (~)
    var part = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
    if (!Object.prototype.hasOwnProperty.call(current, part)) {
      return null;
    }
    current = current[part];
  }
  return current;
}

function resolveSchemaRef(rootDoc, schema, seenRefs) {
  if (!schema || typeof schema !== "object") {
    return schema;
  }
  if (!schema.$ref || typeof schema.$ref !== "string") {
    return schema;
  }
  if (!seenRefs) {
    seenRefs = {};
  }
  var ref = schema.$ref;
  if (seenRefs[ref]) {
    // Prevent infinite recursion in circular schemas
    return schema;
  }
  seenRefs[ref] = true;

  var resolved = resolveJsonPointer(rootDoc, ref);
  if (!resolved || typeof resolved !== "object") {
    return schema;
  }

  // If resolved itself has a $ref, resolve further
  if (resolved.$ref) {
    return resolveSchemaRef(rootDoc, resolved, seenRefs);
  }

  // Merge any sibling properties from schema into resolved (OAS 3.1 allows sibling keywords with $ref)
  var merged = {};
  for (var k in resolved) {
    if (Object.prototype.hasOwnProperty.call(resolved, k)) {
      merged[k] = resolved[k];
    }
  }
  for (var sk in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, sk) && sk !== "$ref") {
      merged[sk] = schema[sk];
    }
  }
  return merged;
}

if (typeof exports !== "undefined") {
  exports.resolveJsonPointer = resolveJsonPointer;
  exports.resolveSchemaRef = resolveSchemaRef;
}
