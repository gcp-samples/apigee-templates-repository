/**
 * OpenAPI / JSON Schema Validator - ES5 Apigee Compatible
 * Supports OAS 3.0, 3.1, 3.2+ schema validation rules.
 */

if (typeof require !== "undefined") {
  var refModule = require("./refResolver");
  var resolveSchemaRef = refModule.resolveSchemaRef;
}

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  var keysA = Object.keys(a);
  var keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (var j = 0; j < keysA.length; j++) {
    var k = keysA[j];
    if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) {
      return false;
    }
  }
  return true;
}

function getType(val) {
  if (val === null) {
    return "null";
  }
  if (Array.isArray(val)) {
    return "array";
  }
  var t = typeof val;
  if (t === "number") {
    if (isNaN(val) || !isFinite(val)) {
      return "unknown";
    }
    if (Math.floor(val) === val) {
      return "integer";
    }
    return "number";
  }
  return t; // "string", "boolean", "object"
}

function matchesType(val, expectedType, isNullable) {
  var actualType = getType(val);
  if (val === null) {
    return expectedType === "null" || isNullable === true;
  }
  if (expectedType === "number" && (actualType === "number" || actualType === "integer")) {
    return true;
  }
  if (expectedType === "integer") {
    return actualType === "integer";
  }
  return actualType === expectedType;
}

function validateFormat(val, format) {
  if (typeof val !== "string") {
    return true;
  }
  switch (format) {
    case "date-time":
      return /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|([+-]\d{2}:\d{2}))$/.test(val) && !isNaN(Date.parse(val));
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val + "T00:00:00Z"));
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    case "uuid":
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
    case "uri":
    case "url":
      return /^[a-zA-Z][a-zA-Z0-9+-.]*:\/\/[^\s/$.?#].[^\s]*$/.test(val) || /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(val);
    case "ipv4":
      return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(val);
    case "ipv6":
      return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$/.test(val);
    case "byte":
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(val);
    default:
      return true;
  }
}

function validateSchema(data, rawSchema, rootDoc, currentPath, errors) {
  if (!errors) {
    errors = [];
  }
  if (!currentPath) {
    currentPath = "";
  }
  if (rawSchema === true) {
    return errors;
  }
  if (rawSchema === false) {
    errors.push({
      path: currentPath || "/",
      keyword: "false",
      message: "Schema is false; data is not allowed"
    });
    return errors;
  }
  if (!rawSchema || typeof rawSchema !== "object") {
    return errors;
  }

  var schema = resolveSchemaRef(rootDoc, rawSchema);
  if (!schema || typeof schema !== "object") {
    return errors;
  }

  var isNullable = schema.nullable === true;

  // 1. Type validation
  if (schema.type !== undefined) {
    var typeValid = false;
    if (Array.isArray(schema.type)) {
      for (var ti = 0; ti < schema.type.length; ti++) {
        if (matchesType(data, schema.type[ti], isNullable)) {
          typeValid = true;
          break;
        }
      }
    } else if (typeof schema.type === "string") {
      typeValid = matchesType(data, schema.type, isNullable);
    }
    if (!typeValid) {
      errors.push({
        path: currentPath || "/",
        keyword: "type",
        message: "Expected type " + JSON.stringify(schema.type) + " but received " + getType(data)
      });
      return errors; // Stop further keyword checks if type mismatch
    }
  } else if (data === null && !isNullable) {
    // If no type specified, but data is null and not nullable
    // (OAS 3.0 defaults to non-null unless nullable: true)
  }

  // If data is null and validly nullable, skip other constraints
  if (data === null) {
    return errors;
  }

  // 2. Const validation (OAS 3.1+)
  if (schema.const !== undefined) {
    if (!deepEqual(data, schema.const)) {
      errors.push({
        path: currentPath || "/",
        keyword: "const",
        message: "Value must be equal to const: " + JSON.stringify(schema.const)
      });
    }
  }

  // 3. Enum validation
  if (Array.isArray(schema.enum)) {
    var inEnum = false;
    for (var ei = 0; ei < schema.enum.length; ei++) {
      if (deepEqual(data, schema.enum[ei])) {
        inEnum = true;
        break;
      }
    }
    if (!inEnum) {
      errors.push({
        path: currentPath || "/",
        keyword: "enum",
        message: "Value must be one of enum values: " + JSON.stringify(schema.enum)
      });
    }
  }

  // 4. Numeric constraints
  if (typeof data === "number") {
    if (schema.minimum !== undefined) {
      if (schema.exclusiveMinimum === true) {
        // OAS 3.0 boolean exclusiveMinimum
        if (data <= schema.minimum) {
          errors.push({
            path: currentPath || "/",
            keyword: "exclusiveMinimum",
            message: "Value " + data + " must be strictly greater than " + schema.minimum
          });
        }
      } else if (typeof schema.exclusiveMinimum !== "number" && data < schema.minimum) {
        errors.push({
          path: currentPath || "/",
          keyword: "minimum",
          message: "Value " + data + " must be greater than or equal to " + schema.minimum
        });
      }
    }
    if (typeof schema.exclusiveMinimum === "number" && data <= schema.exclusiveMinimum) {
      // OAS 3.1+ numeric exclusiveMinimum
      errors.push({
        path: currentPath || "/",
        keyword: "exclusiveMinimum",
        message: "Value " + data + " must be strictly greater than " + schema.exclusiveMinimum
      });
    }

    if (schema.maximum !== undefined) {
      if (schema.exclusiveMaximum === true) {
        // OAS 3.0 boolean exclusiveMaximum
        if (data >= schema.maximum) {
          errors.push({
            path: currentPath || "/",
            keyword: "exclusiveMaximum",
            message: "Value " + data + " must be strictly less than " + schema.maximum
          });
        }
      } else if (typeof schema.exclusiveMaximum !== "number" && data > schema.maximum) {
        errors.push({
          path: currentPath || "/",
          keyword: "maximum",
          message: "Value " + data + " must be less than or equal to " + schema.maximum
        });
      }
    }
    if (typeof schema.exclusiveMaximum === "number" && data >= schema.exclusiveMaximum) {
      // OAS 3.1+ numeric exclusiveMaximum
      errors.push({
        path: currentPath || "/",
        keyword: "exclusiveMaximum",
        message: "Value " + data + " must be strictly less than " + schema.exclusiveMaximum
      });
    }

    if (schema.multipleOf !== undefined && typeof schema.multipleOf === "number") {
      var quotient = data / schema.multipleOf;
      if (Math.abs(quotient - Math.round(quotient)) > 1e-10) {
        errors.push({
          path: currentPath || "/",
          keyword: "multipleOf",
          message: "Value " + data + " must be a multiple of " + schema.multipleOf
        });
      }
    }
  }

  // 5. String constraints
  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        path: currentPath || "/",
        keyword: "minLength",
        message: "String length " + data.length + " is shorter than minLength " + schema.minLength
      });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        path: currentPath || "/",
        keyword: "maxLength",
        message: "String length " + data.length + " exceeds maxLength " + schema.maxLength
      });
    }
    if (schema.pattern !== undefined) {
      try {
        var rx = new RegExp(schema.pattern);
        if (!rx.test(data)) {
          errors.push({
            path: currentPath || "/",
            keyword: "pattern",
            message: "String does not match required pattern: " + schema.pattern
          });
        }
      } catch (err) {
        // Invalid regex in schema ignored
      }
    }
    if (schema.format !== undefined) {
      if (!validateFormat(data, schema.format)) {
        errors.push({
          path: currentPath || "/",
          keyword: "format",
          message: "String does not match format: " + schema.format
        });
      }
    }
  }

  // 6. Array constraints
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({
        path: currentPath || "/",
        keyword: "minItems",
        message: "Array length " + data.length + " is less than minItems " + schema.minItems
      });
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        path: currentPath || "/",
        keyword: "maxItems",
        message: "Array length " + data.length + " exceeds maxItems " + schema.maxItems
      });
    }
    if (schema.uniqueItems === true) {
      for (var u1 = 0; u1 < data.length; u1++) {
        for (var u2 = u1 + 1; u2 < data.length; u2++) {
          if (deepEqual(data[u1], data[u2])) {
            errors.push({
              path: currentPath || "/",
              keyword: "uniqueItems",
              message: "Array contains duplicate items at index " + u1 + " and " + u2
            });
            break;
          }
        }
      }
    }

    // prefixItems (OAS 3.1+)
    var prefixCount = 0;
    if (Array.isArray(schema.prefixItems)) {
      prefixCount = schema.prefixItems.length;
      for (var pi = 0; pi < Math.min(data.length, prefixCount); pi++) {
        validateSchema(data[pi], schema.prefixItems[pi], rootDoc, currentPath + "/" + pi, errors);
      }
    }

    // items validation
    if (schema.items !== undefined) {
      if (typeof schema.items === "boolean" || typeof schema.items === "object") {
        for (var ai = prefixCount; ai < data.length; ai++) {
          validateSchema(data[ai], schema.items, rootDoc, currentPath + "/" + ai, errors);
        }
      }
    }
  }

  // 7. Object constraints
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    var objKeys = Object.keys(data);

    if (schema.minProperties !== undefined && objKeys.length < schema.minProperties) {
      errors.push({
        path: currentPath || "/",
        keyword: "minProperties",
        message: "Object properties count " + objKeys.length + " is less than minProperties " + schema.minProperties
      });
    }
    if (schema.maxProperties !== undefined && objKeys.length > schema.maxProperties) {
      errors.push({
        path: currentPath || "/",
        keyword: "maxProperties",
        message: "Object properties count " + objKeys.length + " exceeds maxProperties " + schema.maxProperties
      });
    }

    // required properties
    if (Array.isArray(schema.required)) {
      for (var ri = 0; ri < schema.required.length; ri++) {
        var reqKey = schema.required[ri];
        if (!Object.prototype.hasOwnProperty.call(data, reqKey)) {
          errors.push({
            path: (currentPath ? currentPath + "/" : "/") + reqKey,
            keyword: "required",
            message: "Missing required property: " + reqKey
          });
        }
      }
    }

    // properties
    var definedProps = schema.properties || {};
    for (var propKey in definedProps) {
      if (Object.prototype.hasOwnProperty.call(definedProps, propKey) && Object.prototype.hasOwnProperty.call(data, propKey)) {
        validateSchema(data[propKey], definedProps[propKey], rootDoc, (currentPath ? currentPath + "/" : "/") + propKey, errors);
      }
    }

    // additionalProperties
    if (schema.additionalProperties !== undefined) {
      for (var ki = 0; ki < objKeys.length; ki++) {
        var kName = objKeys[ki];
        if (!Object.prototype.hasOwnProperty.call(definedProps, kName)) {
          if (schema.additionalProperties === false) {
            errors.push({
              path: (currentPath ? currentPath + "/" : "/") + kName,
              keyword: "additionalProperties",
              message: "Additional property '" + kName + "' is not allowed"
            });
          } else if (typeof schema.additionalProperties === "object") {
            validateSchema(data[kName], schema.additionalProperties, rootDoc, (currentPath ? currentPath + "/" : "/") + kName, errors);
          }
        }
      }
    }
  }

  // 8. Composition: allOf
  if (Array.isArray(schema.allOf)) {
    for (var aoi = 0; aoi < schema.allOf.length; aoi++) {
      validateSchema(data, schema.allOf[aoi], rootDoc, currentPath, errors);
    }
  }

  // 9. Composition: anyOf
  if (Array.isArray(schema.anyOf)) {
    var anyValid = false;
    for (var anyi = 0; anyi < schema.anyOf.length; anyi++) {
      var subErrors = [];
      validateSchema(data, schema.anyOf[anyi], rootDoc, currentPath, subErrors);
      if (subErrors.length === 0) {
        anyValid = true;
        break;
      }
    }
    if (!anyValid) {
      errors.push({
        path: currentPath || "/",
        keyword: "anyOf",
        message: "Data does not match any of the anyOf schemas"
      });
    }
  }

  // 10. Composition: oneOf
  if (Array.isArray(schema.oneOf)) {
    var matchCount = 0;
    for (var onei = 0; onei < schema.oneOf.length; onei++) {
      var oneSubErrors = [];
      validateSchema(data, schema.oneOf[onei], rootDoc, currentPath, oneSubErrors);
      if (oneSubErrors.length === 0) {
        matchCount++;
      }
    }
    if (matchCount !== 1) {
      errors.push({
        path: currentPath || "/",
        keyword: "oneOf",
        message: "Data must match exactly one of the oneOf schemas (matched " + matchCount + ")"
      });
    }
  }

  // 11. Composition: not
  if (schema.not !== undefined) {
    var notErrors = [];
    validateSchema(data, schema.not, rootDoc, currentPath, notErrors);
    if (notErrors.length === 0) {
      errors.push({
        path: currentPath || "/",
        keyword: "not",
        message: "Data should not match the schema specified in 'not'"
      });
    }
  }

  return errors;
}

if (typeof exports !== "undefined") {
  exports.validateSchema = validateSchema;
  exports.getType = getType;
  exports.deepEqual = deepEqual;
}
