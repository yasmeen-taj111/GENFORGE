const { GoogleGenerativeAI } = require('@google/generative-ai');

let client;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is missing');
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
};

const getModel = (systemInstruction, generationConfig) => getClient().getGenerativeModel({
  // Keep this configurable: model availability differs between Gemini accounts.
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  systemInstruction: systemInstruction || undefined,
  generationConfig
});

const generateText = async (prompt, systemInstruction = '') => {
  try {
    const model = getModel(systemInstruction);

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini generateText error:', error);
    throw error;
  }
};

const generateJSON = async (prompt, systemInstruction = '') => {
  try {
    const model = getModel(systemInstruction, {
        responseMimeType: 'application/json'
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini generateJSON error:', error);
    throw error;
  }
};

module.exports = {
  generateText,
  generateJSON,
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY)
};
