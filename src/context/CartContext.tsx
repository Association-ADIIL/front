import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Product, type SelectedOption } from '../api/products';
import { logger } from '../utils/logger';

interface CartItem {
  product: Product;
  quantity: number;
  variantId?: number; // Legacy: single variant
  selectedOptions?: SelectedOption[]; // New: multi-category options
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, variantId?: number, selectedOptions?: SelectedOption[]) => void;
  removeFromCart: (productId: string, variantId?: number, selectedOptions?: SelectedOption[]) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: number, selectedOptions?: SelectedOption[]) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        logger.error('Failed to parse cart from localStorage', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Helper to check if two selectedOptions arrays are equal
  const areSelectedOptionsEqual = (a?: SelectedOption[], b?: SelectedOption[]): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    // Sort by categoryId to ensure consistent comparison
    const sortedA = [...a].sort((x, y) => x.categoryId - y.categoryId);
    const sortedB = [...b].sort((x, y) => x.categoryId - y.categoryId);
    return sortedA.every((opt, i) =>
      opt.categoryId === sortedB[i].categoryId && opt.optionId === sortedB[i].optionId
    );
  };

  const addToCart = (product: Product, quantity: number, variantId?: number, selectedOptions?: SelectedOption[]) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => {
        if (item.product.id !== product.id) return false;
        // For new format: compare selectedOptions
        if (selectedOptions && selectedOptions.length > 0) {
          return areSelectedOptionsEqual(item.selectedOptions, selectedOptions);
        }
        // For legacy format: compare variantId
        return item.variantId === variantId && !item.selectedOptions?.length;
      });

      if (existingItem) {
        // Update quantity if product with same options already in cart
        return prevItems.map(item => {
          if (item.product.id !== product.id) return item;
          // For new format
          if (selectedOptions && selectedOptions.length > 0) {
            if (areSelectedOptionsEqual(item.selectedOptions, selectedOptions)) {
              return { ...item, quantity: item.quantity + quantity };
            }
          }
          // For legacy format
          else if (item.variantId === variantId && !item.selectedOptions?.length) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        // Add new product to cart
        return [...prevItems, { product, quantity, variantId, selectedOptions }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: number, selectedOptions?: SelectedOption[]) => {
    setItems(prevItems =>
      prevItems.filter(item => {
        if (item.product.id !== productId) return true;
        // For new format: compare selectedOptions
        if (selectedOptions && selectedOptions.length > 0) {
          return !areSelectedOptionsEqual(item.selectedOptions, selectedOptions);
        }
        // For legacy format: compare variantId
        return !(item.variantId === variantId && !item.selectedOptions?.length);
      })
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: number, selectedOptions?: SelectedOption[]) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId, selectedOptions);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.product.id !== productId) return item;
        // For new format: compare selectedOptions
        if (selectedOptions && selectedOptions.length > 0) {
          if (areSelectedOptionsEqual(item.selectedOptions, selectedOptions)) {
            return { ...item, quantity };
          }
        }
        // For legacy format: compare variantId
        else if (item.variantId === variantId && !item.selectedOptions?.length) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      let price = item.product.price;
      // New format: selectedOptions (sum all modifiers)
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        const totalModifier = item.selectedOptions.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0);
        price += totalModifier;
      }
      // Legacy format: single variantId
      else if (item.variantId && item.product.variants) {
        const variant = item.product.variants.find(v => v.id === item.variantId);
        if (variant) {
          price += variant.priceModifier;
        }
      }
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
