function convertAnthropicToOpenAi(anthropicData, modelName) {
  var usageData = {
    model: modelName || "",
    requestTokenCount: 0,
    responseTokenCount: 0,
    totalTokenCount: 0,
    usageFound: false
  };

  if (!anthropicData) {
    return { contentString: "", usageData: usageData };
  }

  var data = anthropicData;
  if (typeof anthropicData === "string") {
    try {
      data = JSON.parse(anthropicData);
    } catch (e) {
      return { contentString: anthropicData, usageData: usageData };
    }
  }

  var text = "";
  if (data.content && Array.isArray(data.content)) {
    for (var i = 0; i < data.content.length; i++) {
      var item = data.content[i];
      if (item && item.type === "text" && item.text) {
        text += item.text;
      }
    }
  } else if (typeof data.content === "string") {
    text = data.content;
  }

  var finishReason = "stop";
  if (data.stop_reason) {
    if (data.stop_reason === "max_tokens") finishReason = "length";
    else if (data.stop_reason === "end_turn" || data.stop_reason === "stop_sequence") finishReason = "stop";
    else finishReason = data.stop_reason.toLowerCase();
  }

  var msgId = data.id ? ("chatcmpl-" + data.id.replace(/^msg_/, "")) : ("chatcmpl-" + Math.random().toString(36).substring(2, 11));

  var promptTokens = (data.usage && data.usage.input_tokens !== undefined) ? data.usage.input_tokens : 0;
  var completionTokens = (data.usage && data.usage.output_tokens !== undefined) ? data.usage.output_tokens : 0;

  var openAiResponse = {
    id: msgId,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: modelName || data.model || "claude",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text
        },
        finish_reason: finishReason
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };

  usageData.model = modelName || data.model || "claude";
  usageData.requestTokenCount = promptTokens;
  usageData.responseTokenCount = completionTokens;
  usageData.totalTokenCount = promptTokens + completionTokens;
  if (promptTokens > 0 || completionTokens > 0) {
    usageData.usageFound = true;
  }

  return {
    contentString: JSON.stringify(openAiResponse),
    usageData: usageData,
    openAiResponse: openAiResponse
  };
}

if (typeof exports !== "undefined") {
  exports.convertAnthropicToOpenAi = convertAnthropicToOpenAi;
}
