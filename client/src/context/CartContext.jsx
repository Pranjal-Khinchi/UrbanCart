import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [] });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (err) {
      // silent — cart just stays empty if it fails to load
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        const { data } = await api.post('/cart', { productId, quantity });
        setCart(data.data);
        showToast('Added to cart', 'success');
        return { success: true };
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        return { success: false, message: getErrorMessage(err) };
      }
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      try {
        const { data } = await api.put(`/cart/${itemId}`, { quantity });
        setCart(data.data);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      }
    },
    [showToast]
  );

  const removeItem = useCallback(
    async (itemId) => {
      try {
        const { data } = await api.delete(`/cart/${itemId}`);
        setCart(data.data);
        showToast('Removed from cart', 'info');
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      }
    },
    [showToast]
  );

  const itemCount = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addToCart, updateQuantity, removeItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
