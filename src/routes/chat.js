const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { messages, system } = req.body;
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system || 'You are a helpful campus assistant.' },
        ...messages
      ]
    });
    const text = response.choices[0].message.content;
    res.json({ content: [{ text }] });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;