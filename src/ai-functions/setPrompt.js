function setPrompt(contentData, userPrompt) {
  if (!contentData) return contentData;

  if (contentData["contents"] && Array.isArray(contentData["contents"])) {
    // gemini format
    for (var i = contentData["contents"].length - 1; i >= 0; i--) {
      var content = contentData["contents"][i];
      if (
        content &&
        content["role"] &&
        content["role"].toLowerCase() === "user" &&
        content["parts"] &&
        Array.isArray(content["parts"])
      ) {
        for (var p = content["parts"].length - 1; p >= 0; p--) {
          if (content["parts"][p] && content["parts"][p]["text"] !== undefined) {
            content["parts"][p]["text"] = userPrompt;
            return contentData;
          }
        }
      }
    }
  } else if (contentData["messages"] && Array.isArray(contentData["messages"])) {
    // openai / claude format
    for (var j = contentData["messages"].length - 1; j >= 0; j--) {
      var message = contentData["messages"][j];
      if (message && message["role"] && message["role"].toLowerCase() === "user") {
        if (typeof message["content"] === "string") {
          message["content"] = userPrompt;
          return contentData;
        } else if (Array.isArray(message["content"])) {
          for (var c = message["content"].length - 1; c >= 0; c--) {
            var part = message["content"][c];
            if (part && (part["type"] === "text" || typeof part === "string")) {
              if (typeof part === "string") {
                message["content"][c] = userPrompt;
              } else {
                part["text"] = userPrompt;
              }
              return contentData;
            }
          }
        }
      }
    }
  }

  return contentData;
}

if (typeof exports !== "undefined") {
  exports.setPrompt = setPrompt;
}
