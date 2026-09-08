const nodemailer = require('nodemailer');

const createTransporter = (user, pass) => {
  const emailUser = user || process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = pass ? pass.replace(/\s+/g, '') : (process.env.EMAIL_PASS || process.env.SMTP_PASS);

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false }
  });
};

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

// Send Verification Success Email to Delivery Partner
const sendDeliveryVerificationSuccessEmail = async ({ email, fullName, applicationId, user, pass }) => {
  try {
    const transporter = createTransporter(user, pass);
    const sender = user || process.env.EMAIL_USER || 'no-reply@tiffinlink.com';

    const mailOptions = {
      from: `"TiffinLink Delivery Operations" <${sender}>`,
      to: email,
      subject: `🎉 Application Approved & Verified - Ref: ${applicationId}`,
      html: `
        <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #F9F8F6; color: #1A1A1A; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #DED9D1;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EBE7DF;">
            <h1 style="font-family: 'EB Garamond', Georgia, serif; font-size: 32px; color: #1A1A1A; margin: 0; letter-spacing: 1px;">TIFFINLINK</h1>
            <p style="font-size: 12px; letter-spacing: 2px; color: #8C7A6B; text-transform: uppercase; margin-top: 5px;">Delivery Partner Portal</p>
          </div>
          
          <div style="padding: 30px 10px;">
            <div style="background-color: #E8F5E9; border-left: 4px solid #2E7D32; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;">
              <h3 style="margin: 0; color: #1B5E20; font-size: 18px;">✅ Document Verification Successful!</h3>
              <p style="margin: 5px 0 0 0; color: #2E7D32; font-size: 14px;">All submitted documents have been received and verified.</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>${fullName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
              We are pleased to inform you that your delivery partner application (Application ID: <strong>${applicationId}</strong>) and all submitted identity and vehicle documents have been officially <strong>verified and approved</strong>!
            </p>

            <div style="background-color: #FFFFFF; border: 1px solid #DED9D1; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #1A1A1A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verified Document Details:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #444444; font-size: 14px; line-height: 1.8;">
                <li>Government ID & Address Proof: <strong>VERIFIED</strong></li>
                <li>Driving License & Vehicle Registration: <strong>VERIFIED</strong></li>
                <li>Bank & Payout Account: <strong>VERIFIED</strong></li>
              </ul>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
              Your delivery account status is now set to <strong>ACTIVE</strong>. You can now log into your driver dashboard to accept orders and start earning.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="http://localhost:5173/#delivery" style="background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Delivery Dashboard &rarr;</a>
            </div>
          </div>

          <div style="border-top: 1px solid #EBE7DF; padding-top: 20px; font-size: 12px; color: #888888; text-align: center;">
            <p style="margin: 0;">If you have any questions, reach out to TiffinLink Support.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} TiffinLink Logistics. All rights reserved.</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Success email sent to ${email}`);
    } else {
      console.log(`[EmailService Mock] Success email prepared for ${email} (Ref: ${applicationId})`);
    }
    return { success: true };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send verification success email to ${email}:`, err);
    return { success: false, error: err.message };
  }
};

// Send Document Rejection & Re-upload Request Email to Delivery Partner
const sendDeliveryDocumentRejectionEmail = async ({ email, fullName, applicationId, rejectedDocuments = [], rejectionReason = '', user, pass }) => {
  try {
    const transporter = createTransporter(user, pass);
    const sender = user || process.env.EMAIL_USER || 'no-reply@tiffinlink.com';

    const rejectedDocsList = Array.isArray(rejectedDocuments) && rejectedDocuments.length > 0
      ? rejectedDocuments.map(doc => `<li style="margin-bottom: 8px; color: #C62828;"><strong>${doc}</strong></li>`).join('')
      : `<li style="color: #C62828;"><strong>Identity / Driving Documents</strong></li>`;

    const mailOptions = {
      from: `"TiffinLink Delivery Operations" <${sender}>`,
      to: email,
      subject: `⚠️ Action Required: Re-upload Documents - Application ${applicationId}`,
      html: `
        <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #F9F8F6; color: #1A1A1A; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #DED9D1;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EBE7DF;">
            <h1 style="font-family: 'EB Garamond', Georgia, serif; font-size: 32px; color: #1A1A1A; margin: 0; letter-spacing: 1px;">TIFFINLINK</h1>
            <p style="font-size: 12px; letter-spacing: 2px; color: #8C7A6B; text-transform: uppercase; margin-top: 5px;">Delivery Partner Portal</p>
          </div>
          
          <div style="padding: 30px 10px;">
            <div style="background-color: #FFEBEE; border-left: 4px solid #C62828; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;">
              <h3 style="margin: 0; color: #B71C1C; font-size: 18px;">⚠️ Document Action Required</h3>
              <p style="margin: 5px 0 0 0; color: #C62828; font-size: 14px;">One or more documents require re-upload before approval.</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #333333;">Dear <strong>${fullName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
              During our verification check for Application <strong>${applicationId}</strong>, our team found that certain documents were unreadable, expired, or incomplete and could not be verified.
            </p>

            <div style="background-color: #FFFFFF; border: 1px solid #FFCDD2; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #B71C1C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Documents Requiring Re-upload:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                ${rejectedDocsList}
              </ul>
              ${rejectionReason ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px stroke #FFCDD2;">
                  <strong style="font-size: 13px; color: #1A1A1A;">Reason / Instructions:</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #555555;">${rejectionReason}</p>
                </div>
              ` : ''}
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
              Please log in to your registration portal and re-upload clear, valid copies of the specified documents so we can finalize your verification quickly.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="http://localhost:5173/#delivery" style="background-color: #C62828; color: #FFFFFF; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Re-upload Documents Now &rarr;</a>
            </div>
          </div>

          <div style="border-top: 1px solid #EBE7DF; padding-top: 20px; font-size: 12px; color: #888888; text-align: center;">
            <p style="margin: 0;">Need help? Reply to this email or contact support.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} TiffinLink Logistics. All rights reserved.</p>
          </div>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Rejection email sent to ${email}`);
    } else {
      console.log(`[EmailService Mock] Rejection email prepared for ${email} (Ref: ${applicationId})`);
    }
    return { success: true };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send rejection email to ${email}:`, err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendDeliveryVerificationSuccessEmail,
  sendDeliveryDocumentRejectionEmail
};

