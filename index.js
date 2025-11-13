
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail", // or use custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route to handle form submission
app.post("/send-mail", async (req, res) => {
  const { name, phone, email, address, state, product, price } = req.body;
  console.log("received body", req.body);
  

  if (!name || !phone || !email || !address || !state || !product || !price) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // 1️⃣ Send email to you (admin)
    await transporter.sendMail({
      from: `"Order Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL, // your email
      subject: `New Order from ${name}`,
      html: `
        <h2>New Purchase Details</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Address:</b> ${address}</p>
        <p><b>Delivery State:</b> ${state}</p>
        
        <p><b>Delivery Product:</b> ${product}</p>
        <p><b>Price:</b> ₦${price}</p>
        
      `,
    });

    // 2️⃣ Send confirmation to the user
    await transporter.sendMail({
      from: `"Swifto Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Order Has Been Received!",
      html: `
        <h2>Hi ${name},</h2>
        <p>Thanks for placing your order! Here’s your order summary:</p>
        <ul>
          <li><b>Name:</b> ${name}</li>
          <li><b>Phone:</b> ${phone}</li>
          <li><b>Address:</b> ${address}</li>
          <li><b>Delivery State:</b> ${state}</li>
          
          <li><b>Delivery product:</b> ${product}</li>
          
          <li><b>Delivery price:</b> ₦${price}</li>
        </ul>
        <p>We’ll contact you shortly for delivery confirmation.</p>
        <p><b>Thank you for shopping with us!</b></p>
      `,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Mail error:", error);
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
