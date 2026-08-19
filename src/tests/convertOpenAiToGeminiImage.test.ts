import { describe, it, expect } from "vitest";
const { convertOpenAiToGeminiImage } = require("../ai-functions/convertOpenAiToGeminiImage.js");

describe("convertOpenAiToGeminiImage", () => {
  it("should convert OpenAI image generation request to Gemini generateContent with IMAGE modality", () => {
    const oai = {
      prompt: "An astronaut riding a horse",
      aspect_ratio: "1:1"
    };
    const gemini = convertOpenAiToGeminiImage(oai);
    expect(gemini.contents[0].parts[0].text).toBe("An astronaut riding a horse");
    expect(gemini.generationConfig.responseModalities).toEqual(["IMAGE"]);
    expect(gemini.generationConfig.aspectRatio).toBe("1:1");
  });
});
