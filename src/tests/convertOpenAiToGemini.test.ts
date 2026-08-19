import { describe, it, expect } from "vitest";
const { convertOpenAiToGemini } = require("../ai-functions/convertOpenAiToGemini.js");

describe("convertOpenAiToGemini", () => {
  it("should convert system message to systemInstruction and user/assistant to contents", () => {
    const oai = {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" }
      ],
      temperature: 0.7,
      max_tokens: 500,
      stop: ["STOP"]
    };

    const gemini = convertOpenAiToGemini(oai);
    expect(gemini.systemInstruction).toEqual({ parts: [{ text: "You are a helpful assistant." }] });
    expect(gemini.contents).toHaveLength(2);
    expect(gemini.contents[0]).toEqual({ role: "user", parts: [{ text: "Hello" }] });
    expect(gemini.contents[1]).toEqual({ role: "model", parts: [{ text: "Hi there!" }] });
    expect(gemini.generationConfig).toEqual({
      temperature: 0.7,
      maxOutputTokens: 500,
      stopSequences: ["STOP"]
    });
  });

  it("should handle empty or null payload", () => {
    expect(convertOpenAiToGemini(null)).toEqual({});
  });
});
