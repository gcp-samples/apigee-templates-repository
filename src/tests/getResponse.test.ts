import { describe, it, expect } from "vitest";
const { getResponse } = require("../ai-functions/getResponse.js");

describe("getResponse", () => {
  it("should extract response text from Gemini candidates", () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [{ text: "Gemini text response" }]
          }
        }
      ]
    };
    expect(getResponse(gemini)).toBe("Gemini text response");
  });

  it("should extract response text from OpenAI choices", () => {
    const oai = {
      choices: [
        { message: { content: "OpenAI text response" } }
      ]
    };
    expect(getResponse(oai)).toBe("OpenAI text response");
  });

  it("should extract response text from Claude content array", () => {
    const claude = {
      content: [
        { type: "text", text: "Claude text response" }
      ]
    };
    expect(getResponse(claude)).toBe("Claude text response");
  });

  it("should return empty string for null or empty responses", () => {
    expect(getResponse(null)).toBe("");
    expect(getResponse({})).toBe("");
  });
});
