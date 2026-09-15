import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_ELIGIBILITY_FORM,
  EligibilityFormData,
  EligibilityFormDataSchema,
} from '../models/check.model';
import { useCheckStore } from '../store/check.store';

describe('Check Eligibility Flow - Integration & Logic Tests', () => {
  beforeEach(() => {
    useCheckStore.getState().resetQuiz();
  });

  describe('Zod Schema Validation', () => {
    it('validates a valid EligibilityFormData', () => {
      const parseResult = EligibilityFormDataSchema.safeParse(DEFAULT_ELIGIBILITY_FORM);
      assert.strictEqual(parseResult.success, true);
    });

    it('rejects invalid dob or empty fields when required', () => {
      const invalid = {
        ...DEFAULT_ELIGIBILITY_FORM,
        demographics: {
          ...DEFAULT_ELIGIBILITY_FORM.demographics,
          dob: '',
        },
      };
      const parseResult = EligibilityFormDataSchema.safeParse(invalid);
      assert.strictEqual(parseResult.success, false);
    });
  });

  describe('Zustand State Store (useCheckStore)', () => {
    it('initializes on start step with default form', () => {
      const state = useCheckStore.getState();
      assert.strictEqual(state.activeStep, '0_start');
      assert.strictEqual(state.formData.demographics.district, 'Pune');
    });

    it('updates steps correctly', () => {
      const { setStep } = useCheckStore.getState();
      setStep('1_demographics');
      assert.strictEqual(useCheckStore.getState().activeStep, '1_demographics');

      setStep('4_review');
      assert.strictEqual(useCheckStore.getState().activeStep, '4_review');
    });

    it('updates demographic, economic, and asset fields reactively', () => {
      const { updateDemographics, updateEconomic, updateAssets } = useCheckStore.getState();

      updateDemographics({ district: 'Nagpur', gender: 'female' });
      assert.strictEqual(useCheckStore.getState().formData.demographics.district, 'Nagpur');
      assert.strictEqual(useCheckStore.getState().formData.demographics.gender, 'female');

      updateEconomic({ annualIncome: 250000, category: 'sc' });
      assert.strictEqual(useCheckStore.getState().formData.economic.annualIncome, 250000);
      assert.strictEqual(useCheckStore.getState().formData.economic.category, 'sc');

      updateAssets({ ownsLand: false, isRural: false });
      assert.strictEqual(useCheckStore.getState().formData.assets.ownsLand, false);
      assert.strictEqual(useCheckStore.getState().formData.assets.isRural, false);
    });

    it('filters results by benefit type', () => {
      const { setResultsFilter } = useCheckStore.getState();
      setResultsFilter('subsidy');
      assert.strictEqual(useCheckStore.getState().resultsFilter, 'subsidy');

      setResultsFilter('loan');
      assert.strictEqual(useCheckStore.getState().resultsFilter, 'loan');
    });

    it('navigates to scheme details when selectSchemeDetails is called', () => {
      const { selectSchemeDetails } = useCheckStore.getState();
      selectSchemeDetails('pm-kisan');

      assert.strictEqual(useCheckStore.getState().selectedSchemeId, 'pm-kisan');
      assert.strictEqual(useCheckStore.getState().activeStep, '8_scheme_details');
    });

    it('resets quiz back to step 0 with default values', () => {
      const { updateDemographics, setStep, resetQuiz } = useCheckStore.getState();

      setStep('6_results_summary');
      updateDemographics({ district: 'Nashik' });

      resetQuiz();

      assert.strictEqual(useCheckStore.getState().activeStep, '0_start');
      assert.strictEqual(useCheckStore.getState().formData.demographics.district, 'Pune');
      assert.strictEqual(useCheckStore.getState().cachedEvaluation, null);
    });

    it('returns empty evaluation safely before fetch', () => {
      const evaluation = useCheckStore.getState().getEvaluation();
      assert.strictEqual(evaluation.totalEligibleCount, 0);
      assert.strictEqual(evaluation.eligibleSchemes.length, 0);
    });
  });
});
