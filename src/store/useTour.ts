import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  completed: boolean;
  active: boolean;
  step: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

export const useTour = create<TourState>()(
  persist(
    (set, get) => ({
      completed: false,
      active: false,
      step: 0,
      start: () => set({ active: true, step: 0 }),
      next: () => {
        const { step } = get();
        if (step >= 5) {
          set({ active: false, completed: true, step: 0 });
        } else {
          set({ step: step + 1 });
        }
      },
      prev: () => {
        const { step } = get();
        if (step > 0) set({ step: step - 1 });
      },
      skip: () => set({ active: false, completed: true, step: 0 }),
      complete: () => set({ active: false, completed: true, step: 0 }),
    }),
    { name: "money-tracker-tour-v1" },
  ),
);
