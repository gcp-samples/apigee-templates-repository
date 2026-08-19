function setResponse(contentData, content) {
  if (!contentData) return contentData;

  if (contentData["candidates"] && Array.isArray(contentData["candidates"]) && contentData["candidates"].length > 0) {
    // gemini format
    for (var i = contentData["candidates"].length - 1; i >= 0; i--) {
      var candidate = contentData["candidates"][i];
      if (
        candidate &&
        candidate["content"] &&
        candidate["content"]["parts"] &&
        Array.isArray(candidate["content"]["parts"]) &&
        candidate["content"]["parts"].length > 0
      ) {
        for (var p = candidate["content"]["parts"].length - 1; p >= 0; p--) {
          var part = candidate["content"]["parts"][p];
          if (part && part["text"] !== undefined) {
            part["text"] = content;
            return contentData;
          }
        }
      }
    }
  } else if (contentData["choices"] && Array.isArray(contentData["choices"]) && contentData["choices"].length > 0) {
    // openmodel / openai format
    for (var j = contentData["choices"].length - 1; j >= 0; j--) {
      var choice = contentData["choices"][j];
      if (choice && choice["message"]) {
        choice["message"]["content"] = content;
        return contentData;
      }
    }
  } else if (contentData["content"] && Array.isArray(contentData["content"]) && contentData["content"].length > 0) {
    // claude format
    for (var k = contentData["content"].length - 1; k >= 0; k--) {
      var claudeContent = contentData["content"][k];
      if (claudeContent && claudeContent["type"] === "text") {
        claudeContent["text"] = content;
        return contentData;
      }
    }
  }

  return contentData;
}

if (typeof exports !== "undefined") {
  exports.setResponse = setResponse;
}
