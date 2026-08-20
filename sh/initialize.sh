# KVM
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/environments/$APIGEE_ENV/keyvaluemaps" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H "Content-Type: application/json" -d '{
  "name": "AI-Config",
  "encrypted": "false"
}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/environments/$APIGEE_ENV/keyvaluemaps/AI-Config/entries" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H "Content-Type: application/json" -d '{
  "name": "ModelRoutingText",
  "value": "{\"models\": {\"google/\": \"googlecloud-oai\", \"anthropic/\": \"googlecloud\", \"openai/\": \"openai\"}, \"mappings\": {\"google/gemini-flash-latest\": \"google/gemini-3.6-flash\"}}"
}'

# data collectors
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_model", "description": "Model name", "type": "STRING"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_provider", "description": "Model provider", "type": "STRING"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_cost_center", "description": "Cost center", "type": "STRING"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_total_token_count", "description": "The total token count", "type": "INTEGER"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_prompt_token_count", "description": "The prompt token count", "type": "INTEGER"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_response_token_count", "description": "The response token count", "type": "INTEGER"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_response_type", "description": "The response type, either streaming or non-streaming", "type": "STRING"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_time_first_token", "description": "The time in milliseconds to the first token", "type": "INTEGER"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_request_cost", "description": "Request cost", "type": "FLOAT"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_response_cost", "description": "Response cost", "type": "FLOAT"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_total_cost", "description": "Total cost", "type": "FLOAT"}'
curl -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/datacollectors" -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H 'Content-Type: application/json; charset=utf-8' \
-d '{"name": "dc_ai_user", "description": "AI user", "type": "STRING"}'

# cost report
curl -s -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/reports" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '
{
  "name": "ai_token_cost_by_model_user",
  "displayName": "AI Token Cost by Model and User",
  "chartType": "col",
  "timeUnit": "day",
  "metrics": [
    {"name": "dc_ai_total_cost", "function": "sum"},
    {"name": "dc_ai_request_cost", "function": "sum"},
    {"name": "dc_ai_response_cost", "function": "sum"}
  ],
  "dimensions": ["dc_ai_model", "developer_email"]
}'

# model latency report
curl -s -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/reports" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '
{
  "name": "ai_model_usage_latency",
  "displayName": "AI Model Usage and Latency",
  "chartType": "col",
  "timeUnit": "hour",
  "metrics": [
    {"name": "dc_ai_total_token_count", "function": "sum"},
    {"name": "dc_ai_time_first_token", "function": "avg"},
    {"name": "message_count", "function": "sum"}
  ],
  "dimensions": ["apiproxy", "dc_ai_model", "dc_ai_response_type"]
}'

# model tokens
curl -s -X POST "https://apigee.googleapis.com/v1/organizations/$GOOGLE_CLOUD_PROJECT/reports"   -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"   -H "Content-Type: application/json; charset=utf-8"   -d '
{
  "name": "ai_token_counts_by_model_user",
  "displayName": "AI Token Counts by Model and User",
  "chartType": "col",
  "timeUnit": "day",
  "metrics": [
    {"name": "dc_ai_total_token_count", "function": "sum"},
    {"name": "dc_ai_prompt_token_count", "function": "sum"},
    {"name": "dc_ai_response_token_count", "function": "sum"}
  ],
  "dimensions": ["dc_ai_model", "developer_email"]
}'
