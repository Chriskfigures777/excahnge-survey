export type SurveyAnswers = Record<string, string | string[] | undefined>;

export const PLATFORM_MONTHLY_PRICE_OPTIONS = [
  { value: "free_only", label: "$0 — Free tier only" },
  { value: "1_29", label: "$1 – $29/mo" },
  { value: "30_49", label: "$30 – $49/mo" },
  { value: "50_99", label: "$50 – $99/mo" },
  { value: "100_149", label: "$100 – $149/mo" },
  { value: "150_199", label: "$150 – $199/mo" },
  { value: "200_plus", label: "$200+/mo" },
] as const;

export const PAYROLL_ADDON_PRICE_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "50_99", label: "$50 – $99/mo" },
  { value: "100_149", label: "$100 – $149/mo" },
  { value: "150_199", label: "$150 – $199/mo" },
  { value: "200_plus", label: "$200+/mo" },
] as const;

export const GRAND_RAPIDS_PILOT_BLURB =
  "In Grand Rapids, we're blessed to have churches on nearly every street and in every neighborhood. Our goal is to start right here — cultivating closer community among the churches of Grand Rapids.";

export const TOTAL_STEPS = 11;

/** Last assigned question index on the final step (contact through referral fields). */
export const NUMBERED_QUESTION_LAST = 47;
