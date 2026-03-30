import { RESPONSE_FIELDS } from "@/lib/airtable-schema";
import {
  SURVEY_RESPONSE_LEGACY_Q1,
  SURVEY_RESPONSE_NAMED_SCHEMA_MARKER,
} from "@/lib/survey-airtable-fields";

export type SurveyResponseFieldMode = "legacy" | "named";

export type SurveyResponsesWriteSchema = {
  fieldMode: SurveyResponseFieldMode;
  /** Omit Respondent Name on create (column missing or AIRTABLE_SKIP_RESPONDENT_NAME_FIELD=1). */
  omitRespondentNameField: boolean;
};

/** Field name sets only — env-driven flags are recomputed each call. */
const fieldNamesCache = new Map<string, Set<string>>();

async function surveyResponseFieldNames(
  token: string,
  baseId: string,
  tableName: string,
): Promise<Set<string>> {
  const ck = `${baseId}::${tableName}`;
  const hit = fieldNamesCache.get(ck);
  if (hit) return hit;

  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Airtable meta tables: ${res.status} ${text}`);
  }
  const json = JSON.parse(text) as {
    tables?: { name: string; fields?: { name: string }[] }[];
  };
  const t = json.tables?.find((x) => x.name === tableName);
  const names = new Set((t?.fields ?? []).map((f) => f.name));
  fieldNamesCache.set(ck, names);
  return names;
}

/**
 * Meta GET for field names (cached per table) + env overrides for write shape.
 */
export async function resolveSurveyResponsesWriteSchema(
  token: string,
  baseId: string,
  tableName: string,
): Promise<SurveyResponsesWriteSchema> {
  const names = await surveyResponseFieldNames(token, baseId, tableName);

  const envLegacy = process.env.AIRTABLE_USE_LEGACY_Q_FIELD_NAMES?.trim();
  let fieldMode: SurveyResponseFieldMode;
  if (envLegacy === "1") fieldMode = "legacy";
  else if (envLegacy === "0") fieldMode = "named";
  else if (names.has(SURVEY_RESPONSE_NAMED_SCHEMA_MARKER)) fieldMode = "named";
  else if (names.has(SURVEY_RESPONSE_LEGACY_Q1)) fieldMode = "legacy";
  else fieldMode = "named";

  const omitRespondentNameField =
    process.env.AIRTABLE_SKIP_RESPONDENT_NAME_FIELD === "1" ||
    !names.has(RESPONSE_FIELDS.respondentName);

  return { fieldMode, omitRespondentNameField };
}
