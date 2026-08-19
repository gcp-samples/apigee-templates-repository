import { describe, it, expect } from "vitest";
const {
  getBodyString,
  extractGoogleInput,
  extractMessagesInput,
  encodeBytesToBase64,
  decodeBase64ToBytes,
  getModelName,
  getPrompts
} = require("../ai-functions/utilities.js");

describe("utilities.js", () => {
  describe("getBodyString", () => {
    it("should return empty string for null/undefined", () => {
      expect(getBodyString(null)).toBe("");
      expect(getBodyString(undefined)).toBe("");
    });

    it("should return string content unchanged", () => {
      expect(getBodyString("content body")).toBe("content body");
    });

    it("should stringify non-string values", () => {
      expect(getBodyString(456)).toBe("456");
    });
  });

  describe("extractGoogleInput", () => {
    it("should extract text from the last user content parts", () => {
      const contents = [
        { role: "user", parts: [{ text: "first message" }] },
        { role: "model", parts: [{ text: "model reply" }] },
        { role: "user", parts: [{ text: "second message" }] }
      ];
      expect(extractGoogleInput(contents)).toBe("second message");
    });

    it("should handle multiple parts in the last user message", () => {
      const contents = [
        { role: "user", parts: [{ text: "part 1" }, { text: "part 2" }] }
      ];
      expect(extractGoogleInput(contents)).toBe("part 2");
    });

    it("should return empty string for missing or non-array contents", () => {
      expect(extractGoogleInput(null)).toBe("");
      expect(extractGoogleInput(undefined)).toBe("");
      expect(extractGoogleInput([])).toBe("");
    });
  });

  describe("extractMessagesInput", () => {
    it("should extract text from the last user message with string content", () => {
      const messages = [
        { role: "system", content: "system prompt" },
        { role: "user", content: "user question 1" },
        { role: "assistant", content: "answer 1" },
        { role: "user", content: "user question 2" }
      ];
      expect(extractMessagesInput(messages)).toBe("user question 2");
    });

    it("should extract and join array text parts", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "part one" },
            { type: "text", text: "part two" }
          ]
        }
      ];
      expect(extractMessagesInput(messages)).toBe("part one part two");
    });

    it("should return empty string for null, empty or non-user messages", () => {
      expect(extractMessagesInput(null)).toBe("");
      expect(extractMessagesInput([])).toBe("");
    });
  });

  describe("encodeBytesToBase64 & decodeBase64ToBytes", () => {
    it("should encode and decode base64 strings correctly", () => {
      const original = "Hello Apigee ES5 Utilities!";
      const encoded = encodeBytesToBase64(original);
      expect(encoded).toBe(Buffer.from(original).toString("base64"));
      const decoded = decodeBase64ToBytes(encoded);
      expect(decoded.toString()).toBe(original);
    });

    it("should handle empty inputs gracefully", () => {
      expect(encodeBytesToBase64(null)).toBe("");
      expect(decodeBase64ToBytes(null)).toBe("");
      expect(encodeBytesToBase64("")).toBe("");
      expect(decodeBase64ToBytes("")).toBe("");
    });
  });

  describe("getModelName & getPrompts", () => {
    it("should extract model name and prompts via getRequestInfo delegation", () => {
      expect(getModelName(null, JSON.stringify({ model: "openai/gpt-4o" }))).toBe("gpt-4o");
      expect(getModelName("/publishers/google/models/gemini-1.5-pro:generateContent", null)).toBe("gemini-1.5-pro");

      const prompts = getPrompts({ messages: [{ role: "user", content: "Hello" }] });
      expect(prompts.userPrompt).toBe("Hello");
      expect(prompts.protocol).toBe("openai");
    });
  });
});
