import { describe, it, expect } from "vitest";
const { testAllowedModels } = require("../ai-functions/testAllowedModels.js");

describe("testAllowedModels", () => {
  it("should allow all models when allowedModelPatterns is ALL or not set", () => {
    expect(testAllowedModels({ allowedModelPatterns: "ALL" })).toBe(true);
    expect(testAllowedModels({})).toBe(true);
    expect(testAllowedModels(null)).toBe(true);
  });

  it("should validate allowed models for googlecloud type", () => {
    const reqInfo = {
      type: "googlecloud",
      url: "/publishers/google/models/gemini-1.5-pro",
      allowedModelPatterns: "gemini-1.5-pro;gemini-1.5-flash"
    };
    expect(testAllowedModels(reqInfo)).toBe(true);

    const disallowedReq = {
      type: "googlecloud",
      url: "/publishers/google/models/claude-3",
      allowedModelPatterns: "gemini-1.5-pro;gemini-1.5-flash"
    };
    expect(testAllowedModels(disallowedReq)).toBe(false);
  });

  it("should validate allowed models for oai type", () => {
    const reqInfo = {
      type: "oai",
      requestContent: { model: "gpt-4o" },
      allowedModelPatterns: "gpt-4o;gpt-4o-mini"
    };
    expect(testAllowedModels(reqInfo)).toBe(true);

    const disallowedReq = {
      type: "oai",
      requestContent: { model: "dall-e-3" },
      allowedModelPatterns: "gpt-4o;gpt-4o-mini"
    };
    expect(testAllowedModels(disallowedReq)).toBe(false);
  });
});
