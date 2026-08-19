function convertOpenAiToGeminiEmbeddings(openAiPayload) {
  if (!openAiPayload) return { content: { parts: [] } };

  var rawInput = openAiPayload.input || "";
  var textStr = "";

  if (Array.isArray(rawInput)) {
    textStr = rawInput.length > 0 ? (typeof rawInput[0] === "string" ? rawInput[0] : JSON.stringify(rawInput[0])) : "";
  } else if (typeof rawInput === "string") {
    textStr = rawInput;
  }

  return {
    content: {
      parts: [
        { text: textStr }
      ]
    }
  };
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToGeminiEmbeddings = convertOpenAiToGeminiEmbeddings;
}
