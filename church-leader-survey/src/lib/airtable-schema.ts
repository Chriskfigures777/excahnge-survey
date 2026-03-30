/** Table names — match Airtable base (created by `npm run airtable:setup`). */
export const TABLES = {
  waves: "Survey Waves",
  churches: "Churches",
  respondents: "Respondents",
  /** Default name; override with AIRTABLE_SURVEY_RESPONSES_TABLE if setup created a relational table alongside a legacy one. */
  surveyResponses: "Survey Responses",
} as const;

/** Resolved at runtime so .env overrides apply without rebuilding. */
export function surveyResponsesTable(): string {
  return process.env.AIRTABLE_SURVEY_RESPONSES_TABLE || TABLES.surveyResponses;
}

/** Field names on each table (API names = these strings). */
export const CHURCH_FIELDS = {
  name: "Church Name",
  denomination: "Denomination",
  region: "Region",
  sizeCategory: "Size Category",
  dateFirstSurveyed: "Date First Surveyed",
} as const;

export const RESPONDENT_FIELDS = {
  email: "Email",
  firstName: "First Name",
  lastName: "Last Name",
  church: "Church",
  roleCategory: "Role (Leadership/Congregation)",
  leadershipPosition: "Leadership Position",
  ageRange: "Age Range",
  yearsAtChurch: "Years at Church",
  surveyWave: "Survey Wave",
} as const;

export const RESPONSE_FIELDS = {
  responseId: "Response ID",
  /** Human-readable label on each response row (helps Airtable grid + dashboards). */
  respondentName: "Respondent Name",
  respondent: "Respondent",
  surveyVersion: "Survey Version",
  submissionDate: "Submission Date",
  openEnded: "Open-Ended Response Fields",
  aiThemeTags: "AI Theme Tags",
  aiSummary: "AI Summary",
  sentimentScore: "Sentiment Score",
  engagementRiskScore: "Engagement Risk Score",
} as const;

export const SURVEY_VERSION_DEFAULT = "2026.1";
