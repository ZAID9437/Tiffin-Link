const dotenv = require('dotenv');
dotenv.config();

/**
 * Normalize phone numbers into strict E.164 format.
 * Example for India: '9558601570' -> '+919558601570'
 */
const normalizeE164 = (phone, defaultCountryCode = '+91') => {
  if (!phone) return defaultCountryCode + '9558601570';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = defaultCountryCode + cleaned;
    }
  }
  return cleaned;
};

/**
 * Check if real Twilio credentials are configured in environment
 */
const isTwilioConfigured = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  return Boolean(
    sid && !sid.includes('YOUR_TWILIO') &&
    token && !token.includes('YOUR_TWILIO') &&
    serviceSid && !serviceSid.includes('YOUR_TWILIO')
  );
};

/**
 * Send real SMS / WhatsApp OTP using Twilio Verify V2 API
 * POST https://verify.twilio.com/v2/Services/{ServiceSid}/Verifications
 */
const startTwilioVerification = async (phoneNumber, channel = 'sms') => {
  const e164Phone = normalizeE164(phoneNumber);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!isTwilioConfigured()) {
    console.warn(`[TWILIO VERIFY CONFIG] Real Twilio credentials not set in server/.env. Simulated dispatch to ${e164Phone}`);
    return {
      success: true,
      status: 'pending',
      e164Phone,
      channel,
      isSimulated: true,
      message: `📲 OTP sent to ${e164Phone} via ${channel.toUpperCase()} (Simulated mode: Set Twilio keys in server/.env for live network SMS).`
    };
  }

  try {
    const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('To', e164Phone);
    params.append('Channel', channel.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'sms');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Twilio Verify API Error:', data);
      let errorMsg = 'Unable to send OTP. Please try again.';
      if (data.code === 60203) errorMsg = 'Too many attempts. Please try again later.';
      if (data.code === 60200) errorMsg = 'Invalid phone number format.';
      return { success: false, message: errorMsg, twilioError: data };
    }

    return {
      success: true,
      status: data.status,
      sid: data.sid,
      e164Phone,
      channel,
      isSimulated: false,
      message: `📲 Real Twilio Verify OTP sent to ${e164Phone} via ${channel.toUpperCase()}!`
    };
  } catch (error) {
    console.error('Error triggering Twilio Verify API:', error);
    return { success: false, message: 'Unable to send OTP. Please try again.' };
  }
};

/**
 * Check real Twilio Verify OTP code
 * POST https://verify.twilio.com/v2/Services/{ServiceSid}/VerificationCheck
 */
const checkTwilioVerification = async (phoneNumber, code) => {
  const e164Phone = normalizeE164(phoneNumber);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!code || String(code).trim() === '') {
    return { success: false, message: 'Please enter the 4-6 digit OTP code.' };
  }

  if (!isTwilioConfigured()) {
    return {
      success: true,
      status: 'approved',
      e164Phone,
      isSimulated: true,
      message: '✓ OTP verified successfully!'
    };
  }

  try {
    const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('To', e164Phone);
    params.append('Code', String(code).trim());

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Twilio Verification Check Error:', data);
      let errorMsg = 'Invalid OTP. Please try again.';
      if (data.code === 20404) errorMsg = 'OTP expired. Please request a new code.';
      if (data.code === 60202) errorMsg = 'Too many failed verification attempts.';
      return { success: false, message: errorMsg, twilioError: data };
    }

    if (data.status === 'approved') {
      return {
        success: true,
        status: 'approved',
        e164Phone,
        message: '✓ OTP verified successfully via Twilio Verify!'
      };
    } else {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error verifying Twilio code:', error);
    return { success: false, message: 'Unable to verify OTP. Please try again.' };
  }
};

module.exports = {
  normalizeE164,
  isTwilioConfigured,
  startTwilioVerification,
  checkTwilioVerification
};
