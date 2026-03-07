export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, firstName, shareUrl } = req.body;

    if (!email || !firstName || !shareUrl) {
        return res.status(400).json({ error: 'Missing email, firstName, or shareUrl' });
    }

    try {
        const RESEND_API_KEY = process.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY environment variable");
            return res.status(500).json({ error: 'Server misconfiguration' });
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Vana HR <c@compamobile.com>',
                to: [email],
                subject: 'Estamos cerca para que comience!',
                html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Estamos bastante cerca para que comiences en Vana. Estamos muy emocionados. Para poder continuar, necesitamos que hagas lo siguiente:</p>
            <ul>
              <li><a href="${shareUrl}">Completar Perfil</a></li>
              <li>Subir los archivos en ese perfil</li>
            </ul>
          </div>
        `,
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, id: data.id });
        } else {
            console.error("Resend API Error:", data);
            return res.status(400).json({ success: false, error: data });
        }

    } catch (error) {
        console.error("Email sending Failed", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
