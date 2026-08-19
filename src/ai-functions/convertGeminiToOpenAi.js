function convertGeminiToOpenAi(geminiResponse, modelName) {
  if (!geminiResponse) return {};

  var openAiResponse = {
    id: "chatcmpl-" + Math.random().toString(36).substring(2, 11),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: modelName || "gemini",
    choices: [],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  };

  if (geminiResponse.candidates && Array.isArray(geminiResponse.candidates)) {
    for (var i = 0; i < geminiResponse.candidates.length; i++) {
      var candidate = geminiResponse.candidates[i];
      var text = "";

      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        for (var p = 0; p < candidate.content.parts.length; p++) {
          if (candidate.content.parts[p] && candidate.content.parts[p].text) {
            text += candidate.content.parts[p].text;
          }
        }
      }

      var finishReason = "stop";
      if (candidate.finishReason) {
        if (candidate.finishReason === "MAX_TOKENS") finishReason = "length";
        else if (candidate.finishReason === "SAFETY") finishReason = "content_filter";
        else finishReason = candidate.finishReason.toLowerCase();
      }

      openAiResponse.choices.push({
        index: candidate.index !== undefined ? candidate.index : i,
        message: {
          role: "assistant",
          content: text
        },
        finish_reason: finishReason
      });
    }
  }

  if (geminiResponse.usageMetadata) {
    var promptTokens = geminiResponse.usageMetadata.promptTokenCount || 0;
    var completionTokens = geminiResponse.usageMetadata.candidatesTokenCount || 0;
    var totalTokens = geminiResponse.usageMetadata.totalTokenCount || (promptTokens + completionTokens);

    openAiResponse.usage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens
    };
  }

  return openAiResponse;
}

if (typeof exports !== "undefined") {
  exports.convertGeminiToOpenAi = convertGeminiToOpenAi;
}
