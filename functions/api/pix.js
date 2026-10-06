export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { nome, email, telefone, plano } = body;
        const amount = plano === "premium" ? 29.90 : 49.90;

        const CLIENT_ID = env.OASYFY_CLIENT_ID;
        const CLIENT_SECRET = env.OASYFY_CLIENT_SECRET;
        
        if (!CLIENT_ID || !CLIENT_SECRET) {
            return new Response(JSON.stringify({ error: "Chaves da Oasyfy nao configuradas no Cloudflare (Variaveis de Ambiente)." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const oasyfyResponse = await fetch("https://app.oasyfy.com/api/v1/gateway/pix/receive", {
            method: "POST",
            headers: {
                "x-public-key": CLIENT_ID,
                "x-secret-key": CLIENT_SECRET,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifier: "req-" + Date.now(),
                amount: amount,
                client: {
                    name: nome || "Cliente",
                    email: email || "cliente@email.com",
                    phone: telefone || "(11) 99999-9999",
                    document: "00000000000"
                }
            })
        });

        const rawText = await oasyfyResponse.text();
        let data;
        try { data = JSON.parse(rawText); } catch(e) { data = rawText; }

        if (!oasyfyResponse.ok || !data || !data.pix) {
            return new Response(JSON.stringify({ error: "Erro de comunicacao com Oasyfy", details: data }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({
            qrCodeUrl: data.pix.image || "",
            pixCopiaECola: data.pix.code,
            txid: data.transactionId
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Erro interno", details: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
