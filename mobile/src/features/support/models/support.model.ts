import { z } from 'zod';

export const FaqCategorySchema = z.enum(['all', 'account', 'schemes', 'documents']);
export type FaqCategory = z.infer<typeof FaqCategorySchema>;

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: FaqCategorySchema,
});
export type FaqItem = z.infer<typeof FaqItemSchema>;

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-eligibility',
    question: 'How do I check my eligibility for a scheme?',
    answer:
      'You can check your eligibility in two ways:\n1. Go to the Check tab and fill in your details.\n2. Or ask our AI Advisor in chat about your situation.\n\nThe app will show schemes you may be eligible for, along with next steps.',
    category: 'schemes',
  },
  {
    id: 'faq-upload',
    question: 'How do I upload documents in the Vault?',
    answer:
      'Open the Vault tab from bottom navigation, tap on any document slot (Aadhaar, Land Record, etc.), and either take a photo or select an existing document from your phone storage.',
    category: 'documents',
  },
  {
    id: 'faq-hindi',
    question: 'Can I use the app in Hindi?',
    answer:
      'Yes! You can change your language anytime from Settings > Language, or directly on the onboarding splash screen. The app supports full Hindi and English.',
    category: 'account',
  },
  {
    id: 'faq-free',
    question: 'Is the app free to use?',
    answer:
      'Yes, Scheme App is 100% free for all Indian citizens to discover welfare schemes and check their eligibility.',
    category: 'account',
  },
  {
    id: 'faq-apply',
    question: 'How do I apply for a scheme?',
    answer:
      'Once you check your eligibility, tap "Apply Online" on the scheme page to be redirected to the official government portal, or use our step-by-step guidance in chat.',
    category: 'schemes',
  },
  {
    id: 'faq-missing-docs',
    question: "What if I don't have all documents yet?",
    answer:
      'You can still check your eligibility! Our AI Advisor will highlight alternative documentation or tell you where to acquire missing certificates locally.',
    category: 'documents',
  },
  {
    id: 'faq-update-profile',
    question: 'How do I update my profile information?',
    answer:
      'Tap your profile avatar in the top right corner, select "View Profile", then tap the edit icon or "Personal Information" to update your details.',
    category: 'account',
  },
];
