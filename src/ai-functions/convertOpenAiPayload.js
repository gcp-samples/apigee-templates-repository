if (typeof require !== "undefined") {
  if (typeof convertOpenAiToGeminiAudio === "undefined") {
    convertOpenAiToGeminiAudio = require("./convertOpenAiToGeminiAudio").convertOpenAiToGeminiAudio;
  }
  if (typeof convertOpenAiMultipartToGemini === "undefined") {
    convertOpenAiMultipartToGemini = require("./convertOpenAiMultipartToGemini").convertOpenAiMultipartToGemini;
  }
  if (typeof convertOpenAiToImagen === "undefined") {
    convertOpenAiToImagen = require("./convertOpenAiToImagen").convertOpenAiToImagen;
  }
  if (typeof convertOpenAiToGeminiImage === "undefined") {
    convertOpenAiToGeminiImage = require("./convertOpenAiToGeminiImage").convertOpenAiToGeminiImage;
  }
  if (typeof convertOpenAiToGeminiEmbeddings === "undefined") {
    convertOpenAiToGeminiEmbeddings = require("./convertOpenAiToGeminiEmbeddings").convertOpenAiToGeminiEmbeddings;
  }
  if (typeof convertOpenAiToAnthropic === "undefined") {
    convertOpenAiToAnthropic = require("./convertOpenAiToAnthropic").convertOpenAiToAnthropic;
  }
}

function convertOpenAiPayload(openAiPayload, provider, requestType, routeInfo) {
  if (!openAiPayload) return {};

  var prov = (provider || "").toLowerCase();
  var type = (requestType || "text").toLowerCase();

  if (prov === "google") {
    if (type === "audio-text") {
      return typeof convertOpenAiToGeminiAudio === "function" ? convertOpenAiToGeminiAudio(openAiPayload) : openAiPayload;
    } else if (type === "audio-data") {
      return typeof convertOpenAiMultipartToGemini === "function" ? convertOpenAiMultipartToGemini(openAiPayload) : openAiPayload;
    } else if (type === "image-generation") {
      var modelStr = "";
      if (openAiPayload && openAiPayload.model) {
        modelStr = openAiPayload.model.toLowerCase();
      } else if (routeInfo && (routeInfo.cleanModelName || routeInfo.mappedModelName)) {
        modelStr = (routeInfo.mappedModelName || routeInfo.cleanModelName).toLowerCase();
      }
      if (modelStr.indexOf("imagen") !== -1) {
        return typeof convertOpenAiToImagen === "function" ? convertOpenAiToImagen(openAiPayload) : openAiPayload;
      } else {
        return typeof convertOpenAiToGeminiImage === "function" ? convertOpenAiToGeminiImage(openAiPayload) : openAiPayload;
      }
    } else if (type === "embeddings") {
      return typeof convertOpenAiToGeminiEmbeddings === "function" ? convertOpenAiToGeminiEmbeddings(openAiPayload) : openAiPayload;
    }
    return openAiPayload;
  } else if (prov === "anthropic") {
    return typeof convertOpenAiToAnthropic === "function" ? convertOpenAiToAnthropic(openAiPayload, routeInfo) : openAiPayload;
  }

  return openAiPayload;
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiPayload = convertOpenAiPayload;
}
