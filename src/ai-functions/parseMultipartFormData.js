if (typeof require !== "undefined") {
  var utilities = require("./utilities");
  if (typeof encodeBytesToBase64 === "undefined") encodeBytesToBase64 = utilities.encodeBytesToBase64;
}

function parseMultipartFormData(body, contentType) {
  var result = {
    model: "",
    prompt: "",
    language: "",
    fileMimeType: "audio/mp3",
    fileBase64: ""
  };

  if (!body) return result;

  var strBody = typeof body === "string" ? body : String(body);

  var boundary = "";
  if (contentType && contentType.indexOf("boundary=") !== -1) {
    var rawBoundary = contentType.split("boundary=")[1].split(";")[0].trim();
    if ((rawBoundary.indexOf('"') === 0 && rawBoundary.lastIndexOf('"') === rawBoundary.length - 1) ||
        (rawBoundary.indexOf("'") === 0 && rawBoundary.lastIndexOf("'") === rawBoundary.length - 1)) {
      rawBoundary = rawBoundary.substring(1, rawBoundary.length - 1);
    }
    boundary = "--" + rawBoundary;
  } else if (typeof strBody === "string" && strBody.indexOf("--") === 0) {
    var firstLineEnd = strBody.indexOf("\r\n");
    if (firstLineEnd === -1) firstLineEnd = strBody.indexOf("\n");
    if (firstLineEnd !== -1) {
      boundary = strBody.substring(0, firstLineEnd).trim();
    }
  }

  if (!boundary) return result;

  var parts = strBody.split(boundary);
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part || part === "--" || part === "--\r\n" || part === "--\n") continue;

    var headerEndIndex = part.indexOf("\r\n\r\n");
    var delimiterLength = 4;
    if (headerEndIndex === -1) {
      headerEndIndex = part.indexOf("\n\n");
      delimiterLength = 2;
    }

    if (headerEndIndex === -1) continue;

    var headersText = part.substring(0, headerEndIndex);
    var bodyText = part.substring(headerEndIndex + delimiterLength);

    if (bodyText.lastIndexOf("\r\n") === bodyText.length - 2 && bodyText.length >= 2) {
      bodyText = bodyText.substring(0, bodyText.length - 2);
    } else if (bodyText.lastIndexOf("\n") === bodyText.length - 1 && bodyText.length >= 1) {
      bodyText = bodyText.substring(0, bodyText.length - 1);
    }

    var nameMatch = headersText.match(/name="([^"]+)"/i);
    var fieldName = nameMatch ? nameMatch[1] : "";

    if (fieldName === "model") {
      result.model = bodyText.trim();
    } else if (fieldName === "prompt") {
      result.prompt = bodyText.trim();
    } else if (fieldName === "language") {
      result.language = bodyText.trim();
    } else if (fieldName === "file") {
      var contentTypeMatch = headersText.match(/Content-Type:\s*([^\r\n;]+)/i);
      if (contentTypeMatch) {
        result.fileMimeType = contentTypeMatch[1].trim();
      }
      result.fileBase64 = encodeBytesToBase64(bodyText);
    }
  }

  return result;
}

if (typeof exports !== "undefined") {
  exports.parseMultipartFormData = parseMultipartFormData;
}
