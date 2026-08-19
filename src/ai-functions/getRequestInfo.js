if (typeof require !== "undefined") {
  var utilities = require("./utilities");
  if (typeof getBodyString === "undefined") getBodyString = utilities.getBodyString;
  if (typeof extractGoogleInput === "undefined") extractGoogleInput = utilities.extractGoogleInput;
  if (typeof extractMessagesInput === "undefined") extractMessagesInput = utilities.extractMessagesInput;
  if (typeof parseMultipartFormData === "undefined") parseMultipartFormData = require("./parseMultipartFormData").parseMultipartFormData;
}

function getRequestInfo(urlString, content, contentType) {
  var info = {
    input: "",
    rawModelName: "",
    modelName: "unknown",
    protocol: "unknown",
    requestType: "text"
  };

  var url = urlString || "";
  var lowerUrl = url.toLowerCase();

  // 1. Detect requestType from URL
  if (lowerUrl.indexOf("/audio/speech") !== -1 || lowerUrl.indexOf("/speech/audio") !== -1) {
    info.requestType = "audio-text";
  } else if (lowerUrl.indexOf("/audio/transcription") !== -1 || lowerUrl.indexOf("/audio/translation") !== -1) {
    info.requestType = "audio-data";
  } else if (lowerUrl.indexOf("/images/generations") !== -1 || lowerUrl.indexOf("/images/edits") !== -1 || lowerUrl.indexOf("/images/variations") !== -1) {
    info.requestType = "image-generation";
  } else if (lowerUrl.indexOf("/embeddings") !== -1) {
    info.requestType = "embeddings";
  }

  // Parse content JSON or multipart data
  var contentData = null;
  if (typeof content === "object" && content !== null && !content.asJSON && !content.asString) {
    if (content.model !== undefined || content.contents !== undefined || content.messages !== undefined || content.input !== undefined || content.prompt !== undefined) {
      contentData = content;
    }
  }

  if (!contentData) {
    var bodyStr = typeof getBodyString === "function" ? getBodyString(content) : (typeof content === "string" ? content : "");
    var isMultipart = (info.requestType === "audio-data") ||
                      (contentType && contentType.toLowerCase().indexOf("multipart") !== -1) ||
                      (bodyStr && bodyStr.indexOf("--") === 0);

    if (bodyStr && isMultipart) {
      contentData = typeof parseMultipartFormData === "function" ? parseMultipartFormData(bodyStr, contentType) : null;
    } else if (content) {
      if (typeof content === "object" && content.asJSON) {
        contentData = content.asJSON;
      } else if (typeof content === "string") {
        try {
          contentData = JSON.parse(content);
        } catch (e) {}
      } else if (bodyStr && bodyStr !== "[object Object]") {
        try {
          contentData = JSON.parse(bodyStr);
        } catch (e) {}
      } else if (typeof content === "object") {
        contentData = content;
      }
    }
  }

  if (contentData && typeof contentData === "object") {
    // Fallback requestType check from payload if URL didn't specify
    if (info.requestType === "text") {
      if (contentData["voice"] !== undefined && contentData["input"] !== undefined) {
        info.requestType = "audio-text";
      }
    }

    // 2. Extract modelName and rawModelName from payload
    if (contentData["model"] && typeof contentData["model"] === "string") {
      info.rawModelName = contentData["model"];
      var modelParts = info.rawModelName.split("/");
      info.modelName = modelParts[modelParts.length - 1];
    } else if (contentData["modelVersion"] && typeof contentData["modelVersion"] === "string") {
      info.rawModelName = contentData["modelVersion"];
      info.modelName = contentData["modelVersion"];
    }
  }

  if (info.requestType === "audio-data" && info.protocol === "unknown") {
    info.protocol = "openai";
  }

  // If modelName still unknown, extract from GCP publisher URL format
  if (info.modelName === "unknown" && url) {
    if (url.indexOf("/publishers/anthropic/models/") !== -1) {
      var aParts = url.split("/publishers/anthropic/models/");
      if (aParts.length > 1) {
        info.modelName = aParts[1].split(":")[0];
      }
    } else if (url.indexOf("/publishers/google/models/") !== -1) {
      var gParts = url.split("/publishers/google/models/");
      if (gParts.length > 1) {
        info.modelName = gParts[1].split(":")[0];
      }
    } else if (url.indexOf(":generate") !== -1) {
      var genParts = url.split(":generate");
      if (genParts.length > 1) {
        var uParts = genParts[0].split("/");
        info.modelName = uParts[uParts.length - 1];
      }
    }
  }

  // 3. Detect protocol and extract main input prompt/text
  if (contentData && typeof contentData === "object") {
    if (contentData["contents"] && Array.isArray(contentData["contents"])) {
      info.protocol = "google";
      info.input = typeof extractGoogleInput === "function" ? extractGoogleInput(contentData["contents"]) : "";
    } else if (contentData["messages"] && Array.isArray(contentData["messages"])) {
      if (
        contentData["system"] !== undefined ||
        contentData["anthropic_version"] !== undefined ||
        contentData["top_k"] !== undefined ||
        lowerUrl.indexOf("/publishers/anthropic/") !== -1 ||
        info.modelName.toLowerCase().indexOf("claude") !== -1
      ) {
        info.protocol = "anthropic";
      } else {
        info.protocol = "openai";
      }
      info.input = typeof extractMessagesInput === "function" ? extractMessagesInput(contentData["messages"]) : "";
    } else if (contentData["prompt"] !== undefined) {
      info.protocol = "openai";
      if (typeof contentData["prompt"] === "string") {
        info.input = contentData["prompt"];
      } else if (Array.isArray(contentData["prompt"])) {
        info.input = contentData["prompt"].join(" ");
      }
    } else if (contentData["input"] !== undefined) {
      info.protocol = "openai";
      if (typeof contentData["input"] === "string") {
        info.input = contentData["input"];
      } else if (Array.isArray(contentData["input"])) {
        info.input = contentData["input"].join(" ");
      }
    }
  }

  if (info.protocol === "unknown" && url) {
    if (url.indexOf("/publishers/google/") !== -1) {
      info.protocol = "google";
    } else if (url.indexOf("/publishers/anthropic/") !== -1) {
      info.protocol = "anthropic";
    }
  }

  return info;
}

if (typeof exports !== "undefined") {
  exports.getRequestInfo = getRequestInfo;
}
