const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Send OTP email for withdrawal verification
 */
const sendWithdrawOTP = async (toEmail, otp, amount) => {
  await transporter.sendMail({
    from: `"CryptoTrade Security" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Withdrawal Verification OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#0b0619;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#014670,#0075bb);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Withdrawal Verification</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">CryptoTrade Security</p>
        </div>
        <div style="padding:32px 24px;background:#1d113d;">
          <p style="color:#ccc;font-size:14px;margin:0 0 8px;">You requested a withdrawal of:</p>
          <p style="color:#fcd535;font-size:24px;font-weight:bold;margin:0 0 24px;">$${amount} USDT</p>
          <p style="color:#ccc;font-size:14px;margin:0 0 12px;">Your verification code is:</p>
          <div style="background:#0b0619;border:2px solid #0075bb;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px;">${otp}</span>
          </div>
          <p style="color:#888;font-size:12px;margin:0;">This code expires in <strong style="color:#fff;">10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#888;font-size:12px;margin:8px 0 0;">If you did not request this withdrawal, please contact support immediately.</p>
        </div>
        <div style="padding:16px 24px;background:#0b0619;text-align:center;">
          <p style="color:#555;font-size:11px;margin:0;">© CryptoTrade · Security Team</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send OTP email for registration verification
 */
const sendRegisterOTP = async (toEmail, otp, username) => {
  await transporter.sendMail({
    from: `"CryptoTrade Security" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Verify Your Email — CryptoTrade',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#0b0619;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0d7a3e,#0075bb);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Email Verification</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">CryptoTrade Registration</p>
        </div>
        <div style="padding:32px 24px;background:#1d113d;">
          <p style="color:#ccc;font-size:14px;margin:0 0 8px;">Hello <strong style="color:#fff;">${username}</strong>,</p>
          <p style="color:#ccc;font-size:14px;margin:0 0 24px;">Use this code to verify your email and complete registration:</p>
          <div style="background:#0b0619;border:2px solid #4caf50;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="color:#4caf50;font-size:36px;font-weight:bold;letter-spacing:10px;">${otp}</span>
          </div>
          <p style="color:#888;font-size:12px;margin:0;">This code expires in <strong style="color:#fff;">10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <div style="padding:16px 24px;background:#0b0619;text-align:center;">
          <p style="color:#555;font-size:11px;margin:0;">© CryptoTrade · Security Team</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send OTP email for password reset
 */
const sendPasswordResetOTP = async (toEmail, otp, username) => {
  await transporter.sendMail({
    from: `"CryptoTrade Security" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#0b0619;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6a1fc2,#0075bb);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Password Reset</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">CryptoTrade Security</p>
        </div>
        <div style="padding:32px 24px;background:#1d113d;">
          <p style="color:#ccc;font-size:14px;margin:0 0 8px;">Hello <strong style="color:#fff;">${username}</strong>,</p>
          <p style="color:#ccc;font-size:14px;margin:0 0 24px;">Use the code below to reset your password:</p>
          <div style="background:#0b0619;border:2px solid #fcd535;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="color:#fcd535;font-size:36px;font-weight:bold;letter-spacing:10px;">${otp}</span>
          </div>
          <p style="color:#888;font-size:12px;margin:0;">This code expires in <strong style="color:#fff;">10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#888;font-size:12px;margin:8px 0 0;">If you did not request a password reset, please ignore this email.</p>
        </div>
        <div style="padding:16px 24px;background:#0b0619;text-align:center;">
          <p style="color:#555;font-size:11px;margin:0;">© CryptoTrade · Security Team</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendWithdrawOTP, sendRegisterOTP, sendPasswordResetOTP };
