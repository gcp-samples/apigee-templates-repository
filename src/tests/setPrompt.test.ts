import { describe, it, expect } from "vitest";
const { setPrompt } = require("../ai-functions/setPrompt.js");

describe("setPrompt", () => {
  it("should replace prompt in Gemini contents format", () => {
    const payload = {
      contents: [
        { role: "user", parts: [{ text: "Original prompt" }] }
      ]
    };
    const updated = setPrompt(payload, "Anonymized prompt");
    expect(updated.contents[0].parts[0].text).toBe("Anonymized prompt");
  });

  it("should replace prompt in OpenAI messages format", () => {
    const payload = {
      messages: [
        { role: "system", content: "You are an AI." },
        { role: "user", content: "Original prompt" }
      ]
    };
    const updated = setPrompt(payload, "Updated prompt");
    expect(updated.messages[1].content).toBe("Updated prompt");
  });

  it("should replace text in OpenAI array content format", () => {
    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Old text" }
          ]
        }
      ]
    };
    const updated = setPrompt(payload, "New text");
    expect(updated.messages[0].content[0].text).toBe("New text");
  });

  it("should return unchanged if no user role or null payload", () => {
    expect(setPrompt(null, "Test")).toBeNull();
    const noUser = { messages: [{ role: "system", content: "sys" }] };
    expect(setPrompt(noUser, "Test")).toEqual(noUser);
  });
});
