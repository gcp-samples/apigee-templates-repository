import { describe, it, expect } from "vitest";
const { convertOpenAiToGeminiAudio } = require("../ai-functions/convertOpenAiToGeminiAudio.js");

describe("convertOpenAiToGeminiAudio", () => {
  it("should convert speech payload and map voices to Gemini prebuilt voices", () => {
    const oai = {
      model: "tts-1",
      input: "Text to speak",
      voice: "nova"
    };
    const gemini = convertOpenAiToGeminiAudio(oai);
    expect(gemini.contents[0].parts[0].text).toBe("Text to speak");
    expect(gemini.generation_config.response_modalities).toEqual(["AUDIO"]);
    expect(gemini.generation_config.speech_config.voice_config.prebuilt_voice_config.voice_name).toBe("Aoede");
  });

  it("should handle custom or fallback voices", () => {
    const custom = convertOpenAiToGeminiAudio({ input: "Test", voice: "CustomVoice" });
    expect(custom.generation_config.speech_config.voice_config.prebuilt_voice_config.voice_name).toBe("CustomVoice");
  });
});
