const TiffinItem = require('../models/TiffinItem');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tiffin-items?tiffinId=xxx
// Returns all items for a specific tiffin (provider-owned or public)
// ─────────────────────────────────────────────────────────────────────────────
const getItemsByTiffin = async (req, res) => {
  try {
    await ensureConnected();
    const { tiffinId } = req.query;
    let query = {};
    if (tiffinId) {
      query.tiffinId = tiffinId;
    } else if (req.providerId) {
      query.providerId = req.providerId;
    }

    const items = await TiffinItem.find(query)
      .sort({ category: 1, sortOrder: 1, createdAt: 1 })
      .lean();

    return res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    console.error('getItemsByTiffin error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tiffin-items
// Create a new item for a tiffin (provider only)
// ─────────────────────────────────────────────────────────────────────────────
const createTiffinItem = async (req, res) => {
  try {
    await ensureConnected();
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const {
      tiffinId,
      category,
      name,
      description,
      image,
      unit,
      defaultQuantity,
      minQuantity,
      maxQuantity,
      unitPrice,
      price,
      availableQuantity,
      isDefault,
      isAvailable,
      isCustomizable,
      sortOrder
    } = req.body;

    if (!tiffinId || !name || !category) {
      return res.status(400).json({ success: false, message: 'tiffinId, name, and category are required' });
    }

    // Verify tiffin belongs to this provider
    const tiffin = await Tiffin.findOne({ _id: tiffinId, providerId });
    if (!tiffin) {
      return res.status(403).json({ success: false, message: 'Tiffin not found or not authorized' });
    }

    const effectivePrice = Number(price !== undefined ? price : unitPrice) || 0;
    const effectiveQty = Number(availableQuantity !== undefined ? availableQuantity : (defaultQuantity || 50));

    const item = new TiffinItem({
      tiffinId,
      providerId,
      category,
      name: name.trim(),
      description: description || '',
      image: image || '',
      unit: unit || 'piece',
      defaultQuantity: Number(defaultQuantity) || 1,
      minQuantity: Number(minQuantity) || 0,
      maxQuantity: Number(maxQuantity) || 10,
      unitPrice: effectivePrice,
      price: effectivePrice,
      availableQuantity: effectiveQty,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : true,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isCustomizable: isCustomizable !== undefined ? Boolean(isCustomizable) : true,
      sortOrder: Number(sortOrder) || 0
    });

    await item.save();
    return res.status(201).json({ success: true, data: item, message: 'Item added successfully' });
  } catch (err) {
    console.error('createTiffinItem error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tiffin-items/:id
// Update an item (provider only)
// ─────────────────────────────────────────────────────────────────────────────
const updateTiffinItem = async (req, res) => {
  try {
    await ensureConnected();
    const providerId = req.providerId;
    const { id } = req.params;

    const item = await TiffinItem.findOne({ _id: id, providerId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found or not authorized' });
    }

    const allowedFields = [
      'category', 'name', 'description', 'image', 'unit',
      'defaultQuantity', 'minQuantity', 'maxQuantity', 'unitPrice',
      'price', 'availableQuantity',
      'isDefault', 'isAvailable', 'isCustomizable', 'sortOrder'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['defaultQuantity', 'minQuantity', 'maxQuantity', 'unitPrice', 'price', 'availableQuantity', 'sortOrder'].includes(field)) {
          item[field] = Number(req.body[field]);
          if (field === 'price' && req.body.unitPrice === undefined) {
            item.unitPrice = Number(req.body[field]);
          } else if (field === 'unitPrice' && req.body.price === undefined) {
            item.price = Number(req.body[field]);
          }
        } else if (['isDefault', 'isAvailable', 'isCustomizable'].includes(field)) {
          item[field] = Boolean(req.body[field]);
        } else {
          item[field] = req.body[field];
        }
      }
    });

    item.updatedAt = Date.now();
    await item.save();

    return res.json({ success: true, data: item, message: 'Item updated successfully' });
  } catch (err) {
    console.error('updateTiffinItem error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tiffin-items/:id
// Soft-delete (mark unavailable) or hard-delete if no orders reference it
// ─────────────────────────────────────────────────────────────────────────────
const deleteTiffinItem = async (req, res) => {
  try {
    await ensureConnected();
    const providerId = req.providerId;
    const { id } = req.params;

    const item = await TiffinItem.findOne({ _id: id, providerId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found or not authorized' });
    }

    // Soft delete by marking unavailable (safe for order history)
    item.isAvailable = false;
    item.updatedAt = Date.now();
    await item.save();

    return res.json({ success: true, message: 'Item deactivated successfully' });
  } catch (err) {
    console.error('deleteTiffinItem error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tiffin-items/bulk
// Bulk save all items for a tiffin (used by Meal Builder save)
// ─────────────────────────────────────────────────────────────────────────────
const bulkSaveTiffinItems = async (req, res) => {
  try {
    await ensureConnected();
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { tiffinId, items } = req.body;
    if (!tiffinId || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'tiffinId and items[] are required' });
    }

    // Verify tiffin belongs to this provider
    const tiffin = await Tiffin.findOne({ _id: tiffinId, providerId });
    if (!tiffin) {
      return res.status(403).json({ success: false, message: 'Tiffin not found or not authorized' });
    }

    // Remove old items and insert fresh set
    await TiffinItem.deleteMany({ tiffinId, providerId });

    const itemDocs = items.map((item, idx) => ({
      tiffinId,
      providerId,
      category: item.category || 'Other',
      name: (item.name || '').trim(),
      description: item.description || '',
      image: item.image || '',
      unit: item.unit || 'piece',
      defaultQuantity: Number(item.defaultQuantity) || 1,
      minQuantity: Number(item.minQuantity) || 0,
      maxQuantity: Number(item.maxQuantity) || 10,
      unitPrice: Number(item.unitPrice) || 0,
      isDefault: item.isDefault !== undefined ? Boolean(item.isDefault) : true,
      isAvailable: item.isAvailable !== undefined ? Boolean(item.isAvailable) : true,
      isCustomizable: item.isCustomizable !== undefined ? Boolean(item.isCustomizable) : true,
      sortOrder: idx
    }));

    const savedItems = await TiffinItem.insertMany(itemDocs);

    // Also update tiffin's base price (sum of default items)
    const defaultItems = itemDocs.filter(i => i.isDefault);
    const calculatedPrice = defaultItems.reduce((sum, i) => sum + (i.unitPrice * i.defaultQuantity), 0);
    if (calculatedPrice > 0) {
      await Tiffin.findByIdAndUpdate(tiffinId, { price: calculatedPrice });
    }

    return res.json({
      success: true,
      data: savedItems,
      count: savedItems.length,
      message: `${savedItems.length} items saved for tiffin`
    });
  } catch (err) {
    console.error('bulkSaveTiffinItems error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getItemsByTiffin,
  createTiffinItem,
  updateTiffinItem,
  deleteTiffinItem,
  bulkSaveTiffinItems
};
