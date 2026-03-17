import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

app.post("/send-book", async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required" });
  }

  try {
    // 1️⃣ ADMIN ALERT (THIS IS YOUR MONEY SIGNAL)
    await axios.post(
      BREVO_API_URL,
      {
        sender: {
          email: process.env.SENDER_EMAIL,
          name: "New Book Order",
        },
        to: [{ email: process.env.RECEIVER_EMAIL }],
        subject: `🔥 New Book Lead - ${name}`,
        htmlContent: `
          <h2>New Customer Ready To Pay</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Email:</b> ${email || "Not provided"}</p>

          <hr/>

          <p style="color: green;"><b>Status:</b> Waiting for payment</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // 2️⃣ USER EMAIL (TRUST + INSTRUCTION + URGENCY)
    if (email) {
      await axios.post(
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

            <p>Your request for the book has been received.</p>

            <p><b>To complete your order, make payment using the details below:</b></p>

            <div style="background:#f4f4f4;padding:15px;border-radius:8px;">
              <p><b>Amount:</b> ₦10,000</p>
              <p><b>Account Name:</b> Edward Maduneme</p>
              <p><b>Bank:</b> Opay</p>
              <p><b>Account Number:</b> 8168054543</p>
            </div>

            <p style="margin-top:15px;">
              After payment, send your screenshot via WhatsApp:
            </p>

            <p>
              <a href="https://wa.me/2348168054543">
                Click here to send proof of payment
              </a>
            </p>

            <hr/>

            <p style="color:red;">
              <b>Important:</b> Your access will only be delivered after payment confirmation.
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
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mail error:", error.response?.data || error.message);
    res.status(500).json({ message: "Email sending failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));