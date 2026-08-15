const ProviderSetting = require('../models/ProviderSetting');
const Provider = require('../models/Provider');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get provider settings fetched dynamically for logged-in provider
// @route   GET /api/settings/provider
const getProviderSettings = async (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-provider-email'] || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      // Find provider record in MongoDB by email or latest active
      let realProvider = await Provider.findOne({ email: userEmail });
      if (!realProvider) {
        realProvider = await Provider.findOne({ email: { $exists: true, $ne: '' } }).sort({ createdAt: -1 }) || await Provider.findOne();
      }

      const pId = realProvider ? realProvider._id.toString() : 'prov_1';
      let settings = await ProviderSetting.findOne({ providerId: pId });

      const defaultDynamicSettings = {
        providerId: pId,
        account: {
          name: realProvider?.fullName || realProvider?.name || 'Zaid Mansuri',
          email: realProvider?.email || 'provider@tiffinlink.com',
          phone: realProvider?.mobile || '+91 98765 43210',
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
        // Sync setting data with MongoDB Provider record
        settings = settings.toObject ? settings.toObject() : settings;
        if (realProvider) {
          settings.account.name = settings.account.name || realProvider.fullName || realProvider.name;
          settings.account.email = settings.account.email || realProvider.email;
          settings.account.phone = settings.account.phone || realProvider.mobile;
          settings.business.providerName = settings.business.providerName || realProvider.businessName || realProvider.name;
          settings.business.openingTime = settings.business.openingTime || realProvider.opens || '10:00';
          settings.business.closingTime = settings.business.closingTime || realProvider.closes || '12:00';
          settings.payments.bankName = settings.payments.bankName || realProvider.bankName;
          settings.payments.accountNumber = settings.payments.accountNumber || realProvider.accountNumber;
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

      // Dynamically update ONLY this provider's document in MongoDB
      if (realProvider) {
        const newBizName = updatedData.business?.providerName;
        const newFullName = updatedData.account?.name;
        const newEmail = updatedData.account?.email;
        const newPhone = updatedData.account?.phone;
        const newDesc = updatedData.business?.description;
        const newOpens = updatedData.business?.openingTime;
        const newCloses = updatedData.business?.closingTime;
        const newAddress = updatedData.business?.address;
        const newCity = updatedData.business?.city;
        const newAvatar = updatedData.account?.avatarUrl;
        const newKitchenPhoto = updatedData.business?.kitchenPhoto || newAvatar;

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

        if (newAddress && newCity) {
          providerUpdate.address = {
            street: newAddress,
            city: newCity,
            houseNo: '',
            locality: updatedData.business?.serviceArea || '',
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
        settings
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
