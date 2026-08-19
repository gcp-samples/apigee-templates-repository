import { describe, it, expect } from "vitest";
const { convertOpenAiToImagen } = require("../ai-functions/convertOpenAiToImagen.js");

describe("convertOpenAiToImagen", () => {
  it("should convert OpenAI image generation request to Vertex Imagen predict format", () => {
    const oai = {
      prompt: "A futuristic city in watercolor",
      n: 2,
      response_format: "b64_json",
      aspect_ratio: "16:9"
    };
    const imagen = convertOpenAiToImagen(oai);
    expect(imagen.instances[0].prompt).toBe("A futuristic city in watercolor");
    expect(imagen.parameters.sampleCount).toBe(2);
    expect(imagen.parameters.outputOptions.mimeType).toBe("image/jpeg");
    expect(imagen.parameters.aspectRatio).toBe("16:9");
  });
});
