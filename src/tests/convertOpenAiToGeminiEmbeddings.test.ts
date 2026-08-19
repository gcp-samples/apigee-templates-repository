import { describe, it, expect } from "vitest";
const { convertOpenAiToGeminiEmbeddings } = require("../ai-functions/convertOpenAiToGeminiEmbeddings.js");

describe("convertOpenAiToGeminiEmbeddings", () => {
  it("should format string input", () => {
    const res = convertOpenAiToGeminiEmbeddings({ input: "Sample embedding text" });
    expect(res.content.parts[0].text).toBe("Sample embedding text");
  });

  it("should format array input", () => {
    const res = convertOpenAiToGeminiEmbeddings({ input: ["First string", "Second"] });
    expect(res.content.parts[0].text).toBe("First string");
  });
});
