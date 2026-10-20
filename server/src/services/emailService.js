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

// Real-time Contact Inquiry Dispatch: Notifies Concierge Admin and sends instant receipt to customer
const sendContactInquiryEmails = async ({ name, email, phone, subject, message, ticketId }) => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';
  
  if (!emailUser || !emailPass) {
    console.warn('[EmailService] Missing email credentials, skipping contact email delivery');
    return { success: false, reason: 'No email credentials' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false }
  });

  const refCode = ticketId || `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateFormatted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // 1. Notification Email to TiffinLink Team / Concierge
  const adminMailOptions = {
    from: `"TiffinLink Concierge" <${emailUser}>`,
    to: emailUser,
    replyTo: email,
    subject: `📬 [TiffinLink Contact #${refCode}] ${subject || 'New Inquiry'} from ${name}`,
    html: `
      <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #FAF7F2; color: #181512; padding: 40px; border-radius: 8px; max-width: 640px; margin: auto; border: 1px solid #DED9D1;">
        <div style="text-align: center; border-bottom: 2px solid #4B3621; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="font-family: 'EB Garamond', Georgia, serif; font-size: 32px; color: #181512; margin: 0; letter-spacing: -0.5px;">TiffinLink</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #4B3621; margin: 6px 0 0; font-weight: 700;">Customer Concierge Dispatch Desk</p>
        </div>

        <div style="background-color: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #F0ECE4; padding-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8C653E;">TICKET ID</span>
            <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #181512;">#${refCode}</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #665D52; width: 120px; font-weight: 600;">Sender:</td>
              <td style="padding: 6px 0; color: #181512; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #665D52; font-weight: 600;">Email:</td>
              <td style="padding: 6px 0;"><a href="mailto:${email}" style="color: #4B3621; font-weight: 700; text-decoration: underline;">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 6px 0; color: #665D52; font-weight: 600;">Phone:</td>
              <td style="padding: 6px 0; color: #181512; font-weight: 600;">${phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; color: #665D52; font-weight: 600;">Subject:</td>
              <td style="padding: 6px 0; color: #181512; font-weight: 700;">${subject || 'General Inquiry'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #665D52; font-weight: 600;">Timestamp:</td>
              <td style="padding: 6px 0; color: #665D52; font-size: 13px;">${dateFormatted} (IST)</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #DED9D1;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8C653E; display: block; margin-bottom: 8px;">MESSAGE</span>
            <div style="background-color: #FAF7F2; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.7; color: #181512; white-space: pre-wrap; border-left: 3px solid #D4AF37;">${message}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="mailto:${email}?subject=Re:%20[TiffinLink%20%23${refCode}]%20${encodeURIComponent(subject || 'Inquiry')}" style="display: inline-block; background-color: #181512; color: #FAF7F2; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: 700; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Reply to ${name}</a>
        </div>

        <p style="font-size: 11px; color: #8C653E; text-align: center; margin-top: 25px; border-top: 1px solid #E5E0D8; padding-top: 15px;">
          TiffinLink Artisanal Dining &bull; Automated Real-Time Dispatch Concierge &bull; Confidential
        </p>
      </div>
    `
  };

  // 2. Instant Confirmation Receipt to Customer
  const customerMailOptions = {
    from: `"TiffinLink Concierge" <${emailUser}>`,
    to: email,
    subject: `We have received your inquiry #${refCode} — TiffinLink Concierge`,
    html: `
      <div style="font-family: 'Hanken Grotesk', Helvetica, Arial, sans-serif; background-color: #FAF7F2; color: #181512; padding: 40px; border-radius: 8px; max-width: 640px; margin: auto; border: 1px solid #DED9D1;">
        <div style="text-align: center; border-bottom: 2px solid #4B3621; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="font-family: 'EB Garamond', Georgia, serif; font-size: 32px; color: #181512; margin: 0; letter-spacing: -0.5px;">TiffinLink</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #4B3621; margin: 6px 0 0; font-weight: 700;">Artisanal Dining Concierge</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 12px;">Hello <strong>${name}</strong>,</p>
        
        <p style="font-size: 15px; line-height: 1.7; color: #4A4238; margin-bottom: 20px;">
          Thank you for reaching out to TiffinLink. Your inquiry has been routed to our culinary concierge team under Reference <strong>#${refCode}</strong>.
        </p>

        <div style="background-color: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="font-family: 'EB Garamond', serif; font-size: 18px; color: #4B3621; margin: 0 0 12px 0;">Summary of Your Submission</h3>
          <p style="font-size: 13px; color: #665D52; margin: 4px 0;"><strong>Subject:</strong> ${subject || 'Artisanal Culinary Inquiry'}</p>
          <p style="font-size: 13px; color: #665D52; margin: 4px 0;"><strong>Date:</strong> ${dateFormatted} (IST)</p>
          <div style="background-color: #FAF7F2; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.6; color: #181512; margin-top: 12px; border-left: 3px solid #D4AF37;">
            "${message}"
          </div>
        </div>

        <div style="background-color: #F5EFEB; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #E2D7CC;">
          <p style="font-size: 13px; color: #4B3621; margin: 0; font-weight: 600;">
            ⏳ Response Expectation: Our culinary advisors review and reply to every message within 2 to 4 hours during kitchen operating hours (07:00 AM – 10:00 PM IST).
          </p>
        </div>

        <p style="font-size: 14px; color: #4A4238; line-height: 1.6;">
          If this is an urgent matter regarding an active order in transit, you may also track your courier live directly from your TiffinLink dashboard.
        </p>

        <p style="font-size: 14px; color: #181512; margin-top: 25px; font-weight: 600;">
          Warm regards,<br/>
          <span style="color: #4B3621;">The TiffinLink Concierge Team</span>
        </p>

        <p style="font-size: 11px; color: #8C653E; text-align: center; margin-top: 30px; border-top: 1px solid #E5E0D8; padding-top: 15px;">
          &copy; 2026 TiffinLink. Handcrafted meals delivered fresh from ancestral kitchens.
        </p>
      </div>
    `
  };

  try {
    const [adminResult, customerResult] = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);

    const adminOk = adminResult.status === 'fulfilled';
    const customerOk = customerResult.status === 'fulfilled';

    console.log(`[EmailService] Contact inquiry #${refCode} emails: Admin=${adminOk ? 'OK' : 'ERR'}, Customer=${customerOk ? 'OK' : 'ERR'}`);

    return {
      success: adminOk || customerOk,
      adminSent: adminOk,
      customerSent: customerOk,
      ticketId: refCode
    };
  } catch (err) {
    console.error('[EmailService Error] Failed to send contact emails:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendKitchenPickupOtpEmail,
  sendDeliveryVerificationSuccessEmail,
  sendDeliveryDocumentRejectionEmail,
  sendContactInquiryEmails
};

