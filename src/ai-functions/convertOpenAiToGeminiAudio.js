function convertOpenAiToGeminiAudio(openAiPayload) {
  if (!openAiPayload) return {};

  var inputText = "";
  if (typeof openAiPayload.input === "string") {
    inputText = openAiPayload.input;
  } else if (Array.isArray(openAiPayload.input)) {
    inputText = openAiPayload.input.join(" ");
  } else if (typeof openAiPayload.prompt === "string") {
    inputText = openAiPayload.prompt;
  }

  var voiceMap = {
    "alloy": "Puck",
    "echo": "Charon",
    "fable": "Kore",
    "onyx": "Fenrir",
    "nova": "Aoede",
    "shimmer": "Kore",
    "ash": "Puck",
    "coral": "Kore",
    "sage": "Charon",
    "verse": "Fenrir"
  };

  var rawVoice = openAiPayload.voice || "alloy";
  var voiceName = "Puck";
  if (rawVoice && voiceMap[rawVoice.toLowerCase()]) {
    voiceName = voiceMap[rawVoice.toLowerCase()];
  } else if (rawVoice) {
    voiceName = rawVoice;
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: inputText }
        ]
      }
    ],
    generation_config: {
      response_modalities: ["AUDIO"],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: voiceName
          }
        }
      }
    }
  };
}

if (typeof exports !== "undefined") {
  exports.convertOpenAiToGeminiAudio = convertOpenAiToGeminiAudio;
}
