const apiKey = process.env.ELEVENLABS_API_KEY;
fetch("https://api.elevenlabs.io/v1/voices", {
  headers: { "xi-api-key": apiKey }
}).then(r => r.json()).then(d => {
  if (d.detail) {
    console.log("Error:", d.detail);
  } else {
    console.log("Success! Found", d.voices?.length, "voices.");
    const max = d.voices?.find(v => v.voice_id === "VR6AewLTigWG4xSOukaG");
    console.log("Voice Max:", max ? "Exists!" : "Not found in list");
  }
}).catch(console.error);
