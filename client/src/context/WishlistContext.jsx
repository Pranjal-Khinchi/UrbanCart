import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlist, setWishlist] = useState({ products: [] });

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ products: [] });
      return;
    }
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data.data);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId) => (wishlist.products || []).some((p) => p._id === productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!user) {
        showToast('Please log in to use your wishlist', 'info');
        return;
      }
      try {
        if (isWishlisted(productId)) {
          const { data } = await api.delete(`/wishlist/${productId}`);
          setWishlist(data.data);
          showToast('Removed from wishlist', 'info');
        } else {
          const { data } = await api.post('/wishlist', { productId });
          setWishlist(data.data);
          showToast('Added to wishlist', 'success');
        }
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      }
    },
    [isWishlisted, showToast, user]
  );

  const moveToCart = useCallback(
    async (productId) => {
      try {
        const { data } = await api.post(`/wishlist/${productId}/move-to-cart`);
        setWishlist(data.data.wishlist);
        showToast('Moved to cart', 'success');
        return data.data.cart;
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        return null;
      }
    },
    [showToast]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, moveToCart, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
