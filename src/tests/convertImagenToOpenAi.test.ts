import { describe, it, expect } from "vitest";
const { convertImagenToOpenAi } = require("../ai-functions/convertImagenToOpenAi.js");

describe("convertImagenToOpenAi", () => {
  it("should convert Imagen predictions to OpenAI image list", () => {
    const imagen = {
      predictions: [
        { bytesBase64Encoded: "base64image1" },
        { gcsUri: "gs://bucket/image2.png" }
      ]
    };
    const res = convertImagenToOpenAi(imagen, "imagen-3.0");
    expect(res.data).toHaveLength(2);
    expect(res.data[0].b64_json).toBe("base64image1");
    expect(res.data[1].url).toBe("gs://bucket/image2.png");
  });

  it("should convert Gemini candidate inlineData images", () => {
    const geminiImage = {
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "gemini_b64_image" } }
            ]
          }
        }
      ]
    };
    const res = convertImagenToOpenAi(geminiImage);
    expect(res.data[0].b64_json).toBe("gemini_b64_image");
  });
});
