function convertOpenAiToGeminiImage(openAiPayload) {
  if (!openAiPayload) return { contents: [] };

  var promptText = openAiPayload.prompt || "";
  var config = {
    responseModalities: ["IMAGE"]
  };

  if (openAiPayload.aspect_ratio) {
    config.aspectRatio = openAiPayload.aspect_ratio;
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: config
  };
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToGeminiImage = convertOpenAiToGeminiImage;
}
