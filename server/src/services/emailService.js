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

const sendOtpEmail = async (email, otp, user, pass, subjectTitle = 'TiffinLink — Your Email Verification Code', customerName = '') => {
  const emailUser = user || process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = pass ? pass.replace(/\s+/g, '') : (process.env.SMTP_PASS || process.env.EMAIL_PASS || '');
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || `"TiffinLink Concierge" <${emailUser || 'no-reply@tiffinlink.com'}>`;
  const nameDisplay = customerName || (email ? email.split('@')[0] : 'Customer');

  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: subjectTitle,
    html: `
      <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #fbf9f5; color: #1b1c1a; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #d6d0c2;">
        <h2 style="font-family: 'EB Garamond', serif; font-size: 28px; color: #4a4238; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #d6d0c2; padding-bottom: 15px;">TiffinLink</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Hello <strong>${nameDisplay}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your TiffinLink email verification code is:</p>
        <div style="background-color: #f5f3ef; border: 1px dashed #4a4238; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1b1c1a; margin: 25px 0; border-radius: 6px;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #4a4238; line-height: 1.5; margin-bottom: 20px;">
          This code expires in 10 minutes.
        </p>
        <p style="font-size: 13px; color: #665d52; line-height: 1.4; border-top: 1px solid #d6d0c2; padding-top: 15px; margin-top: 25px;">
          If you did not request this verification, please ignore this email.
        </p>
        <p style="font-size: 13px; color: #4a4238; margin-top: 15px; font-weight: 600;">
          Regards,<br/>TiffinLink Team
        </p>
      </div>
    `
  };

  let transporter = null;

  if (smtpHost && smtpPort) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: (emailUser && emailPass) ? { user: emailUser, pass: emailPass } : undefined,
      tls: { rejectUnauthorized: false }
    });
  } else if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false }
    });
  }

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Real-time OTP email delivered to ${email} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService Error] SMTP email delivery failed for ${email}:`, err.message);
      console.log(`[EmailService] Attempting Ethereal test server fallback...`);
    }
  }

  // Fallback to Nodemailer Ethereal test account if direct SMTP credentials fail or are missing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    mailOptions.from = `"TiffinLink Concierge" <${testAccount.user}>`;
    const info = await etherealTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n==================================================`);
    console.log(`[EmailService] OTP email sent to ${email}`);
    console.log(`[EmailService] OTP CODE: [ ${otp} ]`);
    console.log(`[EmailService] View live formatted email: ${previewUrl}`);
    console.log(`==================================================\n`);
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (etherealErr) {
    console.error(`[EmailService Error] Ethereal fallback failed:`, etherealErr.message);
    return { success: false, error: etherealErr.message };
  }
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

// Send Dedicated 4-Digit Kitchen Pickup OTP Email to Provider
const sendKitchenPickupOtpEmail = async ({ email, otp, orderRef, providerName, user, pass }) => {
  const emailUser = user || process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = pass ? pass.replace(/\s+/g, '') : (process.env.SMTP_PASS || process.env.EMAIL_PASS || '');
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpFrom = process.env.SMTP_FROM || `"TiffinLink Logistics" <${emailUser || 'no-reply@tiffinlink.com'}>`;
  const nameDisplay = providerName || 'Kitchen Partner';
  const refDisplay = orderRef || 'TL-ORDER';

  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: `TiffinLink Kitchen Pickup Verification Code: ${otp} (Order ${refDisplay})`,
    html: `
      <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #fbf9f5; color: #1b1c1a; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #d6d0c2;">
        <h2 style="font-family: 'EB Garamond', serif; font-size: 28px; color: #4a4238; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #d6d0c2; padding-bottom: 15px;">TiffinLink</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Hello <strong>${nameDisplay}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 15px; color: #4a4238;">
          Your assigned delivery partner has arrived at your kitchen for pickup of order <strong>${refDisplay}</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your TiffinLink Kitchen Pickup verification code is:
        </p>
        <div style="background-color: #f5f3ef; border: 2px dashed #4a4238; padding: 20px; text-align: center; font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #1b1c1a; margin: 25px 0; border-radius: 6px; font-family: monospace;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #4a4238; line-height: 1.5; margin-bottom: 20px;">
          Please provide this 4-digit code to the delivery partner to verify kitchen handover.
        </p>
        <p style="font-size: 13px; color: #665d52; line-height: 1.4; border-top: 1px solid #d6d0c2; padding-top: 15px; margin-top: 25px;">
          If you did not request this verification, please contact TiffinLink Partner Support.
        </p>
        <p style="font-size: 13px; color: #4a4238; margin-top: 15px; font-weight: 600;">
          Regards,<br/>TiffinLink Dispatch & Logistics
        </p>
      </div>
    `
  };

  let transporter = null;
  if (smtpHost && smtpPort) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: (emailUser && emailPass) ? { user: emailUser, pass: emailPass } : undefined,
      tls: { rejectUnauthorized: false }
    });
  } else if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false }
    });
  }

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Kitchen pickup OTP (${otp}) sent successfully to ${email}`);
      return { success: true };
    } catch (err) {
      console.warn(`[EmailService] Failed to send kitchen pickup OTP to ${email}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[EmailService Mock] Kitchen pickup OTP email to ${email} (Code: ${otp}, Order: ${refDisplay})`);
    return { success: true };
  }
};

module.exports = {
  sendOtpEmail,
  sendKitchenPickupOtpEmail,
  sendDeliveryVerificationSuccessEmail,
  sendDeliveryDocumentRejectionEmail
};

