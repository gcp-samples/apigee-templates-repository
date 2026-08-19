import { describe, it, expect } from "vitest";
const { getUsageData } = require("../ai-functions/getUsageData.js");

describe("getUsageData", () => {
  it("should extract token counts from standard OpenAI response", () => {
    const resp = JSON.stringify({
      model: "gpt-4o",
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40
      }
    });
    const usage = getUsageData(resp);
    expect(usage.model).toBe("gpt-4o");
    expect(usage.requestTokenCount).toBe(15);
    expect(usage.responseTokenCount).toBe(25);
    expect(usage.totalTokenCount).toBe(40);
    expect(usage.usageFound).toBe(true);
  });

  it("should extract token counts from Claude message response", () => {
    const resp = JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      usage: {
        input_tokens: 120,
        output_tokens: 85
      }
    });
    const usage = getUsageData(resp);
    expect(usage.model).toBe("claude-3-5-sonnet-20241022");
    expect(usage.requestTokenCount).toBe(120);
    expect(usage.responseTokenCount).toBe(85);
    expect(usage.totalTokenCount).toBe(205);
    expect(usage.usageFound).toBe(true);
  });

  it("should extract token counts from Gemini usageMetadata", () => {
    const resp = JSON.stringify({
      modelVersion: "gemini-1.5-flash-002",
      usageMetadata: {
        promptTokenCount: 50,
        candidatesTokenCount: 30,
        totalTokenCount: 80
      }
    });
    const usage = getUsageData(resp);
    expect(usage.model).toBe("gemini-1.5-flash-002");
    expect(usage.requestTokenCount).toBe(50);
    expect(usage.responseTokenCount).toBe(30);
    expect(usage.totalTokenCount).toBe(80);
    expect(usage.usageFound).toBe(true);
  });

  it("should safely ignore [DONE], ping, and streaming control frames", () => {
    expect(getUsageData("data: [DONE]").usageFound).toBe(false);
    expect(getUsageData("event: ping\ndata: {}").usageFound).toBe(false);
    expect(getUsageData(null).usageFound).toBe(false);
    expect(getUsageData("").usageFound).toBe(false);
  });
});
