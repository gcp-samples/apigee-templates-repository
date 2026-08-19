var contentString = context.getVariable("response.event.current.content");
var type = "streaming";
if (!contentString) {
  contentString = context.getVariable("response.content");
  type = "non-streaming"
}
print(contentString);

var modelName = context.getVariable("ai.model");
var requestTokenCount = context.getVariable("ai.requestTokenCount");
var timeToFirstToken = context.getVariable("ai.timeToFirstToken");
if (!timeToFirstToken) {
  var request_start_time = context.getVariable('client.received.start.timestamp');
  var timeNow = Date.now();
  timeToFirstToken = timeNow - request_start_time;
  context.setVariable("ai.timeToFirstToken", timeToFirstToken);
}
var usageData = getUsageData(contentString);
if (usageData.model) context.setVariable("ai.model", usageData.model);
if (usageData.requestTokenCount) context.setVariable("ai.requestTokenCount", usageData.requestTokenCount);
if (modelName) usageData.model = modelName;
if (requestTokenCount) usageData.requestTokenCount = requestTokenCount;
if (timeToFirstToken) usageData.timeToFirstToken = timeToFirstToken;

if (usageData.responseTokenCount > 0) {
  context.setVariable("ai.responseTokenCount", usageData.responseTokenCount);
  usageData.totalTokenCount = usageData.requestTokenCount + usageData.responseTokenCount;
  context.setVariable("ai.totalTokenCount", usageData.totalTokenCount.toString());
  usageData.type = type;
  print("Sending analytics data: " + JSON.stringify(usageData));
  var host = context.getVariable("originalHostName");
  var headers = {"Content-Type": "application/json"};
  var apiKey = context.getVariable("verifyapikey.VA-VerifyKey.client_id");
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  var myRequest = new Request('https://' + host + "/ai-analytics","POST", headers, JSON.stringify(usageData));
  print("Sending to: " + 'https://' + host + "/ai-analytics");
  httpClient.send(myRequest);
}
