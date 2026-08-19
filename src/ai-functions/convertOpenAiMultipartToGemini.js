function convertOpenAiMultipartToGemini(multipartData) {
  if (!multipartData) return {};

  var mimeType = multipartData.fileMimeType || "audio/mp3";
  var base64Data = multipartData.fileBase64 || "";
  var promptText = multipartData.prompt || "Transcribe this audio file accurately.";

  if (multipartData.language) {
    promptText += " The spoken language is " + multipartData.language + ".";
  }

  var parts = [];
  if (base64Data) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  parts.push({
    text: promptText
  });

  return {
    contents: [
      {
        role: "user",
        parts: parts
      }
    ]
  };
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiMultipartToGemini = convertOpenAiMultipartToGemini;
}
