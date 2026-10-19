const nodemailer = require('nodemailer');
require('dotenv').config();

const projectLink = process.env.PROJECT_URL || process.env.CLIENT_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const buildProjectFooter = () => `
  <p style="margin-top: 24px;">
    <strong>Project Link:</strong>
    <a href="${projectLink}" style="color: #0891b2;">${projectLink}</a>
  </p>
  <p style="color: #666; font-size: 12px; margin-top: 8px;">This is an automated message from EventSync.</p>
`;

const sendMail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html ? `${html}${buildProjectFooter()}` : undefined,
  });
  return info;
};

module.exports = { sendMail, projectLink, buildProjectFooter };
