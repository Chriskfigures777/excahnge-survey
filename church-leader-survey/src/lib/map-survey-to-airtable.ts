import { RESPONSE_FIELDS, SURVEY_VERSION_DEFAULT } from "@/lib/airtable-schema";
import type { SurveyResponseFieldMode } from "@/lib/airtable-survey-response-field-mode";
import {
  SURVEY_RESPONSE_QUESTION_FIELDS,
  SURVEY_RESPONSE_TAIL_FIELDS,
} from "@/lib/survey-airtable-fields";
import { PAYROLL_ADDON_PRICE_OPTIONS, PLATFORM_MONTHLY_PRICE_OPTIONS } from "@/lib/survey-schema";

type RawAnswers = Record<string, unknown>;

function s(a: RawAnswers, key: string): string {
  const v = a[key];
  return typeof v === "string" ? v : "";
}

function list(a: RawAnswers, key: string): string[] {
  const v = a[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function label(map: Record<string, string>, code: string): string {
  return map[code] ?? code;
}

const ROLE: Record<string, string> = {
  lead_pastor: "Lead Pastor",
  associate_pastor: "Associate Pastor",
  elder: "Elder",
  board_member: "Board Member",
  ministry_leader: "Ministry Leader",
  admin_staff: "Administrative Staff",
  other: "Other",
};

const MINISTRY_YEARS: Record<string, string> = {
  "0_1": "0–1 years",
  "1_2": "1–2 years",
  "2_5": "2–5 years",
  "5_10": "5–10 years",
  "10_plus": "10+ years",
};

const CONG_SIZE: Record<string, string> = {
  under_50: "Under 50",
  "50_150": "50–150",
  "150_500": "150–500",
  "500_1000": "500–1,000",
  "1000_plus": "1,000+",
};

const NETWORK_OPEN: Record<string, string> = {
  very_open: "Very open",
  somewhat_open: "Somewhat open",
  neutral: "Neutral",
  somewhat_hesitant: "Somewhat hesitant",
  not_open: "Not open",
};

const CONCERN: Record<string, string> = {
  theological_alignment: "Theological alignment",
  trust_accountability: "Trust and accountability",
  misuse_funds: "Misuse of funds or resources",
  lack_control: "Lack of control or oversight",
  data_privacy: "Data privacy concerns",
  no_major: "No major concerns",
  other: "Other",
};

const THEO_ALIGN: Record<string, string> = {
  strict: "Strict alignment required",
  moderate: "Moderate alignment required",
  broad: "Broad alignment acceptable",
  minimal: "Minimal alignment needed",
  none: "No alignment necessary",
};

const IMPORTANCE: Record<string, string> = {
  extremely: "Extremely important",
  very: "Very important",
  moderately: "Moderately important",
  slightly: "Slightly important",
  not: "Not important",
};

const VERIF_LEVEL: Record<string, string> = {
  church_leadership: "Verified by church leadership",
  platform_team: "Verified by platform team",
  multiple_members: "Verified by multiple members",
  minimal: "Minimal verification required",
  none: "No verification required",
};

const CROSS_DENOM: Record<string, string> = {
  own_denom_only: "We would only support individuals and needs within our own denomination",
  others_aligned:
    "We would consider supporting individuals from other denominations with proper alignment",
  open_body:
    "We are open to supporting individuals across denominations as part of the broader Body of Christ",
  unsure: "Unsure",
};

const LEAD_CH: Record<string, string> = {
  identify_needs: "Difficulty identifying and meeting needs within the congregation",
  visibility_skills: "Limited visibility into members' skills, resources, or availability to help",
  giving_patterns: "Inconsistent or unpredictable giving patterns",
  admin_burden: "Administrative burden in coordinating care, benevolence, or support",
  collab_churches: "Limited collaboration or resource sharing with other churches across the nation",
};

const MEM_CH: Record<string, string> = {
  awareness_needs:
    "Lack of awareness of needs they could help meet within their church or other churches across the nation",
  limited_serve:
    "Limited opportunities to use their skills, spiritual gifts, or resources to serve others",
  hesitation_help: "Hesitation or discomfort in asking for help or sharing personal needs",
  giving_impact: "Uncertainty about where their giving is going or how it is making an impact",
  disconnected:
    "Feeling disconnected from the broader Body of Christ beyond their local congregation",
};

const TECH_HELP: Record<string, string> = {
  meet_needs: "Identifying and meeting needs more effectively",
  visibility_gifts: "Increasing visibility into members' skills, gifts, and resources",
  giving_transparency: "Improving consistency and transparency in giving",
  reduce_admin: "Reducing administrative burden for leadership",
  connection_churches: "Strengthening connection and collaboration between churches across the nation",
};

const DISC_LEAD: Record<string, string> = {
  extremely:
    "Extremely intentional — discipleship is a central and clearly structured priority",
  very: "Very intentional — discipleship is emphasized but may not be fully structured",
  moderate: "Moderately intentional — discipleship happens, but inconsistently",
  slight: "Slightly intentional — discipleship is present but not a major focus",
  not: "Not intentional — discipleship is not actively pursued in a structured way",
};

const DISC_CONG: Record<string, string> = {
  extremely: "Extremely intentional — clearly experienced and recognized by members",
  very: "Very intentional — generally felt, though not universally",
  moderate: "Moderately intentional — experienced by some, but not consistently",
  slight: "Slightly intentional — rarely experienced by most members",
  not: "Not intentional — not meaningfully experienced by the congregation",
};

const VALUE_SCALE: Record<string, string> = {
  extremely: "Extremely valuable",
  very: "Very valuable",
  moderately: "Moderately valuable",
  slightly: "Slightly valuable",
  not: "Not valuable",
};

const LIKELIHOOD_5: Record<string, string> = {
  very_likely: "Very likely",
  likely: "Likely",
  neutral: "Neutral",
  unlikely: "Unlikely",
  very_unlikely: "Very unlikely",
};

const FEE_COMFORT: Record<string, string> = {
  very_comfortable: "Very comfortable",
  somewhat_comfortable: "Somewhat comfortable",
  neutral: "Neutral",
  somewhat_uncomfortable: "Somewhat uncomfortable",
  very_uncomfortable: "Very uncomfortable",
};

const HYBRID: Record<string, string> = {
  very_positive: "Very positive",
  somewhat_positive: "Somewhat positive",
  neutral: "Neutral",
  somewhat_negative: "Somewhat negative",
  very_negative: "Very negative",
};

const FEATURES: Record<string, string> = {
  donor_giving: "Donor Giving & Tithing Pages",
  banking: "Banking & Financial Management",
  payroll: "Payroll Processing",
  budgeting: "Budgeting Tools",
  website: "Website Builder",
  survey_tools: "Survey & Feedback Tools",
  missionary_splits: "Missionary & Ministry Donation Splits",
  notes_comms: "Notes & Communication Tools",
  social: "Community Social Features",
  events: "Event Management",
};

const BUDGET_FEAT: Record<string, string> = {
  budget_vs_actual: "Compare budgeted spending to actual spending",
  trends: "Trend analysis for spending over time",
  monthly_tabs: "Monthly tabs (month-by-month for full year)",
  categories: "Category-based tracking (missions, facilities, staff, outreach)",
  charts: "Visual reports and charts",
  export: "Export capabilities (PDF, spreadsheet)",
};

const TRY_LIKELY: Record<string, string> = {
  very_likely: "Very likely",
  somewhat_likely: "Somewhat likely",
  neutral: "Neutral",
  unlikely: "Unlikely",
  very_unlikely: "Very unlikely",
};

const GOSPEL: Record<string, string> = {
  strongly_agree: "Strongly agree",
  agree: "Agree",
  neutral: "Neutral",
  disagree: "Disagree",
  strongly_disagree: "Strongly disagree",
};

const PILOT_GR: Record<string, string> = {
  yes_love: "Yes, we'd love to be part of this",
  more_info: "We're interested but would like more information first",
  not_now: "Not at this time",
};

function priceLabel(
  code: string,
  options: readonly { value: string; label: string }[],
): string {
  return options.find((o) => o.value === code)?.label ?? code;
}

function formatConcerns(a: RawAnswers): string {
  const codes = list(a, "networkConcerns");
  const lines = codes.map((c) => {
    const base = label(CONCERN, c);
    if (c === "other" && s(a, "networkConcernsOther").trim()) {
      return `${base}: ${s(a, "networkConcernsOther").trim()}`;
    }
    return base;
  });
  return lines.join("\n");
}

function q1Role(a: RawAnswers): string {
  const r = s(a, "role");
  if (!r) return "";
  if (r === "other") {
    const o = s(a, "roleOther").trim();
    return o ? `Other — ${o}` : "Other";
  }
  return label(ROLE, r);
}

function q3Denomination(a: RawAnswers): string {
  const d = s(a, "denomination");
  if (d === "no_nondenominational") return "No (non-denominational)";
  if (d === "yes") {
    const spec = s(a, "denominationSpecify").trim();
    return spec ? `Yes — ${spec}` : "Yes";
  }
  return d;
}

function q2bSeminary(a: RawAnswers): string {
  const se = s(a, "seminary");
  if (se === "yes") return "Yes";
  if (se === "no") return "No";
  return se;
}

function referralBlock(a: RawAnswers): string {
  const parts = [
    s(a, "referralName").trim() && `Name: ${s(a, "referralName").trim()}`,
    s(a, "referralChurch").trim() && `Church: ${s(a, "referralChurch").trim()}`,
    s(a, "referralContact").trim() && `Contact: ${s(a, "referralContact").trim()}`,
  ].filter(Boolean);
  return parts.join("\n");
}

/** All structured answers in order: first 30 → main response columns; remainder → tail fields (or legacy open-ended block). */
export function getQuestionValuesOrdered(answers: RawAnswers): string[] {
  return [
    q1Role(answers),
    label(MINISTRY_YEARS, s(answers, "ministryYears")),
    label(CONG_SIZE, s(answers, "congregationSize")),
    q2bSeminary(answers),
    s(answers, "seminary") === "yes" ? s(answers, "seminarySpecify").trim() : "",
    q3Denomination(answers),
    label(NETWORK_OPEN, s(answers, "networkOpenness")),
    formatConcerns(answers),
    label(THEO_ALIGN, s(answers, "theologicalAlignmentNeeded")),
    label(IMPORTANCE, s(answers, "tieredVerificationImportance")),
    label(VERIF_LEVEL, s(answers, "verificationExpectation")),
    label(CROSS_DENOM, s(answers, "crossDenomSupport")),
    list(answers, "leadershipChallenges")
      .map((c) => label(LEAD_CH, c))
      .join("\n"),
    list(answers, "memberChallenges")
      .map((c) => label(MEM_CH, c))
      .join("\n"),
    list(answers, "techCanHelp")
      .map((c) => label(TECH_HELP, c))
      .join("\n"),
    label(DISC_LEAD, s(answers, "discipleshipLeadership")),
    label(DISC_CONG, s(answers, "discipleshipCongregation")),
    label(VALUE_SCALE, s(answers, "valueCongregationVisibility")),
    label(VALUE_SCALE, s(answers, "valueNationwideVisibility")),
    label(LIKELIHOOD_5, s(answers, "pilotLikelihood")),
    label(LIKELIHOOD_5, s(answers, "congregationUseLikelihood")),
    label(FEE_COMFORT, s(answers, "platformFeeComfort")),
    label(IMPORTANCE, s(answers, "feeTransparencyImportance")),
    label(HYBRID, s(answers, "hybridModelPerception")),
    s(answers, "financialStructureNotes").trim(),
    s(answers, "participationFactor").trim(),
    s(answers, "additionalFeedback").trim(),
    list(answers, "exchangeFeatures")
      .map((c) => label(FEATURES, c))
      .join("\n"),
    list(answers, "budgetingFeatures")
      .map((c) => label(BUDGET_FEAT, c))
      .join("\n"),
    label(TRY_LIKELY, s(answers, "tryPlatformLikelihood")),
    priceLabel(s(answers, "monthlyPriceWilling"), PLATFORM_MONTHLY_PRICE_OPTIONS),
    priceLabel(s(answers, "payrollAddonPrice"), PAYROLL_ADDON_PRICE_OPTIONS),
    label(GOSPEL, s(answers, "gospelToolAgreement")),
    s(answers, "missionTechSupport").trim(),
    label(PILOT_GR, s(answers, "pilotInterestGR")),
    s(answers, "referralKnowsSomeone") === "yes"
      ? "Yes"
      : s(answers, "referralKnowsSomeone") === "no"
        ? "No"
        : s(answers, "referralKnowsSomeone"),
    s(answers, "referralKnowsSomeone") === "yes" ? referralBlock(answers) : "",
  ];
}

/** Legacy combined open-ended field only (AIRTABLE_USE_LEGACY_Q_FIELD_NAMES=1). */
const LEGACY_OPEN_ENDED_LINE_LABELS = [
  "Monthly price willingness",
  "Payroll add-on price willingness",
  "Gospel: tool helps congregation",
  "Technology supporting mission",
  "Grand Rapids pilot interest",
  "Referral: knows someone",
  "Referral: contact details",
] as const;

export type RelationalSurveyPayload = {
  church: {
    name: string;
    denomination: string;
    region: string;
    sizeCategory: string;
    dateFirstSurveyed: string;
  };
  respondent: {
    email: string;
    firstName: string;
    lastName: string;
    roleCategory: "Leadership";
    leadershipPosition: string;
    yearsAtChurch: string;
  };
  /** Airtable fields for Survey Responses (no link fields). */
  surveyResponseFields: Record<string, string>;
};

/**
 * Normalized payloads for Churches / Respondents / Survey Responses.
 * Field mode: pass from `resolveSurveyResponseFieldMode`, or omit to use AIRTABLE_USE_LEGACY_Q_FIELD_NAMES / default named.
 */
export function buildRelationalSurveyPayload(
  answers: RawAnswers,
  submittedAtIso: string,
  surveyVersion?: string,
  fieldMode?: SurveyResponseFieldMode,
): RelationalSurveyPayload {
  const version = surveyVersion?.trim() || SURVEY_VERSION_DEFAULT;
  const qs = getQuestionValuesOrdered(answers);
  const dateOnly = submittedAtIso.slice(0, 10);

  const churchName = s(answers, "churchName").trim();
  const region = s(answers, "churchCity").trim();

  const surveyResponseFields: Record<string, string> = {
    [RESPONSE_FIELDS.surveyVersion]: version,
    [RESPONSE_FIELDS.submissionDate]: submittedAtIso,
  };

  const mode: SurveyResponseFieldMode =
    fieldMode ??
    (process.env.AIRTABLE_USE_LEGACY_Q_FIELD_NAMES === "1" ? "legacy" : "named");

  if (mode === "legacy") {
    for (let i = 0; i < 30; i++) {
      const v = qs[i]?.trim();
      if (v) surveyResponseFields[`Q${i + 1}`] = v;
    }
    const tail = qs.slice(30);
    const openParts: string[] = [];
    for (let j = 0; j < tail.length; j++) {
      const v = tail[j]?.trim();
      if (v)
        openParts.push(`${LEGACY_OPEN_ENDED_LINE_LABELS[j] ?? "Additional"}: ${v}`);
    }
    if (openParts.length > 0) {
      surveyResponseFields[RESPONSE_FIELDS.openEnded] = openParts.join("\n\n");
    }
  } else {
    for (let i = 0; i < 30; i++) {
      const v = qs[i]?.trim();
      if (v) surveyResponseFields[SURVEY_RESPONSE_QUESTION_FIELDS[i]] = v;
    }
    const tail = qs.slice(30);
    for (let j = 0; j < tail.length; j++) {
      const v = tail[j]?.trim();
      if (v) surveyResponseFields[SURVEY_RESPONSE_TAIL_FIELDS[j]] = v;
    }
  }

  return {
    church: {
      name: churchName,
      denomination: qs[5] ?? q3Denomination(answers),
      region,
      sizeCategory: qs[2] ?? label(CONG_SIZE, s(answers, "congregationSize")),
      dateFirstSurveyed: dateOnly,
    },
    respondent: {
      email: s(answers, "email").trim(),
      firstName: s(answers, "firstName").trim(),
      lastName: s(answers, "lastName").trim(),
      roleCategory: "Leadership",
      leadershipPosition: qs[0] ?? q1Role(answers),
      yearsAtChurch: qs[1] ?? label(MINISTRY_YEARS, s(answers, "ministryYears")),
    },
    surveyResponseFields,
  };
}
