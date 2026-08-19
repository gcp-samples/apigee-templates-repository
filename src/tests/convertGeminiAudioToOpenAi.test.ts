import { describe, it, expect } from "vitest";
const { convertGeminiAudioToOpenAi } = require("../ai-functions/convertGeminiAudioToOpenAi.js");

describe("convertGeminiAudioToOpenAi", () => {
  it("should extract base64 audio and mimeType from Gemini candidates", () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/mp3",
                  data: "Base64AudioData=="
                }
              }
            ]
          }
        }
      ]
    };

    const res = convertGeminiAudioToOpenAi(gemini);
    expect(res.base64Data).toBe("Base64AudioData==");
    expect(res.mimeType).toBe("audio/mp3");
  });
});
