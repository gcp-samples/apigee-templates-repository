import { describe, it, expect } from "vitest";
const { convertGeminiToOpenAi } = require("../ai-functions/convertGeminiToOpenAi.js");

describe("convertGeminiToOpenAi", () => {
  it("should convert Gemini candidates and usage to OpenAI format", () => {
    const gemini = {
      candidates: [
        {
          index: 0,
          content: {
            parts: [{ text: "Gemini answer" }]
          },
          finishReason: "STOP"
        }
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30
      }
    };

    const oai = convertGeminiToOpenAi(gemini, "gemini-1.5-pro");
    expect(oai.model).toBe("gemini-1.5-pro");
    expect(oai.choices[0].message.content).toBe("Gemini answer");
    expect(oai.choices[0].finish_reason).toBe("stop");
    expect(oai.usage.prompt_tokens).toBe(10);
    expect(oai.usage.completion_tokens).toBe(20);
    expect(oai.usage.total_tokens).toBe(30);
  });

  it("should map finish reasons correctly (MAX_TOKENS -> length, SAFETY -> content_filter)", () => {
    const maxTokensResp = convertGeminiToOpenAi({
      candidates: [{ content: { parts: [{ text: "cut off" }] }, finishReason: "MAX_TOKENS" }]
    });
    expect(maxTokensResp.choices[0].finish_reason).toBe("length");

    const safetyResp = convertGeminiToOpenAi({
      candidates: [{ content: { parts: [{ text: "blocked" }] }, finishReason: "SAFETY" }]
    });
    expect(safetyResp.choices[0].finish_reason).toBe("content_filter");
  });
});
