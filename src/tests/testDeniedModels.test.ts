import { describe, it, expect } from "vitest";
const { testDeniedModels } = require("../ai-functions/testDeniedModels.js");

describe("testDeniedModels", () => {
  it("should allow when deniedModelPatterns is NONE or not set", () => {
    expect(testDeniedModels({ deniedModelPatterns: "NONE" })).toBe(true);
    expect(testDeniedModels({})).toBe(true);
    expect(testDeniedModels(null)).toBe(true);
  });

  it("should block denied models for googlecloud", () => {
    const reqInfo = {
      type: "googlecloud",
      url: "/publishers/google/models/banned-model",
      deniedModelPatterns: "banned-model;legacy-model"
    };
    expect(testDeniedModels(reqInfo)).toBe(false);

    const allowedReq = {
      type: "googlecloud",
      url: "/publishers/google/models/gemini-1.5-pro",
      deniedModelPatterns: "banned-model;legacy-model"
    };
    expect(testDeniedModels(allowedReq)).toBe(true);
  });

  it("should block denied models for oai", () => {
    const reqInfo = {
      type: "oai",
      requestContent: { model: "gpt-3.5-turbo" },
      deniedModelPatterns: "gpt-3.5-turbo"
    };
    expect(testDeniedModels(reqInfo)).toBe(false);
  });
});
