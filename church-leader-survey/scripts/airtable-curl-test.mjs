#!/usr/bin/env node
/**
 * Smoke tests: meta GET + POST dummy rows to Churches, Respondents, Survey Responses.
 * Uses the same payloads shape as curl (fetch + JSON).
 *
 * Usage: node scripts/airtable-curl-test.mjs
 * Requires .env.local with AIRTABLE_PERSONAL_ACCESS_TOKEN and AIRTABLE_BASE_ID.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadDotEnv(file) {
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
const SURVEY_RESPONSES_TABLE =
  process.env.AIRTABLE_SURVEY_RESPONSES_TABLE || "Survey Responses";

if (!TOKEN || !BASE_ID) {
  console.error("Missing AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_BASE_ID");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}` };
const NAMED_Q1_FIELD = "S1 — Role within church";
const TAIL_SAMPLE_FIELD = "S9 — Monthly price willingness";

function dataUrl(tableName) {
  return `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;
}

async function loadSurveyResponsesSchema(tableName) {
  const metaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  if (!metaRes.ok) {
    console.error("Meta GET failed:", await metaRes.text());
    process.exit(1);
  }
  const metaJson = await metaRes.json();
  const t = (metaJson.tables ?? []).find((x) => x.name === tableName);
  const names = new Set((t?.fields ?? []).map((f) => f.name));

  const env = process.env.AIRTABLE_USE_LEGACY_Q_FIELD_NAMES?.trim();
  let mode;
  if (env === "1") mode = "legacy";
  else if (env === "0") mode = "named";
  else if (names.has(NAMED_Q1_FIELD)) mode = "named";
  else if (names.has("Q1")) mode = "legacy";
  else mode = "named";

  return { names, mode };
}

async function main() {
  console.log("1) GET meta/tables (curl-equivalent)…");
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
  const metaRes = await fetch(metaUrl, { headers });
  const metaText = await metaRes.text();
  if (!metaRes.ok) {
    console.error("FAILED", metaRes.status, metaText);
    process.exit(1);
  }
  const metaJson = JSON.parse(metaText);
  const names = (metaJson.tables ?? []).map((t) => t.name);
  console.log("   OK — tables:", names.join(", ") || "(none)");

  if (!names.includes("Churches")) {
    console.log("\n2–4) Skip data POSTs — run npm run airtable:setup first.");
    return;
  }

  console.log("\n2) POST dummy row to Churches…");
  const churchBody = {
    records: [
      {
        fields: {
          "Church Name": `Curl Test Church ${Date.now()}`,
          Region: "Test City",
          Denomination: "Test",
          "Size Category": "Under 50",
          "Date First Surveyed": new Date().toISOString().slice(0, 10),
        },
      },
    ],
  };
  const churchRes = await fetch(dataUrl("Churches"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(churchBody),
  });
  const churchText = await churchRes.text();
  if (!churchRes.ok) {
    console.error("FAILED", churchRes.status, churchText);
    process.exit(1);
  }
  const churchJson = JSON.parse(churchText);
  const churchId = churchJson.records?.[0]?.id;
  console.log("   OK — church record id:", churchId);

  console.log("\n3) GET Survey Waves (first record for link)…");
  const wavesList = await fetch(`${dataUrl("Survey Waves")}?maxRecords=1`, { headers });
  const wavesJson = await wavesList.json();
  if (!wavesList.ok) {
    console.error("FAILED", wavesList.status, JSON.stringify(wavesJson));
    process.exit(1);
  }
  const waveId = wavesJson.records?.[0]?.id;
  if (!waveId) {
    console.error("No Survey Waves rows — run npm run airtable:setup.");
    process.exit(1);
  }
  console.log("   OK — wave record id:", waveId);

  if (!names.includes("Respondents")) {
    console.log("\n4) Skip Respondents / Survey Responses — Respondents table missing.");
    return;
  }

  const email = `curl-test-${Date.now()}@example.test`;
  console.log("\n4) POST dummy row to Respondents…");
  const respBody = {
    records: [
      {
        fields: {
          Email: email,
          "First Name": "Curl",
          "Last Name": "Test",
          Church: [churchId],
          "Role (Leadership/Congregation)": "Leadership",
          "Leadership Position": "Test role",
          "Years at Church": "1–2 years",
          "Survey Wave": [waveId],
        },
      },
    ],
  };
  const respRes = await fetch(dataUrl("Respondents"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(respBody),
  });
  const respText = await respRes.text();
  if (!respRes.ok) {
    console.error("FAILED", respRes.status, respText);
    process.exit(1);
  }
  const respJson = JSON.parse(respText);
  const respondentId = respJson.records?.[0]?.id;
  console.log("   OK — respondent record id:", respondentId);

  if (!names.includes(SURVEY_RESPONSES_TABLE)) {
    console.log(`\n5) Skip Survey Responses — table "${SURVEY_RESPONSES_TABLE}" not in base.`);
    return;
  }

  console.log(`\n5) POST dummy row to "${SURVEY_RESPONSES_TABLE}"…`);
  const { names: responseFieldNames, mode: fieldMode } = await loadSurveyResponsesSchema(
    SURVEY_RESPONSES_TABLE,
  );
  console.log(`   Using field mode: ${fieldMode}`);
  const nowIso = new Date().toISOString();
  const surveyFields = {
    "Response ID": randomUUID(),
    Respondent: [respondentId],
    "Survey Version": "curl-smoke",
    "Submission Date": nowIso,
  };
  if (fieldMode === "legacy") {
    surveyFields.Q1 = "curl smoke — legacy Q1";
    surveyFields["Open-Ended Response Fields"] = "curl legacy open-ended block";
  } else {
    surveyFields[NAMED_Q1_FIELD] = "curl smoke — named Q1";
    surveyFields[TAIL_SAMPLE_FIELD] = "curl smoke — tail sample";
  }
  if (
    process.env.AIRTABLE_SKIP_RESPONDENT_NAME_FIELD !== "1" &&
    responseFieldNames.has("Respondent Name")
  ) {
    surveyFields["Respondent Name"] = "Curl Smoke Respondent";
  }
  const surveyResBody = {
    records: [
      {
        fields: surveyFields,
      },
    ],
  };
  const srRes = await fetch(dataUrl(SURVEY_RESPONSES_TABLE), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(surveyResBody),
  });
  const srText = await srRes.text();
  if (!srRes.ok) {
    console.error("FAILED", srRes.status, srText);
    process.exit(1);
  }
  const srJson = JSON.parse(srText);
  console.log("   OK — survey response record id:", srJson.records?.[0]?.id);
  console.log("\nAll curl-equivalent POST checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
