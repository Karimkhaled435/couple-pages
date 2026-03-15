export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, loverName } = req.body;

  try {
    const response = await fetch("https://app.fawaterk.com/api/v2/invoices/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer 67cc15bd91387e48b7d59d60526f83c19ebde5886c8fa784af`,
      },
      body: JSON.stringify({
        cartItems: [{ name: "Couple Page", price: "205", quantity: "1" }],
        cartTotal: "205",
        currency: "EGP",
        customer: {
          first_name: loverName || "Customer",
          last_name: ".",
          email: "customer@couplepage.app",
          phone: "01000000000",
        },
        redirectionUrls: {
          successUrl: `https://couple-pages.vercel.app/success?token=${token}`,
          failUrl: `https://couple-pages.vercel.app?error=payment_failed`,
          pendingUrl: `https://couple-pages.vercel.app?error=payment_pending`,
        },
      }),
    });

    const text = await response.text();
    console.log("Fawaterak raw response:", text);

    let data;
    try { data = JSON.parse(text); } catch { return res.status(500).json({ error: "Invalid JSON from Fawaterak", raw: text }); }

    console.log("Fawaterak parsed:", JSON.stringify(data));
    return res.status(200).json(data);

  } catch (err) {
    console.error("Invoice error:", err);
    return res.status(500).json({ error: err.message });
  }
}