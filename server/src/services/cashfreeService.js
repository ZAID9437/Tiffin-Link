const crypto = require('crypto');

/**
 * Cashfree Verification Service (Secure ID & Payouts API)
 * Supports Sandbox and Production environments.
 */

const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID || '';
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET || '';
  const env = (process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase();
  
  const baseUrl = env === 'production'
    ? 'https://api.cashfree.com/verification'
    : 'https://sandbox.cashfree.com/verification';

  return { clientId, clientSecret, env, baseUrl };
};

/**
 * Verifies a Bank Account via Cashfree Penny Drop API
 * @param {Object} params
 * @param {string} params.name - Account holder name
 * @param {string} params.accountNumber - Bank account number
 * @param {string} params.ifsc - Bank IFSC code
 * @param {string} [params.phone] - Driver phone number
 */
const verifyBankAccount = async ({ name, accountNumber, ifsc, phone }) => {
  const config = getCashfreeConfig();

  // If Cashfree credentials are not configured in .env
  if (!config.clientId || !config.clientSecret) {
    console.warn('⚠️ [Cashfree Service] Credentials not configured in CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET');
    return {
      success: false,
      configured: false,
      message: 'Cashfree Bank Verification credentials are not configured in server/.env (CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET).'
    };
  }

  const endpoint = `${config.baseUrl}/bank-account/sync`;
  const payload = {
    name: name || 'Driver',
    phone: phone ? phone.replace(/[^\d]/g, '').slice(-10) : '9558601570',
    bank_account: String(accountNumber).trim(),
    ifsc: String(ifsc).trim().toUpperCase()
  };

  try {
    console.log(`🏦 [Cashfree Penny Drop] Requesting verification for IFSC ${payload.ifsc}, Account ***${payload.bank_account.slice(-4)}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-client-id': config.clientId,
        'x-client-secret': config.clientSecret,
        'x-api-version': '2024-01-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`🏦 [Cashfree Penny Drop] Status: ${response.status}`, JSON.stringify(data));

    if (response.ok && (data.account_status === 'VALID' || data.account_status_code === 'ACCOUNT_IS_VALID')) {
      return {
        success: true,
        configured: true,
        accountStatus: 'VALID',
        accountStatusMessage: data.account_status_code || 'ACCOUNT_IS_VALID',
        nameAtBank: data.name_at_bank || name,
        bankName: data.bank_name || 'Verified Bank',
        branch: data.branch || 'Main Branch',
        city: data.city || '',
        utr: data.utr || data.reference_id || '',
        verificationId: String(data.verification_id || data.reference_id || `CF-${Date.now()}`),
        nameMatchScore: data.name_match_score ? parseFloat(data.name_match_score) : 100,
        rawResponse: data
      };
    } else {
      const errorReason = data.message || data.subCode || data.account_status_code || 'Bank account details could not be verified by Cashfree.';
      return {
        success: false,
        configured: true,
        accountStatus: data.account_status || 'INVALID',
        message: errorReason,
        rawResponse: data
      };
    }
  } catch (error) {
    console.error('❌ [Cashfree Service Error]:', error.message);
    return {
      success: false,
      configured: true,
      message: `Cashfree service error: ${error.message}`
    };
  }
};

/**
 * Verifies a UPI VPA via Cashfree UPI Verification API
 */
const verifyUpiVpa = async ({ vpa, name }) => {
  const config = getCashfreeConfig();

  if (!config.clientId || !config.clientSecret) {
    return {
      success: false,
      configured: false,
      message: 'Cashfree Verification credentials are not configured in server/.env (CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET).'
    };
  }

  const endpoint = `${config.baseUrl}/vpa`;
  const payload = {
    vpa: String(vpa).trim(),
    name: name || 'Driver'
  };

  try {
    console.log(`📱 [Cashfree UPI] Requesting VPA verification for ${payload.vpa}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-client-id': config.clientId,
        'x-client-secret': config.clientSecret,
        'x-api-version': '2024-01-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`📱 [Cashfree UPI] Status: ${response.status}`, JSON.stringify(data));

    if (response.ok && (data.account_status === 'VALID' || data.account_exists === true || data.account_status_code === 'VPA_VALID')) {
      return {
        success: true,
        configured: true,
        accountStatus: 'VALID',
        nameAtBank: data.name_at_bank || name,
        vpa: data.vpa || vpa,
        verificationId: String(data.reference_id || `CF-UPI-${Date.now()}`),
        rawResponse: data
      };
    } else {
      const errorReason = data.message || data.account_status_code || 'UPI VPA could not be verified by Cashfree.';
      return {
        success: false,
        configured: true,
        message: errorReason,
        rawResponse: data
      };
    }
  } catch (error) {
    console.error('❌ [Cashfree Service Error]:', error.message);
    return {
      success: false,
      configured: true,
      message: `Cashfree service error: ${error.message}`
    };
  }
};

module.exports = {
  getCashfreeConfig,
  verifyBankAccount,
  verifyUpiVpa
};
