import { describe, it, expect } from "vitest";
const { convertOpenAiMultipartToGemini } = require("../ai-functions/convertOpenAiMultipartToGemini.js");

describe("convertOpenAiMultipartToGemini", () => {
  it("should convert parsed multipart data to Gemini format with language", () => {
    const multipart = {
      model: "google/gemini-2.0-flash",
      prompt: "Transcribe audio",
      language: "fr",
      fileMimeType: "audio/wav",
      fileBase64: "dGVzdA=="
    };

    const geminiReq = convertOpenAiMultipartToGemini(multipart);
    expect(geminiReq.contents[0].role).toBe("user");
    expect(geminiReq.contents[0].parts[0]).toEqual({
      inlineData: {
        mimeType: "audio/wav",
        data: "dGVzdA=="
      }
    });
    expect(geminiReq.contents[0].parts[1].text).toContain("Transcribe audio");
    expect(geminiReq.contents[0].parts[1].text).toContain("spoken language is fr");
  });

  it("should provide default transcription prompt if none provided", () => {
    const multipart = {
      fileBase64: "dGVzdA==",
      fileMimeType: "audio/mp3"
    };

    const geminiReq = convertOpenAiMultipartToGemini(multipart);
    expect(geminiReq.contents[0].parts[1].text).toBe("Transcribe this audio file accurately.");
  });

  it("should return empty object for null input", () => {
    expect(convertOpenAiMultipartToGemini(null)).toEqual({});
  });
});
