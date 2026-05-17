const apiKey = "***REMOVED***";
fetch("https://api.elevenlabs.io/v1/voices", {
  headers: { "xi-api-key": apiKey }
}).then(r => r.json()).then(d => {
  if (d.detail) {
    console.log("Error:", d.detail);
  } else {
    console.log("Success! Found", d.voices?.length, "voices.");
  }
}).catch(console.error);
