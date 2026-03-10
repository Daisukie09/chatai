// Vercel Serverless Function - API Proxy
// This solves CORS issues by making the API call from the server

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Get prompt from query or body
        const prompt = req.query.prompt || (req.body && req.body.prompt);
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Call the external AI API
        const apiUrl = `https://smfahim.xyz/ai/ai4chat?action=chat&prompt=${encodeURIComponent(prompt)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
            }
        });

        if (!response.ok) {
            throw new Error(`External API error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            data = json.output?.result || json;
        } else {
            data = await response.text();
        }

        // Return the response
        return res.status(200).json({ 
            success: true, 
            result: data 
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch response from AI',
            message: error.message 
        });
    }
}
