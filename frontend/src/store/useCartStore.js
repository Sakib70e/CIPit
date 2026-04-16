import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [], // [{ id, itemName, size, price, quantity, imageUrl }]
  
  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += 1;
        return { items: newItems };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },
  
  updateQuantity: (productId, delta) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return { items: newItems };
    });
  },

  setQuantity: (productId, qty) => {
    set((state) => {
      const quantity = Math.max(0, parseInt(qty) || 0);
      const newItems = state.items.map((item) => {
        if (item.id === productId) return { ...item, quantity };
        return item;
      });
      return { items: newItems };
    });
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId)
    }));
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
  
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}));
