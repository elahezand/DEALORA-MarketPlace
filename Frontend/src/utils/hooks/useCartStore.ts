import { create } from 'zustand';

export const useCartUiStore = create((set) => ({
  isOpen: false,
  setIsOpen: (open: boolean) => set({ isOpen: open }),
}));