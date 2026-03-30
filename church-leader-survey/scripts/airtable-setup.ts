#!/usr/bin/env node
/**
 * Creates relational tables (Survey Waves, Churches, Respondents, Survey Responses)
 * via Airtable Metadata API. Requires PAT with schema.bases:write + data.records:write.
 *
 * Usage: npm run airtable:setup
 * Loads AIRTABLE_PERSONAL_ACCESS_TOKEN and AIRTABLE_BASE_ID from .env.local or env.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SURVEY_RESPONSE_QUESTION_FIELDS,
  SURVEY_RESPONSE_TAIL_FIELDS,
  tableHasSurveyQuestionSchema,
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

if (!TOKEN || !BASE_ID) {
  console.error("Missing AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_BASE_ID (.env.local or env).");
  process.exit(1);
}

const META = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;

type MetaField =
  | { name: string; type: string; description?: string; options?: Record<string, unknown> }
  | Record<string, unknown>;

async function meta(method: string, body?: unknown) {
  const headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` };
  if (body) headers["Content-Type"] = "application/json";
  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(META, opts);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${res.status}: ${text}`);
  }
  return json as { id?: string; tables?: { name: string; id: string; fields?: { name: string }[] }[] };
}

async function listTables() {
  const r = await meta("GET");
  return r.tables ?? [];
}

function multilineSurveyFields(names: readonly string[]): MetaField[] {
  return names.map((name) => ({ name, type: "multilineText" }));
}

function upsertEnvLocal(filePath: string, key: string, value: string) {
  let text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reLine = new RegExp(`^\\s*${escapedKey}=.*$`, "m");
  const line = `${key}=${value}`;
  if (reLine.test(text)) text = text.replace(reLine, line);
  else {
    if (text && !text.endsWith("\n")) text += "\n";
    text += `${line}\n`;
  }
  fs.writeFileSync(filePath, text);
}

/** When "Survey Responses" is a legacy flat table (no survey columns), we create this table instead. */
const RELATIONAL_SURVEY_RESPONSES = "Survey Responses (Relational)";

async function main() {
  const existing = await listTables();
  const byName = new Map(existing.map((t) => [t.name, t]));
  const ids: Record<string, string> = {};

  if (!byName.has("Survey Waves")) {
    console.log("Creating Survey Waves…");
    const t = await meta("POST", {
      name: "Survey Waves",
      fields: [
        {
          name: "Survey Wave ID",
          type: "singleLineText",
          description: "Stable key matched by the app env AIRTABLE_SURVEY_WAVE_KEY.",
        },
        {
          name: "Start Date",
          type: "date",
          options: { dateFormat: { name: "iso", format: "YYYY-MM-DD" } },
          description: "Wave start (reporting / filtering).",
        },
        {
          name: "End Date",
          type: "date",
          options: { dateFormat: { name: "iso", format: "YYYY-MM-DD" } },
          description: "Wave end (reporting / filtering).",
        },
        {
          name: "Target Audience",
          type: "singleLineText",
          description: "Who this wave is for (e.g. Grand Rapids church leaders).",
        },
        {
          name: "Notes",
          type: "multilineText",
          description: "Internal notes — not survey questions.",
        },
      ],
    });
    ids.waves = t.id!;
    console.log("  table id:", t.id);
  } else {
    ids.waves = byName.get("Survey Waves")!.id;
    console.log("Survey Waves exists:", ids.waves);
  }

  if (!byName.has("Churches")) {
    console.log("Creating Churches…");
    const t = await meta("POST", {
      name: "Churches",
      fields: [
        {
          name: "Church Name",
          type: "singleLineText",
          description: "From survey: church name.",
        },
        {
          name: "Denomination",
          type: "singleLineText",
          description: "From survey Section 1 (denomination question).",
        },
        {
          name: "Region",
          type: "singleLineText",
          description: "From survey: city / region (contact step).",
        },
        {
          name: "Size Category",
          type: "singleLineText",
          description: "From survey: approximate congregation size.",
        },
        {
          name: "Date First Surveyed",
          type: "date",
          options: { dateFormat: { name: "iso", format: "YYYY-MM-DD" } },
          description: "First submission date recorded for this church.",
        },
      ],
    });
    ids.churches = t.id!;
    console.log("  table id:", t.id);
  } else {
    ids.churches = byName.get("Churches")!.id;
    console.log("Churches exists:", ids.churches);
  }

  if (!byName.has("Respondents")) {
    console.log("Creating Respondents…");
    const t = await meta("POST", {
      name: "Respondents",
      fields: [
        { name: "Email", type: "email", description: "Unique contact from the survey." },
        { name: "First Name", type: "singleLineText" },
        { name: "Last Name", type: "singleLineText" },
        {
          name: "Church",
          type: "multipleRecordLinks",
          options: { linkedTableId: ids.churches },
          description: "Link to the church row for this respondent.",
        },
        {
          name: "Role (Leadership/Congregation)",
          type: "singleLineText",
          description: "Always Leadership for this survey route (used for filtering).",
        },
        {
          name: "Leadership Position",
          type: "singleLineText",
          description: "Snapshot from Section 1 (role question) — see Survey Responses for full text answers.",
        },
        {
          name: "Age Range",
          type: "singleLineText",
          description: "Optional demographic — not asked in current web form unless you add it.",
        },
        {
          name: "Years at Church",
          type: "singleLineText",
          description: "Snapshot: years in ministry from Section 1.",
        },
        {
          name: "Survey Wave",
          type: "multipleRecordLinks",
          options: { linkedTableId: ids.waves },
          description: "Which wave this respondent belongs to (e.g. pilot-2026).",
        },
      ],
    });
    ids.respondents = t.id!;
    console.log("  table id:", t.id);
  } else {
    ids.respondents = byName.get("Respondents")!.id;
    console.log("Respondents exists:", ids.respondents);
  }

  const defaultSr = byName.get("Survey Responses");
  const relSr = byName.get(RELATIONAL_SURVEY_RESPONSES);
  let responsesTableName = "Survey Responses";
  let needCreateResponses = false;

  if (!defaultSr) {
    needCreateResponses = true;
  } else if (tableHasSurveyQuestionSchema(defaultSr)) {
    ids.responses = defaultSr.id;
    console.log("Survey Responses exists (survey question columns):", ids.responses);
  } else {
    responsesTableName = RELATIONAL_SURVEY_RESPONSES;
    if (relSr && tableHasSurveyQuestionSchema(relSr)) {
      ids.responses = relSr.id;
      console.log(`${RELATIONAL_SURVEY_RESPONSES} exists:`, ids.responses);
    } else if (relSr) {
      throw new Error(
        `${RELATIONAL_SURVEY_RESPONSES} exists but is missing survey question columns — fix or delete it in Airtable, then re-run.`,
      );
    } else {
      needCreateResponses = true;
    }
  }

  if (needCreateResponses) {
    console.log(`Creating ${responsesTableName}…`);
    const responseFields: MetaField[] = [
      {
        name: "Response ID",
        type: "singleLineText",
        description: "UUID generated per submission (primary field).",
      },
      {
        name: "Respondent",
        type: "multipleRecordLinks",
        options: { linkedTableId: ids.respondents },
        description: "Who submitted this response.",
      },
      {
        name: "Respondent Name",
        type: "singleLineText",
        description: "Display name for grids (First Last or email).",
      },
      { name: "Survey Version", type: "singleLineText" },
      {
        name: "Submission Date",
        type: "dateTime",
        options: {
          dateFormat: { name: "iso", format: "YYYY-MM-DD" },
          timeFormat: { name: "24hour", format: "HH:mm" },
          timeZone: "utc",
        },
      },
      ...multilineSurveyFields(SURVEY_RESPONSE_QUESTION_FIELDS),
      ...multilineSurveyFields(SURVEY_RESPONSE_TAIL_FIELDS),
      {
        name: "AI Theme Tags",
        type: "multilineText",
        description: "Reserved for future AI pipeline — not filled by the form today.",
      },
      { name: "AI Summary", type: "multilineText", description: "Reserved for future AI summary." },
      {
        name: "Sentiment Score",
        type: "number",
        options: { precision: 2 },
        description: "Reserved for analytics.",
      },
      {
        name: "Engagement Risk Score",
        type: "number",
        options: { precision: 2 },
        description: "Reserved for analytics.",
      },
    ];
    const t = await meta("POST", {
      name: responsesTableName,
      fields: responseFields,
    });
    ids.responses = t.id!;
    console.log("  table id:", t.id);
  }

  if (responsesTableName === RELATIONAL_SURVEY_RESPONSES) {
    upsertEnvLocal(envPath, "AIRTABLE_SURVEY_RESPONSES_TABLE", RELATIONAL_SURVEY_RESPONSES);
    console.log(`Updated .env.local: AIRTABLE_SURVEY_RESPONSES_TABLE=${RELATIONAL_SURVEY_RESPONSES}`);
  }

  const data = (p: string) => `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(p)}`;

  async function listWaveRecords() {
    const res = await fetch(`${data("Survey Waves")}?maxRecords=5`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const j = (await res.json()) as { records?: unknown[] };
    return j.records ?? [];
  }

  const waves = await listWaveRecords();
  const hasPilot = waves.some(
    (r) => (r as { fields?: Record<string, string> }).fields?.["Survey Wave ID"] === "pilot-2026",
  );
  if (!hasPilot) {
    console.log("Seeding default wave pilot-2026…");
    const res = await fetch(data("Survey Waves"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Survey Wave ID": "pilot-2026",
              "Start Date": "2026-01-01",
              "End Date": "2026-12-31",
              "Target Audience": "Church leaders (Grand Rapids pilot)",
              Notes: "Created by airtable-setup.ts",
            },
          },
        ],
      }),
    });
    if (!res.ok) console.error("Wave seed failed:", await res.text());
    else console.log("Wave seeded.");
  } else {
    console.log("Default wave pilot-2026 already present.");
  }

  console.log("\nDone. Table IDs:", ids);
  console.log("Set AIRTABLE_SURVEY_WAVE_KEY=pilot-2026 in .env.local (default in app).");
  console.log(
    "If your base still uses columns Q1–Q30, set AIRTABLE_USE_LEGACY_Q_FIELD_NAMES=1 until you migrate.",
  );
}

main().catch((e: Error) => {
  console.error(e.message || e);
  if (String(e.message).includes("403") || String(e.message).includes("INVALID_PERMISSIONS")) {
    console.error(
      "\nTip: create a new Personal Access Token with scopes:\n  - data.records:read\n  - data.records:write\n  - schema.bases:write\n",
    );
  }
  process.exit(1);
});
