import { create } from 'zustand';

interface HotelState {
  tasaBcv: number;
  setTasaBcv: (tasa: number) => void;
}

export const useHotelStore = create<HotelState>((set) => ({
  tasaBcv: 36.50,
  setTasaBcv: (tasaBcv) => set({ tasaBcv }),
}));
