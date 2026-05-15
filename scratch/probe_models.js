const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function listModels() {
  // Manually parse .env.local
  let apiKey = "";
  try {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const match = envFile.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim().replace(/['"]/g, "");
  } catch (e) {
    console.log("Error reading .env.local:", e.message);
  }

  if (!apiKey) {
    console.log("No API key found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToProbe = [
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash",
    "gemini-3.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro"
  ];

  for (const modelId of modelsToProbe) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      await model.generateContent("hi");
      console.log(`✅ ${modelId} is AVAILABLE`);
    } catch (err) {
      console.log(`❌ ${modelId} failed: ${err.message}`);
    }
  }
}

listModels();
