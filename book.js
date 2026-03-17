import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// 🔍 Health check route
app.get("/", (req, res) => {
  res.send("✅ Mailer backend is running");
});

// 🚀 Main mailer route
app.post("/send-book", async (req, res) => {
  const { name, phone, email } = req.body;

  console.log("📩 Incoming request:", req.body);

  // ✅ Basic validation
  if (!name || !phone) {
    console.log("❌ Missing required fields");
    return res.status(400).json({
      success: false,
      message: "Name and phone are required",
    });
  }

  // ✅ ENV check (prevents silent failure)
  if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL || !process.env.RECEIVER_EMAIL) {
    console.log("❌ Missing environment variables");
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  try {
    // =========================
    // 1️⃣ SEND ADMIN EMAIL (CRITICAL)
    // =========================
    console.log("📤 Sending admin email...");

    await axios.post(
      BREVO_API_URL,
      {
        sender: {
          email: process.env.SENDER_EMAIL,
          name: "China To Cash Orders",
        },
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
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000, // ⏱ prevents hanging
      }
    );

    console.log("✅ Admin email sent");

    // =========================
    // 2️⃣ SEND USER EMAIL (NON-BLOCKING)
    // =========================
    const isValidEmail =
      email && typeof email === "string" && email.includes("@");

    if (isValidEmail) {
      console.log("📤 Sending user email...");

      axios
        .post(
          BREVO_API_URL,
          {
            sender: {
              email: process.env.SENDER_EMAIL,
              name: "Order Confirmation",
            },
            to: [{ email: email, name: name }],
            subject: "Complete Your Order (Important)",
            htmlContent: `
              <h2>Hi ${name},</h2>

              <p>Your request for the <b>China To Cash Playbook</b> has been received.</p>

              <p><b>To complete your order, send ₦10,000 to:</b></p>

              <div style="background:#f4f4f4;padding:15px;border-radius:8px;">
                <p><b>Account Name:</b> Edward Maduneme</p>
                <p><b>Bank:</b> Opay</p>
                <p><b>Account Number:</b> 8168054543</p>
              </div>

              <p style="margin-top:15px;">
                After payment, send your screenshot via WhatsApp:
              </p>

              <p>
                <a href="https://wa.me/2348168054543">
                  Send Payment Proof
                </a>
              </p>

              <hr/>

              <p style="color:red;">
                <b>Important:</b> Access is only delivered after payment confirmation.
              </p>

              <p>Act fast to avoid delays.</p>

              <p><b>— Edward</b></p>
            `,
          },
          {
            headers: {
              "api-key": process.env.BREVO_API_KEY,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        )
        .then(() => {
          console.log("✅ User email sent");
        })
        .catch((err) => {
          console.error(
            "⚠️ User email failed:",
            err.response?.data || err.message
          );
        });
    } else {
      console.log("⚠️ Invalid or missing email — skipping user email");
    }

    // =========================
    // ✅ FINAL RESPONSE
    // =========================
    return res.json({
      success: true,
      message: "Lead captured successfully",
    });

  } catch (error) {
    console.error(
      "❌ Admin email failed:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});