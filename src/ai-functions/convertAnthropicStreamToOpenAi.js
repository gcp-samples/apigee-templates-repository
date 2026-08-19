function convertAnthropicStreamToOpenAi(contentString, modelName, streamMessageId) {
  var usageData = {
    model: modelName || "",
    requestTokenCount: 0,
    responseTokenCount: 0,
    totalTokenCount: 0,
    usageFound: false
  };

  if (!contentString) {
    return { contentString: "", usageData: usageData, messageId: streamMessageId || "" };
  }

  var activeMsgId = streamMessageId || "";
  if (!activeMsgId && typeof context !== "undefined" && context && context.getVariable) {
    activeMsgId = context.getVariable("ai.streamMessageId") || "";
  }

  var rawBlocks = contentString.split(/\r?\n\r?\n/);
  var outputChunks = [];

  for (var b = 0; b < rawBlocks.length; b++) {
    var raw = rawBlocks[b].trim();
    if (!raw) continue;

    if (raw.indexOf("message_stop") !== -1 || raw.indexOf("[DONE]") !== -1) {
      outputChunks.push("data: [DONE]");
      continue;
    }

    var eventType = "";
    var dataLines = [];
    var lines = raw.split(/\r?\n/);

    for (var l = 0; l < lines.length; l++) {
      var line = lines[l].trim();
      if (line.indexOf("event:") === 0) {
        eventType = line.substring(6).trim();
      } else if (line.indexOf("data:") === 0) {
        dataLines.push(line.substring(5).trim());
      } else if (dataLines.length > 0 && line) {
        dataLines.push(line);
      }
    }

    var dataStr = dataLines.join("").trim();

    if (!dataStr && raw.indexOf("{") === 0) {
      dataStr = raw.trim();
    }

    var eventData = null;
    if (dataStr) {
      try {
        eventData = JSON.parse(dataStr);
      } catch (e) {}
    }

    if (!eventData) {
      continue;
    }

    try {
      var type = eventType || eventData.type || "";
      var created = Math.floor(Date.now() / 1000);
      var model = modelName || eventData.model || "claude";

      if (type === "message_start" && eventData.message) {
        if (eventData.message.id) {
          activeMsgId = "chatcmpl-" + eventData.message.id.replace(/^msg_/, "");
        } else if (!activeMsgId) {
          activeMsgId = "chatcmpl-" + Math.random().toString(36).substring(2, 11);
        }
        if (typeof context !== "undefined" && context && context.setVariable) {
          context.setVariable("ai.streamMessageId", activeMsgId);
        }

        var startChunk = {
          id: activeMsgId,
          object: "chat.completion.chunk",
          created: created,
          model: eventData.message.model || model,
          choices: [
            {
              index: 0,
              delta: { role: "assistant", content: "" },
              finish_reason: null
            }
          ]
        };

        if (eventData.message.usage) {
          var pTok = eventData.message.usage.input_tokens !== undefined ? eventData.message.usage.input_tokens : 0;
          var cTok = eventData.message.usage.output_tokens !== undefined ? eventData.message.usage.output_tokens : 0;
          startChunk.usage = {
            prompt_tokens: pTok,
            completion_tokens: cTok,
            total_tokens: pTok + cTok
          };
          usageData.requestTokenCount = pTok;
          usageData.responseTokenCount = cTok;
          usageData.totalTokenCount = pTok + cTok;
          if (pTok > 0 || cTok > 0) {
            usageData.usageFound = true;
          }
        }

        outputChunks.push("data: " + JSON.stringify(startChunk));
        continue;
      }

      if (!activeMsgId) {
        activeMsgId = "chatcmpl-" + Math.random().toString(36).substring(2, 11);
      }

      if (type === "content_block_start" && eventData.content_block) {
        var cb = eventData.content_block;
        var blockIndex = eventData.index || 0;

        if (cb.type === "tool_use") {
          var toolStartChunk = {
            id: activeMsgId,
            object: "chat.completion.chunk",
            created: created,
            model: model,
            choices: [
              {
                index: 0,
                delta: {
                  tool_calls: [
                    {
                      index: blockIndex,
                      id: cb.id || "",
                      type: "function",
                      function: {
                        name: cb.name || "",
                        arguments: ""
                      }
                    }
                  ]
                },
                finish_reason: null
              }
            ]
          };
          outputChunks.push("data: " + JSON.stringify(toolStartChunk));
        } else if (cb.type === "text" && cb.text) {
          var textStartChunk = {
            id: activeMsgId,
            object: "chat.completion.chunk",
            created: created,
            model: model,
            choices: [
              {
                index: 0,
                delta: { content: cb.text },
                finish_reason: null
              }
            ]
          };
          outputChunks.push("data: " + JSON.stringify(textStartChunk));
        }
        continue;
      }

      if (type === "content_block_delta" && eventData.delta) {
        var deltaObj = eventData.delta;
        var blockIdx = eventData.index || 0;

        if (deltaObj.type === "text_delta" && deltaObj.text !== undefined) {
          var deltaChunk = {
            id: activeMsgId,
            object: "chat.completion.chunk",
            created: created,
            model: model,
            choices: [
              {
                index: 0,
                delta: { content: deltaObj.text },
                finish_reason: null
              }
            ]
          };
          outputChunks.push("data: " + JSON.stringify(deltaChunk));
        } else if (deltaObj.type === "thinking_delta" && deltaObj.thinking !== undefined) {
          var thinkingChunk = {
            id: activeMsgId,
            object: "chat.completion.chunk",
            created: created,
            model: model,
            choices: [
              {
                index: 0,
                delta: { reasoning_content: deltaObj.thinking },
                finish_reason: null
              }
            ]
          };
          outputChunks.push("data: " + JSON.stringify(thinkingChunk));
        } else if (deltaObj.type === "input_json_delta" && deltaObj.partial_json !== undefined) {
          var toolDeltaChunk = {
            id: activeMsgId,
            object: "chat.completion.chunk",
            created: created,
            model: model,
            choices: [
              {
                index: 0,
                delta: {
                  tool_calls: [
                    {
                      index: blockIdx,
                      function: { arguments: deltaObj.partial_json }
                    }
                  ]
                },
                finish_reason: null
              }
            ]
          };
          outputChunks.push("data: " + JSON.stringify(toolDeltaChunk));
        }
        continue;
      }

      if (type === "content_block_stop") {
        continue;
      }

      if (type === "message_delta" && eventData.delta) {
        var stopReason = eventData.delta.stop_reason;
        var finishReason = "stop";
        if (stopReason === "max_tokens") finishReason = "length";
        else if (stopReason === "end_turn" || stopReason === "stop_sequence") finishReason = "stop";
        else if (stopReason === "tool_use") finishReason = "tool_calls";
        else if (stopReason) finishReason = stopReason.toLowerCase();

        if (eventData.usage) {
          if (eventData.usage.input_tokens !== undefined) {
            usageData.requestTokenCount = eventData.usage.input_tokens;
          }
          if (eventData.usage.output_tokens !== undefined) {
            usageData.responseTokenCount = eventData.usage.output_tokens;
          }
          usageData.totalTokenCount = usageData.requestTokenCount + usageData.responseTokenCount;
          if (usageData.requestTokenCount > 0 || usageData.responseTokenCount > 0) {
            usageData.usageFound = true;
          }
        }

        var stopChunk = {
          id: activeMsgId,
          object: "chat.completion.chunk",
          created: created,
          model: model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: finishReason
            }
          ]
        };

        if (usageData.usageFound) {
          stopChunk.usage = {
            prompt_tokens: usageData.requestTokenCount,
            completion_tokens: usageData.responseTokenCount,
            total_tokens: usageData.totalTokenCount
          };
        }

        outputChunks.push("data: " + JSON.stringify(stopChunk));
        continue;
      }

      if (type === "ping") {
        continue;
      }

    } catch (e) {}
  }

  return {
    contentString: outputChunks.join("\n\n"),
    usageData: usageData,
    messageId: activeMsgId
  };
}

if (typeof exports !== "undefined") {
  exports.convertAnthropicStreamToOpenAi = convertAnthropicStreamToOpenAi;
}
