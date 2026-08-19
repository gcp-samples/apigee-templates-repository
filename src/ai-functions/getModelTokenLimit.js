function getModelTokenLimit(modelName, quotaData) {
  var limit = -1;
  if (!modelName || !quotaData) {
    return limit;
  }

  var data = quotaData;
  if (typeof quotaData === "string") {
    try {
      data = JSON.parse(quotaData);
    } catch (e) {
      return limit;
    }
  } else if (quotaData && quotaData.asJSON) {
    data = quotaData.asJSON;
  }

  if (!data || !Array.isArray(data)) {
    return limit;
  }

  var cleanModel = modelName;
  if (modelName.indexOf("/") !== -1) {
    var parts = modelName.split("/");
    cleanModel = parts[parts.length - 1];
  }

  for (var i = 0; i < data.length; i++) {
    var entry = data[i];
    if (entry && entry.llmOperations && Array.isArray(entry.llmOperations)) {
      for (var j = 0; j < entry.llmOperations.length; j++) {
        var op = entry.llmOperations[j];
        if (op && op.model) {
          var opModel = op.model;
          var cleanOpModel = opModel;
          if (opModel.indexOf("/") !== -1) {
            var opParts = opModel.split("/");
            cleanOpModel = opParts[opParts.length - 1];
          }
          if (opModel === modelName || cleanOpModel === cleanModel) {
            if (
              entry.llmTokenQuota &&
              entry.llmTokenQuota.limit !== undefined &&
              entry.llmTokenQuota.limit !== null &&
              entry.llmTokenQuota.limit !== ""
            ) {
              return entry.llmTokenQuota.limit;
            }
          }
        }
      }
    }
  }

  return limit;
}

if (typeof exports !== "undefined") {
  exports.getModelTokenLimit = getModelTokenLimit;
}
