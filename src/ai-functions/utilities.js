function getBodyString(content) {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;
  return String(content);
}

function extractGoogleInput(contents) {
  if (!contents || !Array.isArray(contents)) return "";
  for (var i = contents.length - 1; i >= 0; i--) {
    var item = contents[i];
    if (item && item.role && item.role.toLowerCase() === "user" && item.parts && Array.isArray(item.parts)) {
      for (var p = item.parts.length - 1; p >= 0; p--) {
        if (item.parts[p] && item.parts[p].text) {
          return item.parts[p].text;
        }
      }
    }
  }
  return "";
}

function extractMessagesInput(messages) {
  if (!messages || !Array.isArray(messages)) return "";
  for (var i = messages.length - 1; i >= 0; i--) {
    var msg = messages[i];
    if (msg && msg.role && msg.role.toLowerCase() === "user") {
      if (typeof msg.content === "string") {
        return msg.content;
      }
      if (Array.isArray(msg.content)) {
        var parts = [];
        for (var c = 0; c < msg.content.length; c++) {
          var part = msg.content[c];
          if (part && part.type === "text" && part.text) {
            parts.push(part.text);
          } else if (typeof part === "string") {
            parts.push(part);
          }
        }
        if (parts.length > 0) {
          return parts.join(" ");
        }
      }
    }
  }
  return "";
}

function encodeBytesToBase64(data) {
  if (!data) return "";
  try {
    if (typeof java !== "undefined" && java.util && java.util.Base64) {
      if (typeof data === "string") {
        var bytes = data.split("").map(function(c) { return c.charCodeAt(0) & 0xFF; });
        return java.util.Base64.getEncoder().encodeToString(bytes);
      }
      return java.util.Base64.getEncoder().encodeToString(data);
    }
  } catch (e) {}
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(data).toString("base64");
    }
  } catch (e) {}
  return "";
}

function decodeBase64ToBytes(base64Str) {
  if (!base64Str) return "";
  try {
    if (typeof java !== "undefined" && java.util && java.util.Base64) {
      return java.util.Base64.getDecoder().decode(base64Str);
    }
  } catch (e) {}
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(base64Str, "base64");
    }
  } catch (e) {}
  return base64Str;
}

function getModelName(urlString, contentString) {
  if (typeof getRequestInfo === "undefined" && typeof require !== "undefined") {
    var reqInfoModule = require("./getRequestInfo");
    var fn = reqInfoModule.getRequestInfo;
    var info = fn(urlString, contentString);
    return info.modelName;
  }
  var infoObj = typeof getRequestInfo === "function" ? getRequestInfo(urlString, contentString) : { modelName: "unknown" };
  return infoObj.modelName;
}

function getPrompts(contentData) {
  if (typeof getRequestInfo === "undefined" && typeof require !== "undefined") {
    var reqInfoModule = require("./getRequestInfo");
    var fn = reqInfoModule.getRequestInfo;
    var info = fn("", contentData);
    return {
      userPrompt: info.input,
      allUserPrompts: info.input,
      protocol: info.protocol
    };
  }
  var infoObj = typeof getRequestInfo === "function" ? getRequestInfo("", contentData) : { input: "", protocol: "unknown" };
  return {
    userPrompt: infoObj.input,
    allUserPrompts: infoObj.input,
    protocol: infoObj.protocol
  };
}

if (typeof exports !== "undefined") {
  exports.getBodyString = getBodyString;
  exports.extractGoogleInput = extractGoogleInput;
  exports.extractMessagesInput = extractMessagesInput;
  exports.encodeBytesToBase64 = encodeBytesToBase64;
  exports.decodeBase64ToBytes = decodeBase64ToBytes;
  exports.getModelName = getModelName;
  exports.getPrompts = getPrompts;
}
