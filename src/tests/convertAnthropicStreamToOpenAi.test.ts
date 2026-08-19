import { describe, it, expect } from "vitest";
const { convertAnthropicStreamToOpenAi } = require("../ai-functions/convertAnthropicStreamToOpenAi.js");

describe("convertAnthropicStreamToOpenAi", () => {
  it("should convert message_start, text_delta, thinking_delta, and message_delta", () => {
    const streamPayload = [
      'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_stream1","model":"claude-3-7-sonnet","usage":{"input_tokens":10,"output_tokens":1}}}',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"Thinking process..."}}',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"Hello stream"}}',
      'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":15}}',
      'event: message_stop\ndata: {"type":"message_stop"}'
    ].join("\n\n");

    const result = convertAnthropicStreamToOpenAi(streamPayload, "claude-3-7-sonnet");
    expect(result.messageId).toBe("chatcmpl-stream1");
    expect(result.contentString).toContain("reasoning_content");
    expect(result.contentString).toContain("Hello stream");
    expect(result.contentString).toContain("data: [DONE]");
    expect(result.usageData.usageFound).toBe(true);
    expect(result.usageData.totalTokenCount).toBe(25);
  });

  it("should convert tool_use content_block_start and input_json_delta", () => {
    const toolStream = [
      'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"tool_1","name":"get_weather"}}',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"location\\": \\"Paris\\"}"}}'
    ].join("\n\n");

    const res = convertAnthropicStreamToOpenAi(toolStream, "claude-3-5-sonnet", "chatcmpl-custom1");
    expect(res.contentString).toContain("tool_calls");
    expect(res.contentString).toContain("get_weather");
    expect(res.contentString).toContain('location');
  });
});
