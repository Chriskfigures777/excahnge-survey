import {
  CHURCH_FIELDS,
  RESPONSE_FIELDS,
  RESPONDENT_FIELDS,
  TABLES,
  surveyResponsesTable,
} from "@/lib/airtable-schema";
import type { RelationalSurveyPayload } from "@/lib/map-survey-to-airtable";
import { randomUUID } from "crypto";

type AirtableListResponse = {
  records?: { id: string; fields?: Record<string, unknown> }[];
};

function dataUrl(baseId: string, tableName: string) {
  return `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`;
}

function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Shown on Survey Responses; falls back to email if names missing. */
export function formatRespondentDisplayName(respondent: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const full = `${respondent.firstName} ${respondent.lastName}`.trim();
  return full || respondent.email.trim() || "Respondent";
}

function omitEmpty(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === "") continue;
    out[k] = v;
  }
  return out;
}

export async function listRecords(
  token: string,
  baseId: string,
  tableName: string,
  filterByFormula?: string,
  maxRecords = 10,
): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  const params = new URLSearchParams({ pageSize: String(maxRecords) });
  if (filterByFormula) params.set("filterByFormula", filterByFormula);
  const url = `${dataUrl(baseId, tableName)}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Airtable list ${tableName}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as AirtableListResponse;
  return (json.records ?? []).map((r) => ({ id: r.id, fields: r.fields ?? {} }));
}

export async function createRecord(
  token: string,
  baseId: string,
  tableName: string,
  fields: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(dataUrl(baseId, tableName), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields: omitEmpty(fields) }] }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Airtable create ${tableName}: ${res.status} ${text}`);
  const json = JSON.parse(text) as { records?: { id: string }[] };
  const id = json.records?.[0]?.id;
  if (!id) throw new Error(`Airtable create ${tableName}: missing record id`);
  return id;
}

export async function findChurchRecordId(
  token: string,
  baseId: string,
  churchName: string,
  region: string,
): Promise<string | null> {
  const f = `AND({${CHURCH_FIELDS.name}}='${escapeFormulaString(churchName)}', {${CHURCH_FIELDS.region}}='${escapeFormulaString(region)}')`;
  const rows = await listRecords(token, baseId, TABLES.churches, f, 1);
  return rows[0]?.id ?? null;
}

export async function findRespondentRecordId(
  token: string,
  baseId: string,
  email: string,
  churchRecordId: string,
): Promise<string | null> {
  const f = `AND({${RESPONDENT_FIELDS.email}}='${escapeFormulaString(email)}', FIND('${churchRecordId}', ARRAYJOIN({${RESPONDENT_FIELDS.church}})))`;
  const rows = await listRecords(token, baseId, TABLES.respondents, f, 1);
  return rows[0]?.id ?? null;
}

export async function findDefaultWaveRecordId(
  token: string,
  baseId: string,
  waveIdValue: string,
): Promise<string | null> {
  const f = `{Survey Wave ID}='${escapeFormulaString(waveIdValue)}'`;
  const rows = await listRecords(token, baseId, TABLES.waves, f, 1);
  return rows[0]?.id ?? null;
}

export async function firstWaveRecordId(token: string, baseId: string): Promise<string | null> {
  const rows = await listRecords(token, baseId, TABLES.waves, undefined, 1);
  return rows[0]?.id ?? null;
}

export type SyncInput = {
  token: string;
  baseId: string;
  waveKey: string;
  church: RelationalSurveyPayload["church"];
  respondent: RelationalSurveyPayload["respondent"];
  surveyResponseFields: Record<string, string>;
  /** From Meta schema: skip when column missing (or set AIRTABLE_SKIP_RESPONDENT_NAME_FIELD=1). */
  omitRespondentNameField?: boolean;
};

export async function syncSurveyToAirtable(input: SyncInput): Promise<{ responseRecordId: string }> {
  const { token, baseId, waveKey, church, respondent, surveyResponseFields, omitRespondentNameField } =
    input;

  let waveId = await findDefaultWaveRecordId(token, baseId, waveKey);
  if (!waveId) waveId = await firstWaveRecordId(token, baseId);
  if (!waveId) throw new Error("No Survey Wave row found. Run npm run airtable:setup or add a wave.");

  let churchRecordId = await findChurchRecordId(token, baseId, church.name, church.region);
  if (!churchRecordId) {
    churchRecordId = await createRecord(token, baseId, TABLES.churches, {
      [CHURCH_FIELDS.name]: church.name,
      [CHURCH_FIELDS.denomination]: church.denomination,
      [CHURCH_FIELDS.region]: church.region,
      [CHURCH_FIELDS.sizeCategory]: church.sizeCategory,
      [CHURCH_FIELDS.dateFirstSurveyed]: church.dateFirstSurveyed,
    });
  }

  let respondentRecordId = await findRespondentRecordId(
    token,
    baseId,
    respondent.email,
    churchRecordId,
  );
  if (!respondentRecordId) {
    respondentRecordId = await createRecord(token, baseId, TABLES.respondents, {
      [RESPONDENT_FIELDS.email]: respondent.email,
      [RESPONDENT_FIELDS.firstName]: respondent.firstName,
      [RESPONDENT_FIELDS.lastName]: respondent.lastName,
      [RESPONDENT_FIELDS.church]: [churchRecordId],
      [RESPONDENT_FIELDS.roleCategory]: respondent.roleCategory,
      [RESPONDENT_FIELDS.leadershipPosition]: respondent.leadershipPosition,
      [RESPONDENT_FIELDS.yearsAtChurch]: respondent.yearsAtChurch,
      [RESPONDENT_FIELDS.surveyWave]: [waveId],
    });
  }

  const skipRespondentName =
    process.env.AIRTABLE_SKIP_RESPONDENT_NAME_FIELD === "1" || omitRespondentNameField === true;
  const responseRecordId = await createRecord(token, baseId, surveyResponsesTable(), {
    [RESPONSE_FIELDS.responseId]: randomUUID(),
    ...(skipRespondentName
      ? {}
      : { [RESPONSE_FIELDS.respondentName]: formatRespondentDisplayName(respondent) }),
    [RESPONSE_FIELDS.respondent]: [respondentRecordId],
    ...surveyResponseFields,
  });

  return { responseRecordId };
}
