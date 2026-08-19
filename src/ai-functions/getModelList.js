function getModelList(quotaData) {
  var result = {
    object: "list",
    data: []
  };

  if (!quotaData) {
    return result;
  }

  var data = quotaData;
  if (typeof quotaData === "string") {
    try {
      data = JSON.parse(quotaData);
    } catch (e) {
      return result;
    }
  } else if (quotaData && quotaData.asJSON) {
    data = quotaData.asJSON;
  }

  if (!data || !Array.isArray(data)) {
    return result;
  }

  var seenModels = {};
  var createdTimestamp = 1686935002;

  for (var i = 0; i < data.length; i++) {
    var entry = data[i];
    if (entry && entry.llmOperations && Array.isArray(entry.llmOperations)) {
      for (var j = 0; j < entry.llmOperations.length; j++) {
        var op = entry.llmOperations[j];
        if (op && op.model) {
          var modelId = op.model;
          if (!seenModels[modelId]) {
            seenModels[modelId] = true;
            result.data.push({
              id: modelId,
              object: "model",
              created: createdTimestamp,
              owned_by: "system"
            });
          }
        }
      }
    }
  }

  return result;
}

if (typeof exports !== "undefined") {
  exports.getModelList = getModelList;
}
