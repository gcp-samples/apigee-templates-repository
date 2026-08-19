function convertGeminiEmbeddingsToOpenAi(geminiResponse, modelName) {
  if (!geminiResponse) return { object: "list", data: [], model: modelName || "gemini-embedding" };

  var values = [];
  if (geminiResponse.embedding && geminiResponse.embedding.values) {
    values = geminiResponse.embedding.values;
  } else if (geminiResponse.predictions && Array.isArray(geminiResponse.predictions) && geminiResponse.predictions.length > 0) {
    var pred = geminiResponse.predictions[0];
    if (pred.embeddings && pred.embeddings.values) {
      values = pred.embeddings.values;
    } else if (pred.values) {
      values = pred.values;
    }
  }

  return {
    object: "list",
    data: [
      {
        object: "embedding",
        index: 0,
        embedding: values
      }
    ],
    model: modelName || "gemini-embedding",
    usage: {
      prompt_tokens: 0,
      total_tokens: 0
    }
  };
}

if (typeof exports !== "undefined") {
  exports.convertGeminiEmbeddingsToOpenAi = convertGeminiEmbeddingsToOpenAi;
}
