import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'tiffinlink_cart';
const PENDING_CHECKOUT_KEY = 'tiffinlink_pending_checkout';

export function CartProvider({ children }) {
  // Load initial cart state from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading cart from localStorage:', e);
    }
    return {
      provider: null,
      items: [],
      deliveryAddress: '',
      deliveryCoordinates: { lat: 23.0300, lng: 72.5178 },
      deliverySlot: 'Lunch Slot (12:00 - 13:30)',
      instructions: '',
      paymentMethod: 'Online Payment'
    };
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [providerConflict, setProviderConflict] = useState(null);

  // Sync cart mutations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Error saving cart to localStorage:', e);
    }
  }, [cart]);

  // Financial Calculations
  const subtotal = (cart.items || []).reduce((sum, item) => sum + (Number(item.itemTotal) || (Number(item.unitPrice) * Number(item.quantity)) || 0), 0);
  const deliveryFee = cart.items && cart.items.length > 0 ? 20 : 0;
  const packagingFee = cart.items && cart.items.length > 0 ? 15 : 0;
  const gstTax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee;
  const totalCount = (cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  // Add Item to Cart
  const addToCart = (provider, item) => {
    if (!provider || !provider._id) return { success: false, error: 'Invalid provider' };

    // Check multiple provider rule: If cart contains items from another provider
    if (cart.provider && cart.provider._id && String(cart.provider._id) !== String(provider._id) && cart.items.length > 0) {
      setProviderConflict({
        currentProvider: cart.provider,
        newProvider: provider,
        pendingItem: item
      });
      return { success: false, conflict: true };
    }

    setCart(prev => {
      const existingItems = [...prev.items];
      // Generate item signature based on meal ID / name, category, and customization
      const itemSig = item.id || `${item.tiffinId || item.tiffinName}_${item.selectedCategory || ''}_${item.selectedShaak || ''}_${item.rotliCount || 4}`;
      const existingIdx = existingItems.findIndex(i => (i.id === itemSig || (i.tiffinName === item.tiffinName && i.selectedShaak === item.selectedShaak && i.rotliCount === item.rotliCount)));

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPrice) || 120;
      const extrasPrice = Array.isArray(item.extras) ? item.extras.reduce((s, x) => s + (Number(x.price) || 0), 0) : 0;
      const singleItemTotal = unitPrice + extrasPrice;

      if (existingIdx > -1) {
        const updatedQty = existingItems[existingIdx].quantity + qty;
        existingItems[existingIdx] = {
          ...existingItems[existingIdx],
          quantity: updatedQty,
          itemTotal: singleItemTotal * updatedQty
        };
      } else {
        existingItems.push({
          ...item,
          id: itemSig,
          providerId: provider._id,
          unitPrice,
          quantity: qty,
          itemTotal: singleItemTotal * qty
        });
      }

      return {
        ...prev,
        provider: {
          _id: provider._id,
          name: provider.name || provider.businessName || 'Artisan Kitchen',
          image: provider.image || '/assets/provider_1.png',
          address: provider.address?.locality ? `${provider.address.locality}, Ahmedabad` : 'Ahmedabad',
          price: provider.price || 120
        },
        items: existingItems
      };
    });

    return { success: true };
  };

  // Resolve Multiple Provider Conflict
  const resolveProviderConflict = (action) => {
    if (!providerConflict) return;

    if (action === 'replace') {
      const { newProvider, pendingItem } = providerConflict;
      const qty = Math.max(1, Number(pendingItem.quantity) || 1);
      const unitPrice = Number(pendingItem.unitPrice) || 120;
      const extrasPrice = Array.isArray(pendingItem.extras) ? pendingItem.extras.reduce((s, x) => s + (Number(x.price) || 0), 0) : 0;
      const singleItemTotal = unitPrice + extrasPrice;
      const itemSig = pendingItem.id || `${pendingItem.tiffinId || pendingItem.tiffinName}_${pendingItem.selectedCategory || ''}_${pendingItem.selectedShaak || ''}_${pendingItem.rotliCount || 4}`;

      setCart({
        provider: {
          _id: newProvider._id,
          name: newProvider.name || newProvider.businessName || 'Artisan Kitchen',
          image: newProvider.image || '/assets/provider_1.png',
          address: newProvider.address?.locality ? `${newProvider.address.locality}, Ahmedabad` : 'Ahmedabad',
          price: newProvider.price || 120
        },
        items: [{
          ...pendingItem,
          id: itemSig,
          providerId: newProvider._id,
          unitPrice,
          quantity: qty,
          itemTotal: singleItemTotal * qty
        }],
        deliveryAddress: cart.deliveryAddress,
        deliveryCoordinates: cart.deliveryCoordinates,
        deliverySlot: cart.deliverySlot,
        instructions: cart.instructions,
        paymentMethod: cart.paymentMethod
      });
      setProviderConflict(null);
    } else {
      // Keep existing cart
      setProviderConflict(null);
    }
  };

  // Update item quantity
  const updateQuantity = (itemId, newQty) => {
    setCart(prev => {
      const updated = prev.items.map(i => {
        if (i.id === itemId) {
          const q = Math.max(0, newQty);
          const extrasPrice = Array.isArray(i.extras) ? i.extras.reduce((s, x) => s + (Number(x.price) || 0), 0) : 0;
          return {
            ...i,
            quantity: q,
            itemTotal: (i.unitPrice + extrasPrice) * q
          };
        }
        return i;
      }).filter(i => i.quantity > 0);

      return {
        ...prev,
        provider: updated.length === 0 ? null : prev.provider,
        items: updated
      };
    });
  };

  // Remove single item from cart
  const removeItem = (itemId) => {
    setCart(prev => {
      const updated = prev.items.filter(i => i.id !== itemId);
      return {
        ...prev,
        provider: updated.length === 0 ? null : prev.provider,
        items: updated
      };
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCart({
      provider: null,
      items: [],
      deliveryAddress: '',
      deliveryCoordinates: { lat: 23.0300, lng: 72.5178 },
      deliverySlot: 'Lunch Slot (12:00 - 13:30)',
      instructions: '',
      paymentMethod: 'Online Payment'
    });
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
  };

  // Pending Checkout State Preservation
  const savePendingCheckout = (checkoutData) => {
    try {
      const dataToSave = {
        cart,
        checkout: checkoutData,
        timestamp: Date.now()
      };
      localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Failed to save pending checkout:', e);
    }
  };

  const getPendingCheckout = () => {
    try {
      const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const clearPendingCheckout = () => {
    try {
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch (e) {}
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        deliveryFee,
        packagingFee,
        gstTax,
        totalAmount,
        totalCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        providerConflict,
        resolveProviderConflict,
        savePendingCheckout,
        getPendingCheckout,
        clearPendingCheckout
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
