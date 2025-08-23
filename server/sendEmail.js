const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8082;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@quickflow.app';

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('SMTP config not found in environment. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/send-contact', async (req, res) => {
  try {
    const { name, email, message, source, plan } = req.body;
    if (!email || !message) return res.status(400).json({ error: 'Missing email or message' });

    const subject = `QuickFlow contact${plan ? ` - ${plan}` : ''}`;
    const text = `${message}\n\n---\nName: ${name || '-'}\nEmail: ${email}\nSource: ${source || '-'}\nPlan: ${plan || '-'}\n`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@quickflow.app',
      to: process.env.SUPPORT_EMAIL || SUPPORT_EMAIL,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true });
  } catch (err) {
    console.error('send-contact error', err);
    return res.status(500).json({ error: err?.message || 'Failed to send' });
  }
});

app.listen(PORT, () => {
  console.log(`sendEmail server listening on ${PORT}`);
});
