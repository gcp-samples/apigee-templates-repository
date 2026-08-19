function testDeniedModels(requestInfo) {
  var result = true;
  if (!requestInfo) return result;
  if (requestInfo.deniedModelPatterns && requestInfo.deniedModelPatterns !== "NONE") {
    var patterns = requestInfo.deniedModelPatterns.split(";");
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      if (!pattern) continue;
      if (requestInfo.type === "googlecloud") {
        if (requestInfo.url && requestInfo.url.indexOf(pattern) !== -1) {
          result = false;
          break;
        }
      } else if (requestInfo.type === "oai" && requestInfo.requestContent && requestInfo.requestContent["model"]) {
        if (requestInfo.requestContent["model"].indexOf(pattern) !== -1) {
          result = false;
          break;
        }
      } else if (requestInfo.type === "oai") {
        result = false;
        break;
      }
    }
  }
  return result;
}

if (typeof exports !== "undefined") {
  exports.testDeniedModels = testDeniedModels;
}
