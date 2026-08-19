import { describe, it, expect } from "vitest";
const { convertOpenAiPayload } = require("../ai-functions/convertOpenAiPayload.js");

describe("convertOpenAiPayload", () => {
  it("should dispatch google audio-text", () => {
    const payload = { input: "Speak this", voice: "nova" };
    const res = convertOpenAiPayload(payload, "google", "audio-text");
    expect(res.generation_config.response_modalities).toEqual(["AUDIO"]);
  });

  it("should dispatch google audio-data", () => {
    const payload = { fileBase64: "dGVzdA==" };
    const res = convertOpenAiPayload(payload, "google", "audio-data");
    expect(res.contents[0].parts[0].inlineData.data).toBe("dGVzdA==");
  });

  it("should dispatch google image-generation with imagen", () => {
    const payload = { prompt: "Artwork", model: "imagen-3.0-generate-002" };
    const res = convertOpenAiPayload(payload, "google", "image-generation");
    expect(res.instances[0].prompt).toBe("Artwork");
  });

  it("should dispatch google embeddings", () => {
    const payload = { input: "Text to embed" };
    const res = convertOpenAiPayload(payload, "google", "embeddings");
    expect(res.content.parts[0].text).toBe("Text to embed");
  });

  it("should dispatch anthropic chat text", () => {
    const payload = { messages: [{ role: "user", content: "Claude test" }] };
    const res = convertOpenAiPayload(payload, "anthropic", "text");
    expect(res.anthropic_version).toBe("vertex-2023-10-16");
    expect(res.messages[0].content).toBe("Claude test");
  });

  it("should return unchanged payload if unrecognized provider", () => {
    const payload = { messages: [] };
    expect(convertOpenAiPayload(payload, "openai", "text")).toBe(payload);
  });
});
