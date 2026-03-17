import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import registerBookMailerRoutes from "./book.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

registerBookMailerRoutes(app);

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";



// Route to handle form submission
app.post("/send-mail", async (req, res) => {
  const { name, phone, email, address, state, product, price } = req.body;
  console.log("received body", req.body);

  if (!name || !phone || !email || !address || !state || !product || !price) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // 1️⃣ Send email to admin
    await axios.post(
      BREVO_API_URL,
      {
        sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
        to: [{ email: process.env.RECEIVER_EMAIL, name: "Admin" }],
        subject: `New Order from ${name}`,
        htmlContent: `
          <h2>New Purchase Details</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Address:</b> ${address}</p>
          <p><b>Delivery State:</b> ${state}</p>
          <p><b>Delivery Product:</b> ${product}</p>
          <p><b>Price:</b> ₦${price}</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // 2️⃣ Send confirmation email to the user
    await axios.post(
      BREVO_API_URL,
      {
        sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME },
        to: [{ email: email, name: name }],
        subject: "Your Order Has Been Received!",
        htmlContent: `
          <h2>Hi ${name},</h2>
          <p>Thanks for placing your order! Here’s your order summary:</p>
          <ul>
            <li><b>Name:</b> ${name}</li>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>Address:</b> ${address}</li>
            <li><b>Delivery State:</b> ${state}</li>
            <li><b>Delivery Product:</b> ${product}</li>
            <li><b>Delivery Price:</b> ₦${price}</li>
          </ul>
          <p>We’ll contact you shortly for delivery confirmation.</p>
          <p><b>Thank you for shopping with us!</b></p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mail error:", error.response?.data || error.message);
    res.status(500).json({ message: "Email sending failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; margin-top: 100px;">
        <h1>✅ Server is running!</h1>
        <p>Your backend is live on port ${PORT}.</p>
      </body>
    </html>
  `);
});