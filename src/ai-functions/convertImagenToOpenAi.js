function convertImagenToOpenAi(imagenResponse, modelName) {
  if (!imagenResponse) return { created: Math.floor(Date.now() / 1000), data: [] };

  var openAiResponse = {
    created: Math.floor(Date.now() / 1000),
    data: []
  };

  if (imagenResponse.predictions && Array.isArray(imagenResponse.predictions)) {
    for (var i = 0; i < imagenResponse.predictions.length; i++) {
      var pred = imagenResponse.predictions[i];
      if (pred && pred.bytesBase64Encoded) {
        openAiResponse.data.push({
          b64_json: pred.bytesBase64Encoded
        });
      } else if (pred && pred.gcsUri) {
        openAiResponse.data.push({
          url: pred.gcsUri
        });
      }
    }
  } else if (imagenResponse.candidates && Array.isArray(imagenResponse.candidates)) {
    for (var c = 0; c < imagenResponse.candidates.length; c++) {
      var cand = imagenResponse.candidates[c];
      if (cand && cand.content && cand.content.parts && Array.isArray(cand.content.parts)) {
        for (var p = 0; p < cand.content.parts.length; p++) {
          var part = cand.content.parts[p];
          if (part) {
            var inline = part.inlineData || part.inline_data;
            if (inline && inline.data) {
              openAiResponse.data.push({
                b64_json: inline.data
              });
            }
          }
        }
      }
    }
  }

  return openAiResponse;
}

if (typeof exports !== "undefined") {
  exports.convertImagenToOpenAi = convertImagenToOpenAi;
}
