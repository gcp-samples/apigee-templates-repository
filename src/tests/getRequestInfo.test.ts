import { describe, it, expect } from "vitest";
const { getRequestInfo } = require("../ai-functions/getRequestInfo.js");

describe("getRequestInfo", () => {
  it("should detect audio-text request from URL and payload", () => {
    const info = getRequestInfo("/v1/audio/speech", { model: "tts-1", input: "Hello" });
    expect(info.requestType).toBe("audio-text");
    expect(info.modelName).toBe("tts-1");
    expect(info.input).toBe("Hello");
  });

  it("should detect audio-data request from URL", () => {
    const info = getRequestInfo("/v1/audio/transcriptions", { model: "whisper-1" });
    expect(info.requestType).toBe("audio-data");
    expect(info.protocol).toBe("openai");
  });

  it("should detect image-generation request from URL", () => {
    const info = getRequestInfo("/v1/images/generations", { model: "dall-e-3", prompt: "Art" });
    expect(info.requestType).toBe("image-generation");
    expect(info.input).toBe("Art");
  });

  it("should detect embeddings request from URL", () => {
    const info = getRequestInfo("/v1/embeddings", { model: "text-embedding-3-small", input: "Test" });
    expect(info.requestType).toBe("embeddings");
    expect(info.input).toBe("Test");
  });

  it("should detect Google protocol from contents payload", () => {
    const googlePayload = {
      contents: [{ role: "user", parts: [{ text: "Gemini prompt" }] }]
    };
    const info = getRequestInfo("/publishers/google/models/gemini-1.5-pro:generateContent", googlePayload);
    expect(info.protocol).toBe("google");
    expect(info.modelName).toBe("gemini-1.5-pro");
    expect(info.input).toBe("Gemini prompt");
  });

  it("should detect Anthropic protocol from system or anthropic_version in messages payload", () => {
    const anthropicPayload = {
      model: "claude-3-5-sonnet",
      system: "System instructions",
      messages: [{ role: "user", content: "Claude prompt" }]
    };
    const info = getRequestInfo("", anthropicPayload);
    expect(info.protocol).toBe("anthropic");
    expect(info.input).toBe("Claude prompt");
  });

  it("should handle stringified JSON content and GCP publisher URL format", () => {
    const info = getRequestInfo("/publishers/anthropic/models/claude-3-opus:rawPredict", JSON.stringify({
      messages: [{ role: "user", content: "Opus prompt" }]
    }));
    expect(info.modelName).toBe("claude-3-opus");
    expect(info.protocol).toBe("anthropic");
    expect(info.input).toBe("Opus prompt");
  });
});
