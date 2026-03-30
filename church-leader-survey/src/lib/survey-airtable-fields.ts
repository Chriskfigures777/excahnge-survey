/**
 * Survey Responses column names in Airtable — match the live form (section + short question label).
 * Index aligns with `getQuestionValuesOrdered()` (0–29) and tail slice (0–6).
 */
export const SURVEY_RESPONSE_QUESTION_FIELDS = [
  "S1 — Role within church",
  "S1 — Years in ministry",
  "S1 — Congregation size",
  "S1 — Attended seminary",
  "S1 — Seminary details",
  "S1 — Denomination / affiliation",
  "S2 — Openness to nationwide church network",
  "S2 — Concerns about cross-denom network",
  "S2 — Theological alignment needed in network",
  "S3 — Importance of tiered verification",
  "S3 — Expected verification level for shared needs",
  "S3 — Cross-denomination support stance",
  "S4 — Leadership team challenges (selections)",
  "S4 — Congregation member challenges (selections)",
  "S4 — Challenges technology could help address",
  "S5 — Discipleship intentionality (leadership view)",
  "S5 — Discipleship intentionality (congregation view)",
  "S6 — Value: visibility into congregation resources",
  "S6 — Value: visibility across churches nationwide",
  "S6 — Likelihood leadership would pilot platform",
  "S6 — Likelihood congregation would use platform",
  "S7 — Comfort with small platform fee on donations",
  "S7 — Importance of fee-use transparency",
  "S7 — Perception of hybrid for-profit + foundation model",
  "S7 — Open feedback on financial structure",
  "S8 — Key factor in participation decision",
  "S8 — Additional concerns, ideas, or feedback",
  "S9 — Most valuable platform features (selections)",
  "S9 — Important budgeting-tool features (selections)",
  "S9 — Likelihood to try full-featured platform",
] as const;

/** Answers after the first 30 (pricing, gospel section, pilot, referral). */
export const SURVEY_RESPONSE_TAIL_FIELDS = [
  "S9 — Monthly price willingness",
  "S9 — Payroll add-on price willingness",
  "S10 — Agreement: tool helps live out gospel",
  "S10 — Open: technology supporting mission",
  "S10 — Grand Rapids pilot interest",
  "S10 — Knows someone to refer",
  "S10 — Referral name, church, contact",
] as const;

/** Legacy primary question column (older bases). */
export const SURVEY_RESPONSE_LEGACY_Q1 = "Q1";

/** First column of the current schema — used to detect relational survey table layout. */
export const SURVEY_RESPONSE_NAMED_SCHEMA_MARKER = SURVEY_RESPONSE_QUESTION_FIELDS[0];

export function tableHasSurveyQuestionSchema(table: {
  fields?: { name: string }[];
}): boolean {
  const names = new Set((table.fields ?? []).map((f) => f.name));
  return names.has(SURVEY_RESPONSE_LEGACY_Q1) || names.has(SURVEY_RESPONSE_NAMED_SCHEMA_MARKER);
}
