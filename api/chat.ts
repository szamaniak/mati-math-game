import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Zabezpieczenie: Przyjmujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - użyj POST' });
  }

  // 2. Pobieramy prompt z body
  const { prompt } = req.body;
  
  // 3. Pobieramy klucz z Env Variables Vercela
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza API w konfiguracji serwera' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // DODAJEMY TO TUTAJ:
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100,
          topP: 0.95, // Dodatkowa stabilność przy kreatywności
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    
    // 5. Zwracamy odpowiedź prosto do gry
    return res.status(200).json(data);

  } catch (error) {
    console.error('Błąd Proxy:', error);
    return res.status(500).json({ error: 'Błąd bramki API' });
  }
}