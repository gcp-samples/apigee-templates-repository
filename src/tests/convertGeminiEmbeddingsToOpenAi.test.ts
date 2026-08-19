import { describe, it, expect } from "vitest";
const { convertGeminiEmbeddingsToOpenAi } = require("../ai-functions/convertGeminiEmbeddingsToOpenAi.js");

describe("convertGeminiEmbeddingsToOpenAi", () => {
  it("should convert Gemini embedding values to OpenAI embedding format", () => {
    const gemini = {
      embedding: {
        values: [0.1, 0.2, 0.3, 0.4]
      }
    };
    const res = convertGeminiEmbeddingsToOpenAi(gemini, "text-embedding-004");
    expect(res.object).toBe("list");
    expect(res.data[0].embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(res.model).toBe("text-embedding-004");
  });

  it("should convert Vertex predictions embedding values", () => {
    const vertex = {
      predictions: [
        { embeddings: { values: [0.5, 0.6] } }
      ]
    };
    const res = convertGeminiEmbeddingsToOpenAi(vertex, "textembedding-gecko");
    expect(res.data[0].embedding).toEqual([0.5, 0.6]);
  });
});
