export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const prompt = req.query.prompt || (req.body && req.body.prompt);
        const imageUrl = req.query.imageUrl || (req.body && req.body.imageUrl);
        const apiKey = 'AIzaSyChJDkYqSzxFHJtAxd65yoDaMP-45BGRtA';
        const uid = 'kate-ai-' + Date.now();
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let apiUrl = `https://kryptonite-api-library.onrender.com/api/gemini-lite?prompt=${encodeURIComponent(prompt)}&uid=${uid}&apikey=${apiKey}`;
        
        if (imageUrl) {
            apiUrl += `&imgUrl=${encodeURIComponent(imageUrl)}`;
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
            }
        });

        if (!response.ok) {
            throw new Error(`External API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.status) {
            throw new Error(data.error || 'API returned error');
        }

        return res.status(200).json({ 
            success: true, 
            result: data.response 
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch response from AI',
            message: error.message 
        });
    }
}
