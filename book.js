// bookMailer.js
import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Registers the book mailer route on an existing Express app.
 * Safe to import into index.js without redefining app, cors, or dotenv.
 */
export default function registerBookMailerRoutes(app) {
  app.post("/send-book", async (req, res) => {
    const { name, phone, email, price } = req.body;

    console.log("📩 Incoming request:", req.body);

    // ✅ Basic validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // ✅ ENV check
    if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL || !process.env.RECEIVER_EMAIL) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    try {
      // =========================
      // 1️⃣ SEND ADMIN EMAIL
      // =========================
      await axios.post(
        BREVO_API_URL,
        {
          sender: { email: process.env.SENDER_EMAIL, name: "China To Cash Orders" },
          to: [{ email: process.env.RECEIVER_EMAIL }],
          subject: `🔥 New Lead: ${name}`,
          htmlContent: `
            <h2>New Customer Ready To Pay</h2>
            <p><b>Name:</b> ${name}</p>
            <p><b>Phone:</b> ${phone}</p>
            <p><b>Email:</b> ${email || "Not provided"}</p>
            <hr/>
            <p style="color:green;"><b>Status:</b> Waiting for payment</p>
          `,
        },
        {
          headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      console.log("✅ Admin email sent");

      // =========================
      // 2️⃣ SEND USER EMAIL WITH BUTTON
      // =========================
      if (email && email.includes("@")) {
        await axios.post(
          BREVO_API_URL,
          {
            sender: { email: process.env.SENDER_EMAIL, name: "Order Confirmation" },
            to: [{ email: email, name: name }],
            subject: "Complete Your Order (Important)",
            htmlContent: `
              <h2>Hi ${name},</h2>
              <p>Your request for the <b>China To Cash Playbook</b> has been received.</p>
              <p><b>To complete your order, send ${price} to:</b></p>
              <div style="background:#f4f4f4;padding:15px;border-radius:8px;">
                <p><b>Account Name:</b> Edward Maduneme</p>
                <p><b>Bank:</b> Opay</p>
                <p><b>Account Number:</b> 8168054543</p>
              </div>
              <p style="margin-top:15px;">After payment, send your screenshot via WhatsApp:</p>
              <a href="https://wa.me/2348168054543" 
                 style="display:inline-block;margin-top:10px;padding:12px 20px;background-color:#28a745;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                Send Payment Proof
              </a>
              <hr/>
              <p style="color:red;"><b>Important:</b> Access is only delivered after payment confirmation.</p>
              <p>Act fast to avoid delays.</p>
              <p><b>— Edward</b></p>
            `,
          },
          {
            headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" },
            timeout: 10000,
          }
        );
        console.log("✅ User email sent");
      } else {
        console.log("⚠️ Invalid or missing user email — skipping user email");
      }

      return res.json({ success: true, message: "Lead captured successfully" });
    } catch (error) {
      console.error("❌ Mailer error:", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Failed to process request" });
    }
  });
}