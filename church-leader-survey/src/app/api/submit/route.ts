import { NextResponse } from "next/server";
import { resolveSurveyResponsesWriteSchema } from "@/lib/airtable-survey-response-field-mode";
import { syncSurveyToAirtable } from "@/lib/airtable-sync";
import { surveyResponsesTable } from "@/lib/airtable-schema";
import { buildRelationalSurveyPayload } from "@/lib/map-survey-to-airtable";

type Body = {
  answers?: Record<string, unknown>;
  submittedAt?: string;
};

function str(a: Record<string, unknown>, key: string): string {
  const v = a[key];
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const waveKey = process.env.AIRTABLE_SURVEY_WAVE_KEY?.trim() || "pilot-2026";
  const surveyVersion = process.env.SURVEY_VERSION?.trim() || undefined;

  const a = body.answers ?? {};
  if (
    !str(a, "firstName") ||
    !str(a, "lastName") ||
    !str(a, "email") ||
    !str(a, "churchName") ||
    !str(a, "churchCity")
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Missing required contact fields. Please provide first name, last name, email, church name, and church city.",
      },
      { status: 400 },
    );
  }

  if (!token || !baseId) {
    return NextResponse.json({
      ok: true,
      savedToAirtable: false,
      message:
        "Response accepted. Set AIRTABLE_PERSONAL_ACCESS_TOKEN and AIRTABLE_BASE_ID in .env.local, run npm run airtable:setup, then submit again.",
    });
  }

  const submittedAt = body.submittedAt ?? new Date().toISOString();
  const responsesTable = surveyResponsesTable();
  const writeSchema = await resolveSurveyResponsesWriteSchema(token, baseId, responsesTable);
  const payload = buildRelationalSurveyPayload(
    body.answers ?? {},
    submittedAt,
    surveyVersion,
    writeSchema.fieldMode,
  );

  try {
    const { responseRecordId } = await syncSurveyToAirtable({
      token,
      baseId,
      waveKey,
      church: payload.church,
      respondent: payload.respondent,
      surveyResponseFields: payload.surveyResponseFields,
      omitRespondentNameField: writeSchema.omitRespondentNameField,
    });
    return NextResponse.json({ ok: true, savedToAirtable: true, responseRecordId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Airtable sync failed.";
    return NextResponse.json(
      {
        ok: false,
        message: msg,
      },
      { status: 502 },
    );
  }
}
