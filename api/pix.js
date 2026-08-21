export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nome, email, telefone, plano } = req.body;
    const amount = plano === 'premium' ? 29.90 : 49.90;

    const CLIENT_ID = process.env.OASYFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.OASYFY_CLIENT_SECRET;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'Chaves da Oasyfy nÃ£o configuradas nas VariÃ¡veis de Ambiente da Vercel.' });
    }

    try {
        const response = await fetch('https://app.oasyfy.com/api/v1/gateway/pix/receive', {
            method: 'POST',
            headers: {
                'x-public-key': CLIENT_ID,
                'x-secret-key': CLIENT_SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier: `req-${Date.now()}`,
                amount: amount,
                client: {
                    name: nome || 'Cliente',
                    email: email || 'cliente@email.com',
                    phone: telefone || '(11) 99999-9999',
                    document: '00000000000'
                }
            })
        });

        const rawText = await response.text(); 
        let data; 
        try { 
            data = JSON.parse(rawText); 
        } catch(e) { 
            data = rawText; 
        }

        if (!response.ok || !data || !data.pix) {
            console.error('Oasyfy API Error:', data);
            return res.status(400).json({ error: 'Erro de comunicaÃ§Ã£o com Oasyfy', details: data });
        }

        res.status(200).json({
            qrcode: data.pix.image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.pix.code)}`,
            copiaecola: data.pix.code,
            txid: data.transactionId
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
