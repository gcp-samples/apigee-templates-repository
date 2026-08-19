function convertOpenAiToAnthropic(openAiPayload, routeInfo) {
  if (!openAiPayload) return {};

  var targetModel = openAiPayload.model || "";
  if (routeInfo) {
    if (typeof routeInfo === "string") {
      targetModel = routeInfo;
    } else if (typeof routeInfo === "object") {
      if (routeInfo.cleanModelName) {
        targetModel = routeInfo.cleanModelName;
      } else if (routeInfo.mappedModelName) {
        targetModel = routeInfo.mappedModelName;
      }
    }
  }

  if (targetModel && targetModel.indexOf("/") !== -1) {
    var parts = targetModel.split("/");
    targetModel = parts[parts.length - 1];
  }

  var anthropicPayload = {
    model: targetModel,
    messages: [],
    max_tokens: openAiPayload.max_tokens || openAiPayload.max_completion_tokens || 4096
  };

  var targetRoute = "";
  if (routeInfo) {
    if (typeof routeInfo === "string") {
      targetRoute = routeInfo;
    } else if (typeof routeInfo === "object" && routeInfo.targetRoute) {
      targetRoute = routeInfo.targetRoute;
    }
  }

  var lowerRoute = targetRoute.toLowerCase();
  if (!lowerRoute || lowerRoute.indexOf("google") !== -1) {
    anthropicPayload["anthropic_version"] = "vertex-2023-10-16";
    delete anthropicPayload.model;
  } else if (lowerRoute.indexOf("aws") !== -1 || lowerRoute.indexOf("bedrock") !== -1) {
    anthropicPayload["anthropic_version"] = "bedrock-2023-05-31";
    delete anthropicPayload.model;
  }

  var systemPrompts = [];

  if (openAiPayload.messages && Array.isArray(openAiPayload.messages)) {
    for (var i = 0; i < openAiPayload.messages.length; i++) {
      var msg = openAiPayload.messages[i];
      if (!msg) continue;
      var role = msg.role;
      var content = msg.content;

      if (role === "system" || role === "developer") {
        if (typeof content === "string") {
          systemPrompts.push(content);
        } else if (Array.isArray(content)) {
          for (var j = 0; j < content.length; j++) {
            if (content[j] && content[j].type === "text" && content[j].text) {
              systemPrompts.push(content[j].text);
            } else if (typeof content[j] === "string") {
              systemPrompts.push(content[j]);
            }
          }
        }
      } else {
        var anthropicRole = (role === "assistant") ? "assistant" : "user";
        var anthropicContent = content;

        if (Array.isArray(content)) {
          var formattedParts = [];
          for (var k = 0; k < content.length; k++) {
            var part = content[k];
            if (part) {
              if (part.type === "text") {
                formattedParts.push({ type: "text", text: part.text || "" });
              } else if (part.type === "image_url" && part.image_url) {
                var urlStr = typeof part.image_url === "string" ? part.image_url : part.image_url.url;
                if (urlStr && urlStr.indexOf("data:") === 0) {
                  var matches = urlStr.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
                  if (matches) {
                    formattedParts.push({
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: matches[1],
                        data: matches[2]
                      }
                    });
                  }
                }
              } else if (typeof part === "string") {
                formattedParts.push({ type: "text", text: part });
              }
            }
          }
          anthropicContent = formattedParts;
        }

        anthropicPayload.messages.push({
          role: anthropicRole,
          content: anthropicContent
        });
      }
    }
  }

  if (systemPrompts.length > 0) {
    anthropicPayload.system = systemPrompts.join("\n\n");
  }

  if (openAiPayload.temperature !== undefined) anthropicPayload.temperature = openAiPayload.temperature;
  if (openAiPayload.top_p !== undefined) anthropicPayload.top_p = openAiPayload.top_p;
  if (openAiPayload.stream !== undefined) anthropicPayload.stream = openAiPayload.stream;
  if (openAiPayload.stop !== undefined) {
    anthropicPayload.stop_sequences = Array.isArray(openAiPayload.stop) ? openAiPayload.stop : [openAiPayload.stop];
  }

  return anthropicPayload;
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToAnthropic = convertOpenAiToAnthropic;
}
