function convertGeminiAudioToOpenAi(geminiResponse) {
  var responseData = geminiResponse;
  if (typeof geminiResponse === "string") {
    try {
      responseData = JSON.parse(geminiResponse);
    } catch (e) {}
  }

  var base64Data = "";
  var mimeType = "audio/mpeg";

  if (responseData && responseData.candidates && Array.isArray(responseData.candidates) && responseData.candidates.length > 0) {
    var cand = responseData.candidates[0];
    if (cand && cand.content && cand.content.parts && Array.isArray(cand.content.parts) && cand.content.parts.length > 0) {
      for (var i = 0; i < cand.content.parts.length; i++) {
        var part = cand.content.parts[i];
        if (part) {
          var inline = part.inlineData || part.inline_data;
          if (inline && inline.data) {
            base64Data = inline.data;
            if (inline.mimeType) {
              mimeType = inline.mimeType;
            } else if (inline.mime_type) {
              mimeType = inline.mime_type;
            }
            break;
          }
        }
      }
    }
  }

  return {
    base64Data: base64Data,
    mimeType: mimeType
  };
}

if (typeof exports !== "undefined") {
  exports.convertGeminiAudioToOpenAi = convertGeminiAudioToOpenAi;
}
