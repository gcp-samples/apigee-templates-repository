function convertOpenAiToGemini(openAiPayload) {
  if (!openAiPayload) return {};

  var geminiPayload = {
    contents: []
  };

  if (openAiPayload.messages && Array.isArray(openAiPayload.messages)) {
    var systemInstructionParts = [];

    for (var i = 0; i < openAiPayload.messages.length; i++) {
      var msg = openAiPayload.messages[i];
      if (!msg) continue;
      var role = msg.role;
      var content = msg.content;

      if (role === "system" || role === "developer") {
        if (typeof content === "string") {
          systemInstructionParts.push({ text: content });
        } else if (Array.isArray(content)) {
          for (var j = 0; j < content.length; j++) {
            if (content[j] && content[j].type === "text" && content[j].text) {
              systemInstructionParts.push({ text: content[j].text });
            } else if (typeof content[j] === "string") {
              systemInstructionParts.push({ text: content[j] });
            }
          }
        }
      } else {
        var geminiRole = (role === "assistant") ? "model" : "user";
        var parts = [];

        if (typeof content === "string") {
          parts.push({ text: content });
        } else if (Array.isArray(content)) {
          for (var k = 0; k < content.length; k++) {
            if (content[k] && content[k].type === "text" && content[k].text) {
              parts.push({ text: content[k].text });
            } else if (typeof content[k] === "string") {
              parts.push({ text: content[k] });
            }
          }
        }

        if (parts.length > 0) {
          geminiPayload.contents.push({
            role: geminiRole,
            parts: parts
          });
        }
      }
    }

    if (systemInstructionParts.length > 0) {
      geminiPayload.systemInstruction = {
        parts: systemInstructionParts
      };
    }
  }

  var generationConfig = {};
  if (openAiPayload.temperature !== undefined) generationConfig.temperature = openAiPayload.temperature;
  if (openAiPayload.top_p !== undefined) generationConfig.topP = openAiPayload.top_p;
  if (openAiPayload.max_tokens !== undefined) generationConfig.maxOutputTokens = openAiPayload.max_tokens;
  else if (openAiPayload.max_completion_tokens !== undefined) generationConfig.maxOutputTokens = openAiPayload.max_completion_tokens;
  if (openAiPayload.stop !== undefined) {
    generationConfig.stopSequences = Array.isArray(openAiPayload.stop) ? openAiPayload.stop : [openAiPayload.stop];
  }

  if (Object.keys(generationConfig).length > 0) {
    geminiPayload.generationConfig = generationConfig;
  }

  return geminiPayload;
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToGemini = convertOpenAiToGemini;
}
