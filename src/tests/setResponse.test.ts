import { describe, it, expect } from "vitest";
const { setResponse } = require("../ai-functions/setResponse.js");

describe("setResponse", () => {
  it("should set response in Gemini candidates", () => {
    const gemini = {
      candidates: [
        { content: { parts: [{ text: "Old" }] } }
      ]
    };
    setResponse(gemini, "New Gemini");
    expect(gemini.candidates[0].content.parts[0].text).toBe("New Gemini");
  });

  it("should set response in OpenAI choices", () => {
    const oai = {
      choices: [
        { message: { content: "Old" } }
      ]
    };
    setResponse(oai, "New OAI");
    expect(oai.choices[0].message.content).toBe("New OAI");
  });

  it("should set response in Claude content", () => {
    const claude = {
      content: [
        { type: "text", text: "Old" }
      ]
    };
    setResponse(claude, "New Claude");
    expect(claude.content[0].text).toBe("New Claude");
  });

  it("should return null/unchanged for empty inputs", () => {
    expect(setResponse(null, "Test")).toBeNull();
  });
});
