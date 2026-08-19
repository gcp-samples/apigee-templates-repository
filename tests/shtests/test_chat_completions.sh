#!/usr/bin/env bash
# ==============================================================================
# OpenAI /v1/chat/completions Integration Test Suite
#
# Tests the OpenAI Chat Completions endpoint using curl, jq, and bash.
# Automatically loads configuration from tests/.env.
# Logs full requests, responses, and test outputs to tests/test_chat_completions.local.log.
#
# Requirements:
#   - curl
#   - jq
#   - gcloud (optional, for automatic ADC token generation if token not provided)
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

VERBOSE=false
START_TIME=$(date +%s)

# Determine script, tests, and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${SCRIPT_DIR}/test_chat_completions.local.log"

# Usage help
show_help() {
  echo -e "${BOLD}Usage:${NC} $(basename "$0") [OPTIONS]

${BOLD}Options:${NC}
  -v, --verbose      Enable verbose mode (print requests, headers, and full responses to terminal)
  -u, --url <url>    Override base URL (default: APIGEE_X_URL or EMULATOR_URL from .env)
  -k, --key <key>    Override API key (x-api-key header)
  -t, --token <tok>  Override Bearer token (Authorization header)
  -p, --project <id> Override GCP project ID (x-project header)
  -l, --log <file>   Override output log file (default: tests/shtests/test_chat_completions.local.log)
  -h, --help         Show this help message and exit

${BOLD}Environment Variables (.env):${NC}
  APIGEE_X_URL          Base gateway URL (e.g. https://api.example.com)
  APIGEE_X_API_KEY      API key sent via 'x-api-key' header
  GCLOUD_ADC_TOKEN      Bearer token sent via 'Authorization: Bearer ...' (if API key not set)
  APIGEE_X_PROJECT_ID   Project ID sent via 'x-project' header"
}

# Parse command line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -u|--url)
      CUSTOM_URL="$2"
      shift 2
      ;;
    -k|--key)
      CUSTOM_KEY="$2"
      shift 2
      ;;
    -t|--token)
      CUSTOM_TOKEN="$2"
      shift 2
      ;;
    -p|--project)
      CUSTOM_PROJECT="$2"
      shift 2
      ;;
    -l|--log)
      LOG_FILE="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      show_help
      exit 1
      ;;
  esac
done

# Check dependencies
for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}Error: Required command '$cmd' is not installed or not in PATH.${NC}" >&2
    exit 1
  fi
done

# Load environment file
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  set +u
  source "${SCRIPT_DIR}/.env"
  set -u
elif [[ -f "${TESTS_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  set +u
  source "${TESTS_DIR}/.env"
  set -u
elif [[ -f "${PROJECT_ROOT}/.env" ]]; then
  # shellcheck source=/dev/null
  set +u
  source "${PROJECT_ROOT}/.env"
  set -u
fi

# Apply overrides or environment defaults
BASE_URL="${CUSTOM_URL:-${APIGEE_X_URL:-${EMULATOR_URL:-http://localhost:8998}}}"
BASE_URL="${BASE_URL%/}"
COMPLETIONS_URL="${BASE_URL}/v1/chat/completions"

API_KEY="${CUSTOM_KEY:-${APIGEE_X_API_KEY:-}}"
ADC_TOKEN="${CUSTOM_TOKEN:-${GCLOUD_ADC_TOKEN:-}}"
PROJECT_ID="${CUSTOM_PROJECT:-${APIGEE_X_PROJECT_ID:-${EMULATOR_PROJECT_ID:-ai-portals-solution}}}"

# Resolve authentication headers based on rule:
# If APIGEE_X_API_KEY is set, send in x-api-key header.
# Otherwise, send GCLOUD_ADC_TOKEN in Authorization header.
AUTH_TYPE=""
AUTH_HEADER=()

if [[ -n "${API_KEY}" ]]; then
  AUTH_TYPE="API Key (x-api-key)"
  AUTH_HEADER+=("-H" "x-api-key: ${API_KEY}")
else
  # If ADC_TOKEN is empty, try to obtain one via gcloud if available
  if [[ -z "${ADC_TOKEN}" ]] && command -v gcloud >/dev/null 2>&1; then
    ADC_TOKEN="$(gcloud auth application-default print-access-token 2>/dev/null || true)"
  fi

  if [[ -n "${ADC_TOKEN}" ]]; then
    AUTH_TYPE="ADC Bearer Token (Authorization)"
    AUTH_HEADER+=("-H" "Authorization: Bearer ${ADC_TOKEN}")
  else
    AUTH_TYPE="None / Unauthenticated"
  fi
fi

# Additional headers
COMMON_HEADERS=(
  "-H" "Content-Type: application/json"
  "-H" "x-project: ${PROJECT_ID}"
)

# Initialize and truncate log file with header
{
  echo "================================================================================"
  echo "OpenAI /v1/chat/completions Integration Test Execution Log"
  echo "Timestamp:       $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "Target Endpoint: ${COMPLETIONS_URL}"
  echo "Auth Method:     ${AUTH_TYPE}"
  echo "Target Project:  ${PROJECT_ID}"
  echo "Log File:        ${LOG_FILE}"
  echo "================================================================================"
  echo ""
} > "${LOG_FILE}"

echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}${CYAN}   OpenAI /v1/chat/completions API Test Suite         ${NC}"
echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}Target Endpoint:${NC}  ${COMPLETIONS_URL}"
echo -e "${BOLD}Auth Method:${NC}      ${AUTH_TYPE}"
echo -e "${BOLD}Target Project:${NC}   ${PROJECT_ID}"
echo -e "${BOLD}Log File:${NC}         ${LOG_FILE}"
echo -e "${BOLD}Verbose Mode:${NC}     ${VERBOSE}"
echo -e "${BOLD}${CYAN}------------------------------------------------------${NC}\n"

# ------------------------------------------------------------------------------
# Test Execution Helper
# ------------------------------------------------------------------------------
# Arguments:
#   $1: Test Title
#   $2: JSON Request Payload
#   $3: Is Streaming Request (true/false)
#   $4: Expected HTTP Status Code regex (e.g. "200" or "4..|5..")
#   $5: jq validation filter returning boolean (e.g. '.choices | length > 0')
# ------------------------------------------------------------------------------
run_test() {
  local test_name="$1"
  local payload="$2"
  local is_stream="${3:-false}"
  local expected_status="$4"
  local jq_validation="${5:-true}"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  printf "%-62s " "Test ${TOTAL_TESTS}: ${test_name}"

  # Temporary files for output capture
  local response_file
  local status_file
  response_file="$(mktemp)"
  status_file="$(mktemp)"

  local curl_args=(
    "-s"
    "-k"
    "-X" "POST"
    "${COMPLETIONS_URL}"
    "${COMMON_HEADERS[@]}"
  )

  if [[ ${#AUTH_HEADER[@]} -gt 0 ]]; then
    curl_args+=("${AUTH_HEADER[@]}")
  fi

  curl_args+=(
    "-d" "${payload}"
    "-w" "%{http_code}"
    "-o" "${response_file}"
  )

  # Run curl request
  local http_status
  http_status=$(curl "${curl_args[@]}" 2>/dev/null)

  local raw_response
  raw_response="$(cat "${response_file}")"

  # Format JSON payload and response for logging / verbose
  local formatted_payload
  formatted_payload=$(echo "${payload}" | jq . 2>/dev/null || echo "${payload}")

  local formatted_response
  if [[ "${is_stream}" == "true" ]]; then
    formatted_response="${raw_response}"
  else
    formatted_response=$(echo "${raw_response}" | jq . 2>/dev/null || echo "${raw_response}")
  fi

  if [[ "${VERBOSE}" == "true" ]]; then
    echo -e "\n${BLUE}--- [REQUEST] ---${NC}"
    echo "Payload:"
    echo "${formatted_payload}"
    echo -e "${BLUE}--- [RESPONSE (HTTP ${http_status})] ---${NC}"
    echo "${formatted_response}"
    echo -e "${BLUE}-----------------${NC}"
  fi

  # Validate status code
  local status_matched=false
  if [[ "${http_status}" =~ ^(${expected_status})$ ]]; then
    status_matched=true
  fi

  # Validate body contents
  local validation_passed=false
  if [[ "${status_matched}" == "true" ]]; then
    if [[ "${is_stream}" == "true" ]]; then
      # Streaming validation: must contain 'data: ' lines and '[DONE]' marker
      if grep -q "data:" "${response_file}" && grep -q "\[DONE\]" "${response_file}"; then
        validation_passed=true
      fi
    else
      # JSON response validation via jq
      local jq_result
      jq_result=$(echo "${raw_response}" | jq -r "${jq_validation}" 2>/dev/null || echo "false")
      if [[ "${jq_result}" == "true" ]]; then
        validation_passed=true
      fi
    fi
  fi

  local test_result_str="FAIL"
  if [[ "${status_matched}" == "true" && "${validation_passed}" == "true" ]]; then
    echo -e "${GREEN}[PASS]${NC} (HTTP ${http_status})"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    test_result_str="PASS"
  else
    echo -e "${RED}[FAIL]${NC} (HTTP ${http_status}, expected ${expected_status})"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    test_result_str="FAIL"
    if [[ "${VERBOSE}" != "true" ]]; then
      echo -e "${RED}  Response body:${NC}"
      echo "  ${raw_response}" | head -n 5
    fi
  fi

  # Write detailed test log entry
  {
    echo "--------------------------------------------------------------------------------"
    echo "[Test ${TOTAL_TESTS}] ${test_name}"
    echo "--------------------------------------------------------------------------------"
    echo ">>> HTTP REQUEST:"
    echo "POST ${COMPLETIONS_URL}"
    echo "Headers:"
    echo "  Content-Type: application/json"
    echo "  x-project: ${PROJECT_ID}"
    if [[ -n "${API_KEY}" ]]; then
      echo "  x-api-key: ${API_KEY}"
    elif [[ -n "${ADC_TOKEN}" ]]; then
      echo "  Authorization: Bearer ${ADC_TOKEN:0:15}... (truncated)"
    fi
    echo "Payload:"
    echo "${formatted_payload}"
    echo ""
    echo "<<< HTTP RESPONSE (HTTP ${http_status}):"
    echo "${formatted_response}"
    echo ""
    echo "RESULT: ${test_result_str} (Expected HTTP: ${expected_status}, Actual HTTP: ${http_status})"
    echo ""
  } >> "${LOG_FILE}"

  rm -f "${response_file}" "${status_file}"
}

# ------------------------------------------------------------------------------
# Test 1: Standard Chat Completion (google/gemini-3.6-flash)
# ------------------------------------------------------------------------------
PAYLOAD_BASIC=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": "Hello! Reply with the word OK."
    }
  ]
}
EOF
)
run_test "Basic Chat Completion (gemini-3.6-flash)" \
  "${PAYLOAD_BASIC}" \
  false \
  "200" \
  '.object == "chat.completion" and (.choices | length > 0) and (.choices[0].message.content | length > 0)'

# ------------------------------------------------------------------------------
# Test 2: Multi-Turn Conversation with System Prompt
# ------------------------------------------------------------------------------
PAYLOAD_MULTITURN=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are a concise calculator. Output only the numeric answer."
    },
    {
      "role": "user",
      "content": "What is 15 + 25?"
    }
  ]
}
EOF
)
run_test "Multi-Turn with System Prompt" \
  "${PAYLOAD_MULTITURN}" \
  false \
  "200" \
  '(.choices | length > 0) and (.choices[0].message.content | contains("40"))'

# ------------------------------------------------------------------------------
# Test 3: Alternate Model Routing (google/gemini-2.5-flash-lite)
# ------------------------------------------------------------------------------
PAYLOAD_LITE=$(cat <<'EOF'
{
  "model": "google/gemini-2.5-flash-lite",
  "messages": [
    {
      "role": "user",
      "content": "Respond with OK."
    }
  ]
}
EOF
)
run_test "Alternate Model (gemini-2.5-flash-lite)" \
  "${PAYLOAD_LITE}" \
  false \
  "200" \
  '(.choices | length > 0) and (.choices[0].message.content | length > 0)'

# ------------------------------------------------------------------------------
# Test 4: Anthropic Claude Model Routing (anthropic/claude-sonnet-5)
# ------------------------------------------------------------------------------
PAYLOAD_ANTHROPIC=$(cat <<'EOF'
{
  "model": "anthropic/claude-sonnet-5",
  "messages": [
    {
      "role": "user",
      "content": "Hello! Respond with OK."
    }
  ]
}
EOF
)
run_test "Anthropic Claude Routing (claude-sonnet-5)" \
  "${PAYLOAD_ANTHROPIC}" \
  false \
  "200" \
  '(.choices | length > 0) and (.choices[0].message.content | length > 0)'

# ------------------------------------------------------------------------------
# Test 5: Server-Sent Events Streaming ("stream": true)
# ------------------------------------------------------------------------------
PAYLOAD_STREAM=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": "Count from 1 to 3."
    }
  ],
  "stream": true
}
EOF
)
run_test "Streaming SSE Completion (stream: true)" \
  "${PAYLOAD_STREAM}" \
  true \
  "200" \
  'true'

# ------------------------------------------------------------------------------
# Test 6: Generation Hyperparameters (temperature, max_tokens, stop)
# ------------------------------------------------------------------------------
PAYLOAD_PARAMS=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": "Say: Apple Banana Cherry"
    }
  ],
  "temperature": 0.5,
  "max_tokens": 150,
  "stop": ["Cherry"]
}
EOF
)
run_test "Hyperparameters (temperature, max_tokens, stop)" \
  "${PAYLOAD_PARAMS}" \
  false \
  "200" \
  '(.choices | length > 0) and (.choices[0].finish_reason != null)'

# ------------------------------------------------------------------------------
# Test 7: Structured JSON Output Format (response_format)
# ------------------------------------------------------------------------------
PAYLOAD_JSON_FORMAT=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": "Return a JSON object with a single key 'status' and value 'active'."
    }
  ],
  "response_format": {
    "type": "json_object"
  }
}
EOF
)
run_test "Structured JSON Response Format" \
  "${PAYLOAD_JSON_FORMAT}" \
  false \
  "200" \
  'try (.choices[0].message.content | fromjson | .status == "active") catch false'

# ------------------------------------------------------------------------------
# Test 8: Function / Tool Calling (tools & tool_choice)
# ------------------------------------------------------------------------------
PAYLOAD_TOOLS=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": "What is the weather in Seattle?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. Seattle, WA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
EOF
)
run_test "Function / Tool Calling Schema" \
  "${PAYLOAD_TOOLS}" \
  false \
  "200" \
  '(.choices | length > 0) and ((.choices[0].message.tool_calls | length > 0) or (.choices[0].message.content | length > 0))'

# ------------------------------------------------------------------------------
# Test 9: Multi-Part Array Content Format
# ------------------------------------------------------------------------------
PAYLOAD_ARRAY_CONTENT=$(cat <<'EOF'
{
  "model": "google/gemini-3.6-flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello! Reply with OK."
        }
      ]
    }
  ]
}
EOF
)
run_test "Array / Multi-Part Content Format" \
  "${PAYLOAD_ARRAY_CONTENT}" \
  false \
  "200" \
  '(.choices | length > 0) and (.choices[0].message.content | length > 0)'

# ------------------------------------------------------------------------------
# Test 10: Negative Test - Unsupported Model Error Handling
# ------------------------------------------------------------------------------
PAYLOAD_INVALID_MODEL=$(cat <<'EOF'
{
  "model": "invalid-provider/nonexistent-model-xyz",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
EOF
)
run_test "Error Handling (Unsupported Model)" \
  "${PAYLOAD_INVALID_MODEL}" \
  false \
  "400|404|500" \
  'true'

# ------------------------------------------------------------------------------
# Summary Report
# ------------------------------------------------------------------------------
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Append summary to log file
{
  echo "================================================================================"
  echo "Test Run Summary"
  echo "================================================================================"
  echo "Total Tests: ${TOTAL_TESTS}"
  echo "Passed:      ${PASSED_TESTS}"
  echo "Failed:      ${FAILED_TESTS}"
  echo "Duration:    ${DURATION}s"
  if [[ ${FAILED_TESTS} -gt 0 ]]; then
    echo "Status:      FAILED"
  else
    echo "Status:      SUCCESS"
  fi
  echo "================================================================================"
} >> "${LOG_FILE}"

echo -e "\n${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}${CYAN}                   Test Summary                       ${NC}"
echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}Total Tests:${NC}   ${TOTAL_TESTS}"
echo -e "${GREEN}${BOLD}Passed:${NC}        ${PASSED_TESTS}"
if [[ ${FAILED_TESTS} -gt 0 ]]; then
  echo -e "${RED}${BOLD}Failed:${NC}        ${FAILED_TESTS}"
else
  echo -e "${BOLD}Failed:${NC}        ${FAILED_TESTS}"
fi
echo -e "${BOLD}Duration:${NC}      ${DURATION}s"
echo -e "${BOLD}Log File:${NC}      ${LOG_FILE}"
echo -e "${BOLD}${CYAN}======================================================${NC}"

if [[ ${FAILED_TESTS} -gt 0 ]]; then
  echo -e "\n${RED}${BOLD}FAILED: Some tests did not pass.${NC}"
  exit 1
else
  echo -e "\n${GREEN}${BOLD}SUCCESS: All tests passed!${NC}"
  exit 0
fi
