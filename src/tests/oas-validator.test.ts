import { describe, it, expect } from "vitest";

const oas = require("../oas/index");
const oasBundle = require("../oas-validator");

describe("OAS JSON Reference Resolver ($ref)", () => {
  const rootDoc = {
    openapi: "3.1.0",
    components: {
      schemas: {
        Pet: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            category: { $ref: "#/components/schemas/Category" }
          }
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" }
          }
        }
      }
    }
  };

  it("should resolve direct schema references", () => {
    const resolved = oas.resolveJsonPointer(rootDoc, "#/components/schemas/Pet");
    expect(resolved).toBeDefined();
    expect(resolved.type).toBe("object");
  });

  it("should resolve nested references via resolveSchemaRef", () => {
    const petSchema = oas.resolveSchemaRef(rootDoc, { $ref: "#/components/schemas/Pet" });
    expect(petSchema.required).toEqual(["id", "name"]);
    const catSchema = oas.resolveSchemaRef(rootDoc, petSchema.properties.category);
    expect(catSchema.properties.name.type).toBe("string");
  });

  it("should handle non-existent references gracefully", () => {
    const resolved = oas.resolveJsonPointer(rootDoc, "#/components/schemas/NonExistent");
    expect(resolved).toBeNull();
  });
});

describe("OAS Schema Validator - Primitives & Constraints", () => {
  it("validates string types and constraints (minLength, maxLength, pattern)", () => {
    const schema = {
      type: "string",
      minLength: 3,
      maxLength: 10,
      pattern: "^[a-z]+$"
    };
    expect(oas.validateSchema("abc", schema).length).toBe(0);
    expect(oas.validateSchema("ab", schema).length).toBe(1); // too short
    expect(oas.validateSchema("abcdefghijk", schema).length).toBe(1); // too long
    expect(oas.validateSchema("abc1", schema).length).toBe(1); // invalid pattern
    expect(oas.validateSchema(123, schema).length).toBe(1); // wrong type
  });

  it("validates string formats (email, uuid, date-time, uri, ipv4, byte)", () => {
    expect(oas.validateSchema("test@example.com", { type: "string", format: "email" }).length).toBe(0);
    expect(oas.validateSchema("not-an-email", { type: "string", format: "email" }).length).toBe(1);

    expect(oas.validateSchema("123e4567-e89b-12d3-a456-426614174000", { type: "string", format: "uuid" }).length).toBe(0);
    expect(oas.validateSchema("invalid-uuid", { type: "string", format: "uuid" }).length).toBe(1);

    expect(oas.validateSchema("2026-08-19T10:00:00Z", { type: "string", format: "date-time" }).length).toBe(0);
    expect(oas.validateSchema("https://api.example.com/v1", { type: "string", format: "uri" }).length).toBe(0);
    expect(oas.validateSchema("192.168.1.1", { type: "string", format: "ipv4" }).length).toBe(0);
    expect(oas.validateSchema("aGVsbG8gd29ybGQ=", { type: "string", format: "byte" }).length).toBe(0);
  });

  it("validates integer and number constraints (OAS 3.0 & 3.1 exclusive min/max)", () => {
    // OAS 3.0 boolean exclusiveMinimum
    const schema30 = { type: "integer", minimum: 5, exclusiveMinimum: true, maximum: 10 };
    expect(oas.validateSchema(5, schema30).length).toBe(1);
    expect(oas.validateSchema(6, schema30).length).toBe(0);
    expect(oas.validateSchema(10, schema30).length).toBe(0);
    expect(oas.validateSchema(11, schema30).length).toBe(1);

    // OAS 3.1 numeric exclusiveMinimum
    const schema31 = { type: "number", exclusiveMinimum: 0.5, exclusiveMaximum: 2.0 };
    expect(oas.validateSchema(0.5, schema31).length).toBe(1);
    expect(oas.validateSchema(1.2, schema31).length).toBe(0);
    expect(oas.validateSchema(2.0, schema31).length).toBe(1);

    // multipleOf
    expect(oas.validateSchema(15, { type: "integer", multipleOf: 5 }).length).toBe(0);
    expect(oas.validateSchema(14, { type: "integer", multipleOf: 5 }).length).toBe(1);
  });

  it("validates OAS 3.0 nullable vs OAS 3.1 multi-types", () => {
    // OAS 3.0 nullable: true
    const schema30 = { type: "string", nullable: true };
    expect(oas.validateSchema(null, schema30).length).toBe(0);
    expect(oas.validateSchema("hello", schema30).length).toBe(0);
    expect(oas.validateSchema(123, schema30).length).toBe(1);

    // OAS 3.1 type: ["string", "null"]
    const schema31 = { type: ["string", "null"] };
    expect(oas.validateSchema(null, schema31).length).toBe(0);
    expect(oas.validateSchema("world", schema31).length).toBe(0);
    expect(oas.validateSchema(false, schema31).length).toBe(1);
  });

  it("validates enum and const", () => {
    const enumSchema = { enum: ["user", "assistant", "system"] };
    expect(oas.validateSchema("user", enumSchema).length).toBe(0);
    expect(oas.validateSchema("admin", enumSchema).length).toBe(1);

    const constSchema = { const: "chat.completion" };
    expect(oas.validateSchema("chat.completion", constSchema).length).toBe(0);
    expect(oas.validateSchema("chat.completion.chunk", constSchema).length).toBe(1);
  });
});

describe("OAS Schema Validator - Arrays & Objects", () => {
  it("validates object properties and required keys", () => {
    const schema = {
      type: "object",
      required: ["name", "age"],
      properties: {
        name: { type: "string" },
        age: { type: "integer", minimum: 0 }
      },
      additionalProperties: false
    };

    expect(oas.validateSchema({ name: "Alice", age: 30 }, schema).length).toBe(0);
    expect(oas.validateSchema({ name: "Alice" }, schema).length).toBe(1); // missing age
    expect(oas.validateSchema({ name: "Alice", age: -1 }, schema).length).toBe(1); // age < 0
    expect(oas.validateSchema({ name: "Alice", age: 30, extra: true }, schema).length).toBe(1); // extra property
  });

  it("validates array items, minItems, maxItems, and uniqueItems", () => {
    const schema = {
      type: "array",
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
      items: { type: "string" }
    };

    expect(oas.validateSchema(["a", "b"], schema).length).toBe(0);
    expect(oas.validateSchema([], schema).length).toBe(1); // too few
    expect(oas.validateSchema(["a", "b", "c", "d"], schema).length).toBe(1); // too many
    expect(oas.validateSchema(["a", "a"], schema).length).toBe(1); // duplicates
    expect(oas.validateSchema(["a", 1], schema).length).toBe(1); // item type mismatch
  });

  it("validates composition (allOf, anyOf, oneOf, not)", () => {
    // allOf
    const allOfSchema = {
      allOf: [
        { type: "object", required: ["id"], properties: { id: { type: "integer" } } },
        { type: "object", required: ["name"], properties: { name: { type: "string" } } }
      ]
    };
    expect(oas.validateSchema({ id: 1, name: "Item" }, allOfSchema).length).toBe(0);
    expect(oas.validateSchema({ id: 1 }, allOfSchema).length).toBe(1);

    // oneOf
    const oneOfSchema = {
      oneOf: [
        { type: "string" },
        { type: "number" }
      ]
    };
    expect(oas.validateSchema("text", oneOfSchema).length).toBe(0);
    expect(oas.validateSchema(42, oneOfSchema).length).toBe(0);
    expect(oas.validateSchema(true, oneOfSchema).length).toBe(1);
  });
});

describe("OAS Path & Method Matcher", () => {
  const spec = {
    openapi: "3.1.0",
    servers: [{ url: "https://api.example.com/v1" }],
    paths: {
      "/chat/completions": {
        post: { operationId: "createChatCompletion" }
      },
      "/users/{userId}/orders/{orderId}": {
        get: { operationId: "getOrder" },
        delete: { operationId: "deleteOrder" }
      }
    }
  };

  it("matches exact path and method", () => {
    const res = oas.matchOasPath(spec, "/chat/completions", "POST");
    expect(res.matched).toBe(true);
    expect(res.operation.operationId).toBe("createChatCompletion");
  });

  it("matches path stripped of server base path", () => {
    const res = oas.matchOasPath(spec, "/v1/chat/completions", "POST");
    expect(res.matched).toBe(true);
    expect(res.operation.operationId).toBe("createChatCompletion");
  });

  it("matches templated paths and extracts path parameters", () => {
    const res = oas.matchOasPath(spec, "/v1/users/user-123/orders/ord-999", "GET");
    expect(res.matched).toBe(true);
    expect(res.operation.operationId).toBe("getOrder");
    expect(res.pathParams.userId).toBe("user-123");
    expect(res.pathParams.orderId).toBe("ord-999");
  });

  it("returns 405 Method Not Allowed when path matches but method does not", () => {
    const res = oas.matchOasPath(spec, "/chat/completions", "GET");
    expect(res.matched).toBe(false);
    expect(res.statusCode).toBe(405);
    expect(res.allowedMethods).toEqual(["POST"]);
  });

  it("returns 404 Route Not Found for unknown paths", () => {
    const res = oas.matchOasPath(spec, "/unknown/endpoint", "GET");
    expect(res.matched).toBe(false);
    expect(res.statusCode).toBe(404);
  });
});

describe("Complete OAS Request Validation (OAS 3.0, 3.1, 3.2)", () => {
  const openAiSpec = {
    openapi: "3.1.0",
    info: { title: "OpenAI Chat Completions API", version: "1.0.0" },
    paths: {
      "/v1/chat/completions": {
        post: {
          operationId: "createChatCompletion",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateChatCompletionRequest"
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        CreateChatCompletionRequest: {
          type: "object",
          required: ["model", "messages"],
          properties: {
            model: { type: "string" },
            messages: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/ChatCompletionMessage"
              }
            },
            temperature: {
              type: "number",
              minimum: 0,
              maximum: 2
            },
            stream: {
              type: "boolean"
            }
          }
        },
        ChatCompletionMessage: {
          type: "object",
          required: ["role", "content"],
          properties: {
            role: {
              type: "string",
              enum: ["system", "user", "assistant", "tool", "developer"]
            },
            content: {
              type: ["string", "array", "null"]
            }
          }
        }
      }
    }
  };

  it("validates a valid OpenAI chat completion request payload", () => {
    const req = {
      path: "/v1/chat/completions",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: "Hello!" }],
        temperature: 0.7,
        stream: false
      })
    };

    const res = oas.validateOasRequest(openAiSpec, req);
    expect(res.valid).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.errors.length).toBe(0);
  });

  it("flags missing required fields in request payload", () => {
    const req = {
      path: "/v1/chat/completions",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash"
        // missing messages
      })
    };

    const res = oas.validateOasRequest(openAiSpec, req);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.errors.some((e: any) => e.keyword === "required" && e.path === "/messages")).toBe(true);
  });

  it("flags invalid enum values in nested messages", () => {
    const req = {
      path: "/v1/chat/completions",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "invalid_role", content: "Hello!" }]
      })
    };

    const res = oas.validateOasRequest(openAiSpec, req);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.errors.some((e: any) => e.keyword === "enum" && e.path === "/messages/0/role")).toBe(true);
  });

  it("flags out-of-bounds numeric fields", () => {
    const req = {
      path: "/v1/chat/completions",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: "Hello!" }],
        temperature: 3.5 // max is 2
      })
    };

    const res = oas.validateOasRequest(openAiSpec, req);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.errors.some((e: any) => e.keyword === "maximum" && e.path === "/temperature")).toBe(true);
  });

  it("flags malformed JSON body", () => {
    const req = {
      path: "/v1/chat/completions",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ model: invalid json ... "
    };

    const res = oas.validateOasRequest(openAiSpec, req);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.errors.some((e: any) => e.keyword === "json")).toBe(true);
  });
});

describe("Apigee Runtime Adapter (validateApigeeRequest)", () => {
  const specObj = {
    openapi: "3.0.3",
    paths: {
      "/items": {
        post: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sku", "quantity"],
                  properties: {
                    sku: { type: "string" },
                    quantity: { type: "integer", minimum: 1 }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  it("reads flow variables from mock Apigee context and sets validation variables", () => {
    const variables: Record<string, any> = {
      "oas.spec": JSON.stringify(specObj),
      "proxy.pathsuffix": "/items",
      "request.verb": "POST",
      "request.header.Content-Type": "application/json",
      "request.content": JSON.stringify({ sku: "ABC-123", quantity: 5 })
    };

    // Mock global Apigee context
    (global as any).context = {
      getVariable: (name: string) => variables[name],
      setVariable: (name: string, val: any) => {
        variables[name] = val;
      }
    };

    const res = oas.validateApigeeRequest();
    expect(res.valid).toBe(true);
    expect(variables["oas.validation.valid"]).toBe("true");
    expect(variables["oas.validation.status_code"]).toBe("200");
    expect(variables["oas.validation.error_count"]).toBe("0");

    // Clean up
    delete (global as any).context;
  });

  it("sets failure variables on invalid request in Apigee context", () => {
    const variables: Record<string, any> = {
      "oas.spec": JSON.stringify(specObj),
      "proxy.pathsuffix": "/items",
      "request.verb": "POST",
      "request.header.Content-Type": "application/json",
      "request.content": JSON.stringify({ sku: "ABC-123", quantity: 0 }) // quantity < 1
    };

    (global as any).context = {
      getVariable: (name: string) => variables[name],
      setVariable: (name: string, val: any) => {
        variables[name] = val;
      }
    };

    const res = oas.validateApigeeRequest();
    expect(res.valid).toBe(false);
    expect(variables["oas.validation.valid"]).toBe("false");
    expect(variables["oas.validation.status_code"]).toBe("400");
    expect(variables["oas.validation.error_count"]).toBe("1");

    delete (global as any).context;
  });
});

describe("Bundled ES5 oas-validator.js Export Compatibility", () => {
  it("bundles all functions and executes correctly in standalone format", () => {
    expect(typeof oasBundle.validateOasRequest).toBe("function");
    expect(typeof oasBundle.validateSchema).toBe("function");
    expect(typeof oasBundle.matchOasPath).toBe("function");
    expect(typeof oasBundle.validateApigeeRequest).toBe("function");

    const schema = { type: "string" };
    expect(oasBundle.validateSchema("hello", schema).length).toBe(0);
    expect(oasBundle.validateSchema(123, schema).length).toBe(1);
  });
});
