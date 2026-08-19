import { describe, it, expect } from "vitest";
const { getModelTokenLimit } = require("../ai-functions/getModelTokenLimit.js");

describe("getModelTokenLimit", () => {
  const quotaData = [
    {
      llmOperations: [{ model: "gemini-1.5-pro" }],
      llmTokenQuota: { limit: "50000" }
    },
    {
      llmOperations: [{ model: "google/gemini-1.5-flash" }],
      llmTokenQuota: { limit: "100000" }
    }
  ];

  it("should return limit for exact and provider-stripped model name", () => {
    expect(getModelTokenLimit("gemini-1.5-pro", quotaData)).toBe("50000");
    expect(getModelTokenLimit("google/gemini-1.5-pro", quotaData)).toBe("50000");
    expect(getModelTokenLimit("gemini-1.5-flash", quotaData)).toBe("100000");
  });

  it("should return -1 when model not found or data missing", () => {
    expect(getModelTokenLimit("unknown-model", quotaData)).toBe(-1);
    expect(getModelTokenLimit(null, quotaData)).toBe(-1);
    expect(getModelTokenLimit("gemini-1.5-pro", null)).toBe(-1);
  });
});
