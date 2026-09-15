import { create } from 'zustand';
import {
  AssetsData,
  BenefitType,
  CheckScreenStep,
  DEFAULT_ELIGIBILITY_FORM,
  DemographicsData,
  EconomicData,
  EligibilityFormData,
  EligibilityResultSummary,
} from '../models/check.model';
import { checkApi } from '../repositories/check.api';

const EMPTY_EVALUATION: EligibilityResultSummary = {
  totalEligibleCount: 0,
  totalBenefitEstimate: '₹0',
  eligibleSchemes: [],
  nearlyEligibleSchemes: [],
};

interface CheckState {
  activeStep: CheckScreenStep;
  formData: EligibilityFormData;
  resultsFilter: 'all' | BenefitType;
  selectedSchemeId: string;
  cachedEvaluation: EligibilityResultSummary | null;

  // Actions
  setStep: (step: CheckScreenStep) => void;
  updateDemographics: (data: Partial<DemographicsData>) => void;
  updateEconomic: (data: Partial<EconomicData>) => void;
  updateAssets: (data: Partial<AssetsData>) => void;
  setResultsFilter: (filter: 'all' | BenefitType) => void;
  selectSchemeDetails: (schemeId: string) => void;
  getEvaluation: () => EligibilityResultSummary;
  fetchEvaluation: () => Promise<EligibilityResultSummary>;
  resetQuiz: () => void;
}

export const useCheckStore = create<CheckState>((set, get) => ({
  activeStep: '0_start',
  formData: { ...DEFAULT_ELIGIBILITY_FORM },
  resultsFilter: 'all',
  selectedSchemeId: 'pm-kisan',
  cachedEvaluation: null,

  setStep: (step: CheckScreenStep) => {
    set({ activeStep: step });
  },

  updateDemographics: (data: Partial<DemographicsData>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        demographics: {
          ...state.formData.demographics,
          ...data,
        },
      },
    }));
  },

  updateEconomic: (data: Partial<EconomicData>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        economic: {
          ...state.formData.economic,
          ...data,
        },
      },
    }));
  },

  updateAssets: (data: Partial<AssetsData>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        assets: {
          ...state.formData.assets,
          ...data,
        },
      },
    }));
  },

  setResultsFilter: (filter: 'all' | BenefitType) => {
    set({ resultsFilter: filter });
  },

  selectSchemeDetails: (schemeId: string) => {
    set({ selectedSchemeId: schemeId, activeStep: '8_scheme_details' });
  },

  getEvaluation: () => {
    return get().cachedEvaluation || EMPTY_EVALUATION;
  },

  fetchEvaluation: async () => {
    const result = await checkApi.evaluate(get().formData);
    if (result.ok) {
      set({ cachedEvaluation: result.data });
      return result.data;
    }
    const fallback = get().cachedEvaluation || EMPTY_EVALUATION;
    return fallback;
  },

  resetQuiz: () => {
    set({
      activeStep: '0_start',
      formData: { ...DEFAULT_ELIGIBILITY_FORM },
      resultsFilter: 'all',
      selectedSchemeId: 'pm-kisan',
      cachedEvaluation: null,
    });
  },
}));
