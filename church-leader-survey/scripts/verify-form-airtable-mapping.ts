/**
 * End-to-end mapping check: same answer shape as the web form → buildRelationalSurveyPayload
 * → syncSurveyToAirtable → GET record and assert survey columns match the payload (named fields or legacy Q1–Q30).
 *
 * Run: npm run test:airtable-form
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveSurveyResponsesWriteSchema } from "../src/lib/airtable-survey-response-field-mode";
import { buildRelationalSurveyPayload } from "../src/lib/map-survey-to-airtable";
import { formatRespondentDisplayName, syncSurveyToAirtable } from "../src/lib/airtable-sync";
import {
  CHURCH_FIELDS,
  RESPONSE_FIELDS,
  RESPONDENT_FIELDS,
  surveyResponsesTable,
} from "../src/lib/airtable-schema";
import {
  SURVEY_RESPONSE_QUESTION_FIELDS,
  SURVEY_RESPONSE_TAIL_FIELDS,
} from "../src/lib/survey-airtable-fields";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadDotEnv(file: string) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadDotEnv(envPath);

const TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const WAVE_KEY = process.env.AIRTABLE_SURVEY_WAVE_KEY?.trim() || "pilot-2026";

/** Mirrors ChurchLeaderSurveyForm field keys and valid option values. */
function buildFixtureAnswers(email: string) {
  return {
    firstName: "Verify",
    lastName: "Mapping",
    email,
    churchName: "St. Mapping Verification Church",
    churchCity: "Grand Rapids",

    role: "lead_pastor",
    ministryYears: "2_5",
    congregationSize: "150_500",
    seminary: "yes",
    seminarySpecify: "Westminster Seminary",
    denomination: "yes",
    denominationSpecify: "CRCNA",

    networkOpenness: "somewhat_open",
    networkConcerns: ["theological_alignment", "other"],
    networkConcernsOther: "VERIFY_OTHER_CONCERN",
    theologicalAlignmentNeeded: "moderate",

    tieredVerificationImportance: "very",
    verificationExpectation: "church_leadership",
    crossDenomSupport: "others_aligned",

    leadershipChallenges: ["identify_needs", "admin_burden"],
    memberChallenges: ["awareness_needs"],
    techCanHelp: ["meet_needs", "reduce_admin"],

    discipleshipLeadership: "moderate",
    discipleshipCongregation: "very",

    valueCongregationVisibility: "very",
    valueNationwideVisibility: "moderately",

    pilotLikelihood: "likely",
    congregationUseLikelihood: "neutral",

    platformFeeComfort: "somewhat_comfortable",
    feeTransparencyImportance: "moderately",
    hybridModelPerception: "somewhat_positive",

    financialStructureNotes: "VERIFY_OPEN_FIN_NOTES",
    participationFactor: "VERIFY_OPEN_PARTICIPATION",
    additionalFeedback: "VERIFY_OPEN_ADDITIONAL",

    exchangeFeatures: ["payroll", "budgeting"],
    budgetingFeatures: ["budget_vs_actual", "charts"],

    tryPlatformLikelihood: "somewhat_likely",
    monthlyPriceWilling: "50_99",
    payrollAddonPrice: "100_149",

    gospelToolAgreement: "agree",
    missionTechSupport: "VERIFY_OPEN_MISSION_TECH",

    pilotInterestGR: "more_info",
    referralKnowsSomeone: "yes",
    referralName: "Referral Person",
    referralChurch: "Referral Church",
    referralContact: "referral@example.test",
  } as Record<string, unknown>;
}

function dataRecordUrl(baseId: string, tableName: string, recordId: string) {
  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
}

function normalizeAirtableDateTime(v: unknown): string {
  if (v == null) return "";
  return String(v).replace(/\.\d{3}Z$/, "Z");
}

async function main() {
  if (!TOKEN || !BASE_ID) {
    console.error("Missing AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_BASE_ID (.env.local).");
    process.exit(1);
  }

  const submittedAt = new Date().toISOString();
  const email = `verify-map-${Date.now()}@example.test`;
  const answers = buildFixtureAnswers(email);

  const table = surveyResponsesTable();
  const writeSchema = await resolveSurveyResponsesWriteSchema(TOKEN, BASE_ID, table);
  const payload = buildRelationalSurveyPayload(
    answers,
    submittedAt,
    undefined,
    writeSchema.fieldMode,
  );
  const { responseRecordId } = await syncSurveyToAirtable({
    token: TOKEN,
    baseId: BASE_ID,
    waveKey: WAVE_KEY,
    church: payload.church,
    respondent: payload.respondent,
    surveyResponseFields: payload.surveyResponseFields,
    omitRespondentNameField: writeSchema.omitRespondentNameField,
  });

  const res = await fetch(dataRecordUrl(BASE_ID, table, responseRecordId), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error("GET survey response failed:", res.status, raw);
    process.exit(1);
  }
  const json = JSON.parse(raw) as { fields?: Record<string, unknown> };
  const fields = json.fields ?? {};

  const expected = payload.surveyResponseFields;
  const mismatches: string[] = [];

  for (const [key, exp] of Object.entries(expected)) {
    if (key === RESPONSE_FIELDS.submissionDate) {
      const got = normalizeAirtableDateTime(fields[key]);
      const want = normalizeAirtableDateTime(exp);
      if (got !== want) mismatches.push(`${key}: expected ${want}, got ${got}`);
      continue;
    }
    const got = fields[key];
    if (got !== exp) mismatches.push(`${key}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(got)}`);
  }

  if (!writeSchema.omitRespondentNameField) {
    const wantName = formatRespondentDisplayName(payload.respondent);
    const gotName = fields[RESPONSE_FIELDS.respondentName];
    if (gotName !== wantName) {
      mismatches.push(
        `${RESPONSE_FIELDS.respondentName}: expected ${JSON.stringify(wantName)}, got ${JSON.stringify(gotName)} — add this single-line field on Survey Responses or set AIRTABLE_SKIP_RESPONDENT_NAME_FIELD=1`,
      );
    }
  }

  const churchRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/Churches?maxRecords=3&filterByFormula=${encodeURIComponent(
      `AND({${CHURCH_FIELDS.name}}='${payload.church.name.replace(/'/g, "\\'")}', {${CHURCH_FIELDS.region}}='${payload.church.region.replace(/'/g, "\\'")}')`,
    )}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  );
  const churchJson = (await churchRes.json()) as { records?: { fields: Record<string, unknown> }[] };
  const churchRow = churchJson.records?.[0];
  if (!churchRow) mismatches.push("Churches: no row for name+region");
  else {
    if (churchRow.fields[CHURCH_FIELDS.sizeCategory] !== payload.church.sizeCategory) {
      mismatches.push(
        `Church size: expected ${payload.church.sizeCategory}, got ${String(churchRow.fields[CHURCH_FIELDS.sizeCategory])}`,
      );
    }
  }

  const respRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/Respondents?maxRecords=3&filterByFormula=${encodeURIComponent(
      `{${RESPONDENT_FIELDS.email}}='${email.replace(/'/g, "\\'")}'`,
    )}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  );
  const respJson = (await respRes.json()) as { records?: { fields: Record<string, unknown> }[] };
  const respRow = respJson.records?.[0];
  if (!respRow) mismatches.push("Respondents: no row for fixture email");
  else {
    if (respRow.fields[RESPONDENT_FIELDS.firstName] !== "Verify") {
      mismatches.push(`Respondent first name: got ${String(respRow.fields[RESPONDENT_FIELDS.firstName])}`);
    }
    if (respRow.fields[RESPONDENT_FIELDS.leadershipPosition] !== payload.respondent.leadershipPosition) {
      mismatches.push(
        `Respondent leadership position: expected ${payload.respondent.leadershipPosition}, got ${String(respRow.fields[RESPONDENT_FIELDS.leadershipPosition])}`,
      );
    }
  }

  if (mismatches.length > 0) {
    console.error("Mapping verification FAILED:\n", mismatches.join("\n"));
    process.exit(1);
  }

  console.log("Form → Airtable mapping OK.");
  console.log(`  Survey table: ${table}`);
  console.log(`  Field mode: ${writeSchema.fieldMode}`);
  console.log(`  Omit Respondent Name: ${writeSchema.omitRespondentNameField}`);
  console.log(`  Response record: ${responseRecordId}`);
  if (writeSchema.fieldMode === "legacy") {
    console.log(`  Q1 sample: ${JSON.stringify(fields.Q1)}`);
    console.log(`  Q8 (concerns) includes VERIFY_OTHER_CONCERN: ${String(fields.Q8).includes("VERIFY_OTHER_CONCERN")}`);
    const open = String(fields[RESPONSE_FIELDS.openEnded] ?? "");
    console.log(`  Legacy open-ended block length: ${open.length}`);
  } else {
    console.log(
      `  S1 role column sample: ${JSON.stringify(fields[SURVEY_RESPONSE_QUESTION_FIELDS[0]])}`,
    );
    console.log(
      `  S2 concerns column includes VERIFY_OTHER_CONCERN: ${String(fields[SURVEY_RESPONSE_QUESTION_FIELDS[7]]).includes("VERIFY_OTHER_CONCERN")}`,
    );
    console.log(
      `  Tail monthly price field: ${JSON.stringify(fields[SURVEY_RESPONSE_TAIL_FIELDS[0]])}`,
    );
  }

  const port = process.env.PORT || "3000";
  const body = JSON.stringify({ answers, submittedAt: new Date().toISOString() }, null, 0);
  console.log("\nCurl equivalent (with dev server: npm run dev):");
  console.log(
    `curl -sS -X POST "http://localhost:${port}/api/submit" -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
