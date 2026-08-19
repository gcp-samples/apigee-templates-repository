function getTargetRoute(modelName, config) {
  var result = {
    provider: "unknown",
    region: "global",
    cleanModelName: modelName || "",
    targetRoute: ""
  };

  if (!modelName || modelName === "unknown") {
    return result;
  }

  var parsedConfig = null;
  if (config) {
    if (typeof config === "string") {
      try {
        parsedConfig = JSON.parse(config);
      } catch (e) {}
    } else if (typeof config === "object") {
      parsedConfig = config;
    }
  }

  var currentModel = modelName;

  // 1. Check mappings in config
  if (parsedConfig && parsedConfig.mappings) {
    if (parsedConfig.mappings[currentModel]) {
      currentModel = parsedConfig.mappings[currentModel];
      result.mappedModelName = currentModel;
    } else {
      var rawProv = "";
      var clean = currentModel;
      if (currentModel.indexOf("/") !== -1) {
        var p = currentModel.split("/");
        rawProv = p[0];
        clean = p.slice(1).join("/");
      }
      var provModelKey = rawProv ? (rawProv + "/" + clean) : clean;
      if (parsedConfig.mappings[provModelKey]) {
        currentModel = parsedConfig.mappings[provModelKey];
        result.mappedModelName = currentModel;
      } else if (parsedConfig.mappings[clean]) {
        currentModel = parsedConfig.mappings[clean];
        result.mappedModelName = currentModel;
      }
    }
  }

  var rawProvider = "";
  var cleanModel = currentModel;

  if (currentModel.indexOf("/") !== -1) {
    var parts = currentModel.split("/");
    rawProvider = parts[0];
    cleanModel = parts.slice(1).join("/");
  }

  if (rawProvider) {
    result.provider = rawProvider;
  } else {
    var lower = currentModel.toLowerCase();
    if (lower.indexOf("gemini") !== -1 || lower.indexOf("embedding") !== -1) {
      result.provider = "google";
      result.targetRoute = "googlecloud";
    } else if (lower.indexOf("claude") !== -1) {
      result.provider = "anthropic";
      result.targetRoute = "anthropic";
    } else if (lower.indexOf("gpt") !== -1) {
      result.provider = "openai";
      result.targetRoute = "openai";
    } else {
      result.provider = "unknown";
    }
  }

  result.cleanModelName = cleanModel;

  // 2. Straight model string mapping to target in models
  if (parsedConfig && parsedConfig.models) {
    if (parsedConfig.models[currentModel]) {
      result.targetRoute = parsedConfig.models[currentModel];
    } else if (parsedConfig.models[modelName]) {
      result.targetRoute = parsedConfig.models[modelName];
    } else if (parsedConfig.models[cleanModel]) {
      result.targetRoute = parsedConfig.models[cleanModel];
    }

    if (!result.targetRoute) {
      for (var modelKey in parsedConfig.models) {
        if (currentModel.indexOf(modelKey) !== -1 || modelKey.indexOf(currentModel) !== -1) {
          result.targetRoute = parsedConfig.models[modelKey];
          break;
        }
      }
    }
  }

  return result;
}

if (typeof exports !== "undefined") {
  exports.getTargetRoute = getTargetRoute;
}
