# Apigee Proxy Integration Test Suite

This directory contains integration test suites for both the **Local Apigee Emulator** and remote **Apigee X** deployments.

## Directory Structure

- **`shtests/`**: Shell-based test suites using `curl` and `jq` (quickest, standalone, no Python dependencies required).
  - `shtests/test_chat_completions.sh`: Tests the OpenAI `/v1/chat/completions` endpoint across models, streaming, multi-turn, functions, hyperparameters, and error handling.
  - `shtests/test_chat_completions.local.log`: Detailed log generated per run containing full request headers/payloads, response bodies, and assertion results.
- **`pytests/`**: Comprehensive Pytest test suites.
  - `pytests/conftest.py`: Shared fixtures, `LoggingSession`, and credential/token resolution.
  - `pytests/test_emulator.py`: Test suite targeting the local Apigee Emulator container.
  - `pytests/test_apigee_x.py`: Test suite targeting remote Apigee X environments.
- **`.env`**: Shared environment variables for base URLs, API keys, and project settings.

---

## 1. Shell Test Suite (`shtests/`)

The shell test suite is the simplest way to test proxies without installing Python or dependencies. It uses standard `curl`, `jq`, and shell extensions, automatically loading settings from `tests/.env`.

### Quick Run

```bash
# Run chat completions test suite:
./tests/shtests/test_chat_completions.sh
```

### Options & Verbosity

| Command / Option | Description |
| --- | --- |
| `./tests/shtests/test_chat_completions.sh` | **Standard**: Clean pass/fail output per test with timing summary. |
| `./tests/shtests/test_chat_completions.sh -v` | **Verbose**: Prints outgoing request payloads, headers, and full HTTP responses live in terminal. |
| `./tests/shtests/test_chat_completions.sh -u <url>` | Override base URL (e.g. `https://api.your-domain.com`). |
| `./tests/shtests/test_chat_completions.sh -k <key>` | Override API key (`x-api-key` header). |
| `./tests/shtests/test_chat_completions.sh -t <tok>` | Override Bearer token (`Authorization: Bearer <tok>`). |
| `./tests/shtests/test_chat_completions.sh -h` | Display usage and help message. |

### Run Log File

Every run overwrites `tests/shtests/test_chat_completions.local.log` with a structured audit log containing:
- Execution timestamp, endpoint, auth type, and GCP project ID.
- Exact HTTP request method, URL, headers, and formatted JSON payload.
- Full HTTP response status code and formatted response body (or SSE stream chunks).
- Test assertion result (`PASS` / `FAIL`) and summary metrics.

---

## 2. Pytest Test Suite (`pytests/`)

Pytest suites provide deep assertions and integrate with CI/CD pipelines.

### Output & Verbosity Modes

Output capture is managed natively by `pytest`:

| Command | Output Behavior |
| --- | --- |
| `pytest tests/pytests/` | **Default / Clean**: Prints summary progress (`.....`). Hides HTTP request/response logs. |
| `pytest -v tests/pytests/` | **Verbose Results**: Displays individual test names and status (`PASSED`, `SKIPPED`). |
| `pytest -s tests/pytests/` | **Live Debug Logs**: Disables output capture, streaming full HTTP requests and responses live. |
| `pytest -v -s tests/pytests/` | **Full Verbose + Live Debug**: Displays individual test names and live HTTP payloads. |

> **Note on Test Failures**: If any test fails, `pytest` automatically dumps the captured HTTP request and response payload for that specific failing test.

---

### Running Pytest Suites

#### A. Local Emulator

Local emulator tests support both OpenAI Chat Completions (`/v1/chat/completions`) and Gemini Native (`/v1/models`) endpoints.

- **OpenAI Chat Completions** endpoints use `GCLOUD_ADC_TOKEN` for authentication.
- **Gemini Native** endpoints (`ai-generate-content.yaml`) use `GEMINI_API_KEY` (passed via query parameter `?key=...` or `x-goog-api-key` header).

```bash
# Optional overrides (defaults shown below):
export EMULATOR_URL="http://localhost:8998"
export EMULATOR_PROJECT_ID="ai-portals-solution"
export GCLOUD_ADC_TOKEN="$(gcloud auth application-default print-access-token)"
export GEMINI_API_KEY="your-gemini-api-key"

# Run local emulator test suite:
pytest tests/pytests/test_emulator.py
```

#### B. Remote Apigee X

Remote Apigee X tests require the target URL and developer app API key:

```bash
# Required remote configuration:
export APIGEE_X_URL="https://api.your-domain.com"
export APIGEE_X_API_KEY="your-apigee-x-api-key"
export APIGEE_X_PROJECT_ID="your-apigee-x-project-id"
export GCLOUD_ADC_TOKEN="$(gcloud auth application-default print-access-token)"

# Run remote Apigee X test suite:
pytest tests/pytests/test_apigee_x.py
```

#### Single-Line Execution Example

```bash
APIGEE_X_URL="https://api.your-domain.com" APIGEE_X_API_KEY="your-api-key" pytest tests/pytests/test_apigee_x.py
```
