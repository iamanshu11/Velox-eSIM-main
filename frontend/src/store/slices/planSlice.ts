import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Plan {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  operatorName: string;
  packageCode?: string;
  price: number;
  dataAmount?: number;
  dataUnit?: string;
  validity?: number;
  validityUnit?: string;
  features?: string[];
  image?: string;
}

interface PlanState {
  selectedPlan: Plan | null;
  isLoading: boolean;
}

const initialState: PlanState = {
  selectedPlan: null,
  isLoading: false,
};

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    setSelectedPlan: (state, action: PayloadAction<Plan>) => {
      state.selectedPlan = action.payload;
    },
    clearSelectedPlan: (state) => {
      state.selectedPlan = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setSelectedPlan, clearSelectedPlan, setLoading } = planSlice.actions;
export default planSlice.reducer;
