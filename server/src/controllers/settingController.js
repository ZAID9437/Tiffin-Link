const ProviderSetting = require('../models/ProviderSetting');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get provider settings fetched dynamically for logged-in provider
// @route   GET /api/settings/provider
const getProviderSettings = async (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-provider-email'] || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      // Find user and provider records in MongoDB by email
      const realUser = await User.findOne({ email: userEmail.trim().toLowerCase() });
      let realProvider = await Provider.findOne({ email: userEmail });
      if (!realProvider) {
        realProvider = await Provider.findOne({ email: { $exists: true, $ne: '' } }).sort({ createdAt: -1 }) || await Provider.findOne();
      }

      const pId = realProvider ? realProvider._id.toString() : 'prov_1';
      let settings = await ProviderSetting.findOne({ providerId: pId });

      const defaultDynamicSettings = {
        providerId: pId,
        account: {
          name: realProvider?.fullName || realProvider?.name || realUser?.name || 'Zaid Mansuri',
          email: realProvider?.email || realUser?.email || userEmail,
          phone: realProvider?.mobile || realUser?.phone || '+91 1234567890',
          avatarUrl: realProvider?.image || '/assets/provider_1.png',
          accountStatus: 'Verified Active'
        },
        business: {
          providerName: realProvider?.businessName || realProvider?.name || 'Mansuri Kitchen',
          description: realProvider?.description || 'Authentic home-cooked Gujarati thali, Jain food, and North Indian meals prepared with fresh ingredients and pure ghee.',
          address: [realProvider?.address?.houseNo, realProvider?.address?.street].filter(Boolean).join(', ') || realProvider?.address?.city || '4, Ruhan Duplex In Aman Park, Opp Labbaik Park B/H Canal',
          city: realProvider?.address?.city || realProvider?.address?.locality || 'Ahmedabad',
          serviceArea: realProvider?.address?.locality ? `${realProvider.address.locality} (5km radius)` : 'Ahmedabad (5km radius)',
          openingTime: realProvider?.opens || '10:00',
          closingTime: realProvider?.closes || '12:00',
          businessStatus: 'Open for Orders'
        },
        tiffin: {
          defaultAvailability: true,
          maxDailyLimit: 50,
          vegPreference: 'Pure Veg Only',
          deliveryAvailable: true,
          autoPauseLimit: true
        },
        orders: {
          acceptingOrders: true,
          autoAccept: true,
          prepTimeMinutes: 30,
          minOrderAmount: realProvider?.price || 120,
          cancellationRules: 'Free cancellation up to 30 mins before dispatch'
        },
        notifications: {
          newOrder: true,
          orderCompleted: true,
          orderCancelled: true,
          newReview: true,
          paymentReceived: true,
          systemAlerts: true
        },
        payments: {
          payoutMethod: 'Bank Transfer (IMPS)',
          bankName: realProvider?.bankName || 'abc bank',
          ifscCode: realProvider?.ifscCode || 'HDFC0001234',
          accountNumber: realProvider?.accountNumber || '1234567890',
          upiId: realProvider?.upiId || 'shreejitiffin@okicici',
          autoPayout: true
        },
        security: {
          twoFactorEnabled: false,
          activeSessions: 2,
          lastPasswordChange: '14 Aug 2026'
        },
        preferences: {
          language: 'English (India)',
          currency: 'INR (₹)',
          timeFormat: '12-hour (AM/PM)',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Asia/Kolkata (IST)'
        }
      };

      if (!settings) {
        settings = await ProviderSetting.create(defaultDynamicSettings);
      } else {
        // Sync setting data directly with MongoDB Provider & User records
        settings = settings.toObject ? settings.toObject() : settings;
        if (realProvider || realUser) {
          if (realProvider?.mobile || realUser?.phone) {
            settings.account.phone = realProvider?.mobile || realUser?.phone;
          }
          if (realProvider?.fullName || realProvider?.name || realUser?.name) {
            settings.account.name = realProvider?.fullName || realProvider?.name || realUser?.name;
          }
          if (realProvider?.email || realUser?.email) {
            settings.account.email = realProvider?.email || realUser?.email;
          }
          if (realProvider?.businessName) {
            settings.business.providerName = realProvider.businessName;
          }
          if (realProvider?.opens) settings.business.openingTime = realProvider.opens;
          if (realProvider?.closes) settings.business.closingTime = realProvider.closes;
          if (realProvider?.bankName) settings.payments.bankName = realProvider.bankName;
          if (realProvider?.accountNumber) settings.payments.accountNumber = realProvider.accountNumber;
          if (realProvider?.image) settings.account.avatarUrl = realProvider.image;
        }
      }

      return res.json({
        success: true,
        settings,
        source: 'database'
      });
    } else {
      return res.json({
        success: true,
        settings: defaultDynamicSettings,
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching provider settings:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update provider settings for specific provider document
// @route   PUT /api/settings/provider
const updateProviderSettings = async (req, res) => {
  try {
    const updatedData = req.body;
    const userEmail = updatedData.account?.email || req.query.email || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      let realProvider = await Provider.findOne({ email: userEmail });
      if (!realProvider) {
        realProvider = await Provider.findOne({ email: { $exists: true, $ne: '' } }).sort({ createdAt: -1 }) || await Provider.findOne();
      }

      const pId = realProvider ? realProvider._id.toString() : 'prov_1';

      const settings = await ProviderSetting.findOneAndUpdate(
        { providerId: pId },
        { $set: { ...updatedData, providerId: pId, updatedAt: Date.now() } },
        { new: true, upsert: true }
      );

      // Extract form values safely
      const newBizName = updatedData.business?.providerName;
      const newFullName = updatedData.account?.name;
      const newEmail = updatedData.account?.email || userEmail;
      const newPhone = updatedData.account?.phone;
      const newDesc = updatedData.business?.description;
      const newOpens = updatedData.business?.openingTime;
      const newCloses = updatedData.business?.closingTime;
      const newAddress = updatedData.business?.address;
      const newCity = updatedData.business?.city;
      const newAvatar = updatedData.account?.avatarUrl;
      const newKitchenPhoto = updatedData.business?.kitchenPhoto || newAvatar;
      const newBankName = updatedData.payments?.bankName;
      const newAccNum = updatedData.payments?.accountNumber;
      const newIfsc = updatedData.payments?.ifscCode;
      const newUpi = updatedData.payments?.upiId;

      // Update User collection document for this specific user ONLY
      if (newEmail) {
        const userUpdate = {};
        if (newFullName) userUpdate.name = newFullName;
        if (newPhone) userUpdate.phone = newPhone;
        await User.findOneAndUpdate({ email: newEmail.trim().toLowerCase() }, { $set: userUpdate });
      }

      // Dynamically update ONLY this provider's document in MongoDB
      if (realProvider) {
        const providerUpdate = {};
        if (newBizName) {
          providerUpdate.name = newBizName;
          providerUpdate.businessName = newBizName;
        }
        if (newFullName) providerUpdate.fullName = newFullName;
        if (newEmail) providerUpdate.email = newEmail;
        if (newPhone) providerUpdate.mobile = newPhone;
        if (newDesc) providerUpdate.description = newDesc;
        if (newOpens) providerUpdate.opens = newOpens;
        if (newCloses) providerUpdate.closes = newCloses;
        if (newBankName) providerUpdate.bankName = newBankName;
        if (newAccNum) providerUpdate.accountNumber = newAccNum;
        if (newIfsc) providerUpdate.ifscCode = newIfsc;
        if (newUpi) providerUpdate.upiId = newUpi;
        if (newKitchenPhoto || newAvatar) {
          providerUpdate.image = newKitchenPhoto || newAvatar;
          providerUpdate.kitchenPhotos = newKitchenPhoto || newAvatar;
        }

        if (newAddress || newCity) {
          providerUpdate.address = {
            street: newAddress || realProvider.address?.street || '',
            city: newCity || realProvider.address?.city || '',
            houseNo: '',
            locality: updatedData.business?.serviceArea || realProvider.address?.locality || '',
            pincode: '',
            isLocationPinned: true
          };
        }

        // UPDATE ONLY THIS SINGLE SPECIFIC PROVIDER DOCUMENT
        await Provider.findByIdAndUpdate(realProvider._id, { $set: providerUpdate });
      }

      return res.json({
        success: true,
        message: 'Provider settings updated successfully!',
        settings,
        user: {
          name: newFullName,
          email: newEmail,
          phone: newPhone
        }
      });
    }
    return res.json({
      success: true,
      message: 'Provider settings updated successfully!',
      settings: updatedData
    });
  } catch (error) {
    console.error('Error updating provider settings:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getProviderSettings,
  updateProviderSettings
};

