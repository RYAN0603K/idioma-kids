export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nome, email, telefone, plano } = req.body;
    const amount = plano === 'premium' ? 29.90 : 49.90;

    const CLIENT_ID = process.env.OASYFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.OASYFY_CLIENT_SECRET;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'Chaves da Oasyfy não configuradas nas Variáveis de Ambiente da Vercel.' });
    }

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try {
        const response = await fetch('https://app.oasyfy.com/api/v1/pagamentos/pix', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                description: `Idioma Kids - Plano ${plano}`,
                customer: {
                    name: nome || 'Cliente',
                    email: email || 'cliente@email.com',
                    document: '00000000000'
                }
            })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            console.error('Oasyfy API Error:', data);
            return res.status(400).json({ error: 'Erro de comunicação com Oasyfy', details: data });
        }

        res.status(200).json({
            qrCode: data.qrcode || data.qr_code || 'QR_CODE_NOT_RETURNED',
            qrCodeUrl: data.qrcode_url || data.qr_code_url || '',
            pixCopiaECola: data.pix_copia_e_cola || data.payload || 'COPIA_E_COLA_NOT_RETURNED'
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
