function convertOpenAiToImagen(openAiPayload) {
  if (!openAiPayload) return { instances: [] };

  var promptText = openAiPayload.prompt || "";
  var sampleCount = openAiPayload.n || 1;

  var parameters = {};
  if (openAiPayload.response_format === "b64_json") {
    parameters.outputOptions = { mimeType: "image/jpeg" };
  }
  if (openAiPayload.aspect_ratio) {
    parameters.aspectRatio = openAiPayload.aspect_ratio;
  }
  if (sampleCount) {
    parameters.sampleCount = sampleCount;
  }

  return {
    instances: [{ prompt: promptText }],
    parameters: parameters
  };
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToImagen = convertOpenAiToImagen;
}
