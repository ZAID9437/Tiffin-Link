const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp, user, pass) => {
  const cleanPass = pass ? pass.replace(/\s+/g, '') : '';
  const dynamicTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: cleanPass },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"TiffinLink Concierge" <${user}>`,
    to: email,
    subject: 'Your TiffinLink Security Verification Code',
    html: `
      <div style="font-family: 'Hanken Grotesk', sans-serif; background-color: #fbf9f5; color: #1b1c1a; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #d6d0c2;">
        <h2 style="font-family: 'EB Garamond', serif; font-size: 28px; color: #4a4238; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #d6d0c2; padding-bottom: 15px;">TiffinLink</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Welcome to TiffinLink.</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Use the following secure one-time passcode to authenticate your access request:</p>
        <div style="background-color: #f5f3ef; border: 1px dashed #4a4238; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1b1c1a; margin: 30px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #665d52; line-height: 1.4; border-top: 1px solid #d6d0c2; padding-top: 15px; margin-top: 30px;">
          This verification key will expire in 5 minutes. If you did not make this request, you can safely ignore this email.
        </p>
      </div>
    `
  };
  return dynamicTransporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail
};
