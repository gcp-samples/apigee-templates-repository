function getUsageData(contentString) {
  var usageData = {
    model: "",
    requestTokenCount: 0,
    responseTokenCount: 0,
    totalTokenCount: 0,
    usageFound: false
  };

  if (!contentString) {
    return usageData;
  }

  var cleaned = (typeof contentString === "string") ? contentString.trim() : "";
  if (!cleaned && typeof contentString === "object") {
    try {
      cleaned = JSON.stringify(contentString);
    } catch (e) {
      return usageData;
    }
  }

  // Return early for stream markers, ping events, or non-data frames to avoid JSON parse errors
  if (
    cleaned.indexOf("[DONE]") !== -1 ||
    cleaned.indexOf("message_stop") !== -1 ||
    cleaned.indexOf("content_block") !== -1 ||
    cleaned.indexOf("event: ping") !== -1
  ) {
    return usageData;
  }

  // Extract last JSON object from data: lines if present
  if (cleaned.indexOf("data:") !== -1) {
    var lines = cleaned.split(/\r?\n/);
    for (var i = lines.length - 1; i >= 0; i--) {
      var l = lines[i].trim();
      if (l.indexOf("data:") === 0) {
        var candidate = l.substring(5).trim();
        if (candidate.indexOf("{") === 0) {
          cleaned = candidate;
          break;
        }
      }
    }
  } else if (cleaned.indexOf("event: ") === 0) {
    var firstBrace = cleaned.indexOf("{");
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace).trim();
    }
  }

  if (!cleaned || cleaned.indexOf("{") !== 0) {
    return usageData;
  }

  try {
    var contentData = JSON.parse(cleaned);

    // model
    if (contentData["model"]) {
      usageData.model = contentData["model"];
    }
    if (contentData["modelVersion"]) {
      usageData.model = contentData["modelVersion"];
    }
    if (contentData["message"] && contentData["message"]["model"]) {
      usageData.model = contentData["message"]["model"];
    }
    if (usageData.model && usageData.model.indexOf("/") !== -1) {
      var modelNamePieces = usageData.model.split("/");
      usageData.model = modelNamePieces[modelNamePieces.length - 1];
    }

    // requestTokenCount
    // openmodels / openai
    if (contentData["usage"] && contentData["usage"]["prompt_tokens"] !== undefined) {
      usageData.requestTokenCount = contentData["usage"]["prompt_tokens"];
    }
    // claude message.usage
    if (
      contentData["message"] &&
      contentData["message"]["usage"] &&
      contentData["message"]["usage"]["input_tokens"] !== undefined
    ) {
      usageData.requestTokenCount = contentData["message"]["usage"]["input_tokens"];
    }
    // claude top-level usage
    if (contentData["usage"] && contentData["usage"]["input_tokens"] !== undefined) {
      usageData.requestTokenCount = contentData["usage"]["input_tokens"];
    }
    // gemini API
    if (contentData["usageMetadata"] && contentData["usageMetadata"]["promptTokenCount"] !== undefined) {
      usageData.requestTokenCount = contentData["usageMetadata"]["promptTokenCount"];
    }

    // responseTokenCount
    // openmodels / openai
    if (contentData["usage"] && contentData["usage"]["completion_tokens"] !== undefined) {
      usageData.responseTokenCount = contentData["usage"]["completion_tokens"];
    }
    // claude message.usage
    if (
      contentData["message"] &&
      contentData["message"]["usage"] &&
      contentData["message"]["usage"]["output_tokens"] !== undefined
    ) {
      usageData.responseTokenCount = contentData["message"]["usage"]["output_tokens"];
    }
    // claude top-level usage
    if (contentData["usage"] && contentData["usage"]["output_tokens"] !== undefined) {
      usageData.responseTokenCount = contentData["usage"]["output_tokens"];
    }
    // gemini API
    if (contentData["usageMetadata"] && contentData["usageMetadata"]["candidatesTokenCount"] !== undefined) {
      usageData.responseTokenCount = contentData["usageMetadata"]["candidatesTokenCount"];
    }

    if (usageData.requestTokenCount > 0 || usageData.responseTokenCount > 0) {
      usageData.usageFound = true;
    }
    usageData.totalTokenCount = usageData.requestTokenCount + usageData.responseTokenCount;
  } catch (e) {
    if (typeof print === "function") {
      print("Exception in getUsageData: " + JSON.stringify(e));
    }
  }

  return usageData;
}

if (typeof exports !== "undefined") {
  exports.getUsageData = getUsageData;
}
