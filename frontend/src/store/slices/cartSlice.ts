import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cookieUtils } from '@/lib/cookieUtils';

interface CartItem {
  id: string;
  planId: string;
  planName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  totalPrice: number;
}

const initialState: CartState = {
  items: [],
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    initCart: (state) => {
      const savedCart = cookieUtils.getCartData();
      if (savedCart && Array.isArray(savedCart)) {
        state.items = savedCart;
        state.totalPrice = savedCart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
      }
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find((item) => item.planId === action.payload.planId);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.totalPrice = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      cookieUtils.setCartData(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.planId !== action.payload);
      state.totalPrice = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      cookieUtils.setCartData(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ planId: string; quantity: number }>) => {
      const item = state.items.find((item) => item.planId === action.payload.planId);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter((item) => item.planId !== action.payload.planId);
        }
      }
      state.totalPrice = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      cookieUtils.setCartData(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      cookieUtils.clearCartData();
    },
  },
});

export const { initCart, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
