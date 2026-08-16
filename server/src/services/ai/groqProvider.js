const Groq = require('groq-sdk');

let client;
const getClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key is missing');
  if (!client) client = new Groq({ apiKey });
  return client;
};

const generateText = async (prompt, systemInstruction = '') => {
  try {
    const groq = getClient();
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Groq generateText error:', error);
    throw error;
  }
};

const generateJSON = async (prompt, systemInstruction = '') => {
  try {
    const groq = getClient();
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Groq generateJSON error:', error);
    throw error;
  }
};

module.exports = {
  generateText,
  generateJSON,
  isConfigured: () => Boolean(process.env.GROQ_API_KEY)
};
