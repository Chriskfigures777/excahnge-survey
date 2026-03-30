"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GRAND_RAPIDS_PILOT_BLURB,
  NUMBERED_QUESTION_LAST,
  PAYROLL_ADDON_PRICE_OPTIONS,
  PLATFORM_MONTHLY_PRICE_OPTIONS,
  TOTAL_STEPS,
  type SurveyAnswers,
} from "@/lib/survey-schema";
import { SURVEY_INTRO_HERO_IMAGE } from "@/lib/survey-step-images";

function getStr(a: SurveyAnswers, key: string): string {
  const v = a[key];
  return typeof v === "string" ? v : "";
}

function getArr(a: SurveyAnswers, key: string): string[] {
  const v = a[key];
  return Array.isArray(v) ? v : [];
}

function FieldLabel({
  children,
  required,
  q,
}: {
  children: React.ReactNode;
  required?: boolean;
  /** Global question number (shown before the label text). */
  q?: number;
}) {
  return (
    <span className="text-base sm:text-[1.0625rem] font-medium leading-snug text-slate-900">
      {q != null ? (
        <span className="mr-1.5 inline font-semibold tabular-nums text-slate-800">{q}.</span>
      ) : null}
      {children}
      {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
    </span>
  );
}

export function ChurchLeaderSurveyForm() {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setStr = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleInList = useCallback(
    (key: string, value: string, max?: number) => {
      setAnswers((prev) => {
        const cur = getArr(prev, key);
        const has = cur.includes(value);
        let next: string[];
        if (has) next = cur.filter((x) => x !== value);
        else {
          if (max != null && cur.length >= max) return prev;
          next = [...cur, value];
        }
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const validate = useCallback((): string | null => {
    const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    switch (step) {
      case 0: {
        if (!getStr(answers, "firstName").trim()) return "Please enter your first name.";
        if (!getStr(answers, "lastName").trim()) return "Please enter your last name.";
        if (!emailOk(getStr(answers, "email"))) return "Please enter a valid email address.";
        if (!getStr(answers, "churchName").trim()) return "Please enter your church name.";
        if (!getStr(answers, "churchCity").trim()) return "Please enter your church city.";
        return null;
      }
      case 1: {
        if (!getStr(answers, "role")) return "Please select your role.";
        if (getStr(answers, "role") === "other" && !getStr(answers, "roleOther").trim())
          return "Please specify your role.";
        if (!getStr(answers, "ministryYears")) return "Please select years in ministry.";
        if (!getStr(answers, "congregationSize")) return "Please select congregation size.";
        if (!getStr(answers, "seminary")) return "Please answer the seminary question.";
        if (getStr(answers, "seminary") === "yes" && !getStr(answers, "seminarySpecify").trim())
          return "Please specify seminary details.";
        if (!getStr(answers, "denomination")) return "Please answer the denomination question.";
        if (getStr(answers, "denomination") === "yes" && !getStr(answers, "denominationSpecify").trim())
          return "Please specify your denomination.";
        return null;
      }
      case 2: {
        if (!getStr(answers, "networkOpenness")) return "Please select how open your church would be.";
        const concerns = getArr(answers, "networkConcerns");
        if (concerns.length === 0) return "Select at least one concern (or “No major concerns”).";
        if (concerns.includes("other") && !getStr(answers, "networkConcernsOther").trim())
          return "Please specify your other concern.";
        if (!getStr(answers, "theologicalAlignmentNeeded")) return "Please select a theological alignment option.";
        return null;
      }
      case 3: {
        if (!getStr(answers, "tieredVerificationImportance")) return "Please rate how important a tiered verification system would be for your team.";
        if (!getStr(answers, "verificationExpectation")) return "Please select an expected verification level.";
        if (!getStr(answers, "crossDenomSupport")) return "Please select your perspective.";
        return null;
      }
      case 4: {
        const l = getArr(answers, "leadershipChallenges");
        const m = getArr(answers, "memberChallenges");
        const t = getArr(answers, "techCanHelp");
        if (l.length < 1 || l.length > 3) return "Select 1–3 leadership challenges.";
        if (m.length < 1 || m.length > 3) return "Select 1–3 member challenges.";
        if (t.length < 1) return "Select at least one area technology could help.";
        return null;
      }
      case 5: {
        if (!getStr(answers, "discipleshipLeadership")) return "Please answer about leadership discipleship.";
        if (!getStr(answers, "discipleshipCongregation")) return "Please answer how members might perceive this.";
        return null;
      }
      case 6: {
        if (!getStr(answers, "valueCongregationVisibility")) return "Please rate congregation visibility value.";
        if (!getStr(answers, "valueNationwideVisibility")) return "Please rate nationwide visibility value.";
        if (!getStr(answers, "pilotLikelihood")) return "Please rate pilot likelihood.";
        if (!getStr(answers, "congregationUseLikelihood")) return "Please rate congregation use likelihood.";
        return null;
      }
      case 7: {
        if (!getStr(answers, "platformFeeComfort")) return "Please rate comfort with a small platform fee.";
        if (!getStr(answers, "feeTransparencyImportance")) return "Please rate transparency importance.";
        if (!getStr(answers, "hybridModelPerception")) return "Please share your perception of the hybrid model.";
        return null;
      }
      case 8:
        return null;
      case 9: {
        if (getArr(answers, "exchangeFeatures").length < 1) return "Select at least one valuable feature.";
        if (getArr(answers, "budgetingFeatures").length < 1)
          return "Select at least one budgeting tool feature.";
        if (!getStr(answers, "tryPlatformLikelihood")) return "Please rate likelihood to try the platform.";
        if (!getStr(answers, "monthlyPriceWilling")) return "Please select a monthly price range.";
        if (!getStr(answers, "payrollAddonPrice")) return "Please select a payroll add-on price expectation.";
        return null;
      }
      case 10: {
        if (!getStr(answers, "gospelToolAgreement")) return "Please answer the gospel effectiveness question.";
        if (!getStr(answers, "pilotInterestGR")) return "Please answer about the Grand Rapids pilot.";
        if (!getStr(answers, "referralKnowsSomeone")) return "Please answer the referral question.";
        return null;
      }
      default:
        return null;
    }
  }, [answers, step]);

  const goNext = useCallback(() => {
    const v = validate();
    setError(v);
    if (v) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }, [step, validate]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const v = validate();
    setError(v);
    if (v) return;
    setSubmitting(true);
    const controller = new AbortController();
    const submitTimeoutMs = 45_000;
    const timeoutId = window.setTimeout(() => controller.abort(), submitTimeoutMs);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        savedToAirtable?: boolean;
      };
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      if (data.savedToAirtable) {
        setDoneMessage("Your responses were saved successfully.");
      } else {
        setDoneMessage(
          data.message ||
            "Your responses were accepted. Add Airtable environment variables when you are ready to persist them to a base.",
        );
      }
      setDone(true);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(
          `Submission timed out after ${submitTimeoutMs / 1000}s. Check your network and try again.`,
        );
      } else {
        setError(e instanceof Error ? e.message : "Submission failed.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }, [answers, validate]);

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);
  const showIntroHero = step === 0;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  useEffect(() => {
    if (done) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [done]);

  if (done) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)]">
          <div className="relative h-28 w-full shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 sm:h-32">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
          </div>
          <div className="flex flex-col justify-center px-6 py-8 text-center sm:px-10 sm:py-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Thank you
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              {doneMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)]">
        <div className="relative h-32 w-full shrink-0 sm:h-36">
          {showIntroHero ? (
            <>
              <Image
                src={SURVEY_INTRO_HERO_IMAGE.src}
                alt={SURVEY_INTRO_HERO_IMAGE.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 48rem"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-xl">
              Church Leader Research Survey
            </h1>
          </div>
        </div>

        <div className="flex w-full flex-col">
          <div className="border-b border-slate-100 bg-white px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step {step + 1} of {TOTAL_STEPS}
            </p>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {error ? (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900"
              >
                {error}
              </div>
            ) : null}

            {step === 0 ? (
              <StepWelcome answers={answers} setStr={setStr} />
            ) : null}
            {step === 1 ? <StepContext answers={answers} setStr={setStr} /> : null}
            {step === 2 ? (
              <StepNetwork answers={answers} setStr={setStr} toggleInList={toggleInList} />
            ) : null}
            {step === 3 ? <StepTrust answers={answers} setStr={setStr} /> : null}
            {step === 4 ? <StepChallenges answers={answers} toggleInList={toggleInList} /> : null}
            {step === 5 ? <StepDiscipleship answers={answers} setStr={setStr} /> : null}
            {step === 6 ? <StepPlatform answers={answers} setStr={setStr} /> : null}
            {step === 7 ? <StepFinancial answers={answers} setStr={setStr} /> : null}
            {step === 8 ? <StepFinalThoughts answers={answers} setStr={setStr} /> : null}
            {step === 9 ? (
              <StepExchange answers={answers} setStr={setStr} toggleInList={toggleInList} />
            ) : null}
            {step === 10 ? <StepGospel answers={answers} setStr={setStr} /> : null}
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="min-h-[44px] touch-manipulation rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="min-h-[44px] touch-manipulation rounded-lg bg-slate-900 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="min-h-[44px] touch-manipulation rounded-lg bg-slate-900 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit survey"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Confidential research survey
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Welcome, Church Leader!
        </h2>
        <p className="text-base leading-relaxed text-slate-600">
          Thank you for participating in this confidential research survey. Questions are numbered in order
          (1–{NUMBERED_QUESTION_LAST}) across {TOTAL_STEPS - 1} content sections, plus contact details to
          start. It takes about 10–15 minutes to complete. Your honest responses are greatly appreciated.
        </p>
      </header>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Please fill in your information to get started.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <FieldLabel required q={1}>
              First name
            </FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
              value={getStr(answers, "firstName")}
              onChange={(e) => setStr("firstName", e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel required q={2}>
              Last name
            </FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
              value={getStr(answers, "lastName")}
              onChange={(e) => setStr("lastName", e.target.value)}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel required q={3}>
              Email address
            </FieldLabel>
            <input
              type="email"
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
              value={getStr(answers, "email")}
              onChange={(e) => setStr("email", e.target.value)}
              placeholder="jane@church.org"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel required q={4}>
              Church name
            </FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
              value={getStr(answers, "churchName")}
              onChange={(e) => setStr("churchName", e.target.value)}
              placeholder="Grace Community Church"
              autoComplete="organization"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel required q={5}>
              Church city
            </FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
              value={getStr(answers, "churchCity")}
              onChange={(e) => setStr("churchCity", e.target.value)}
              placeholder="Grand Rapids"
              autoComplete="address-level2"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function RadioBlock({
  name,
  value,
  selected,
  onChange,
  label,
}: {
  name: string;
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition sm:items-center ${
        selected
          ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
          : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="mt-0.5 size-4 shrink-0 border-slate-400 text-slate-700 focus:ring-slate-900 sm:mt-0"
      />
      <span className="text-base sm:text-[1.0625rem] leading-snug text-slate-800">{label}</span>
    </label>
  );
}

function StepContext({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 1" title="Church context & perspective" />
      <Fieldset
        q={6}
        legend="What is your role within your church?"
        required
        radios={[
          ["lead_pastor", "Lead Pastor"],
          ["associate_pastor", "Associate Pastor"],
          ["elder", "Elder"],
          ["board_member", "Board Member"],
          ["ministry_leader", "Ministry Leader"],
          ["admin_staff", "Administrative Staff"],
          ["other", "Other (please specify below)"],
        ]}
        name="role"
        value={getStr(answers, "role")}
        setStr={setStr}
      />
      {getStr(answers, "role") === "other" ? (
        <label className="flex flex-col gap-1.5">
          <FieldLabel required q={7}>
            Please specify your role
          </FieldLabel>
          <input
            className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
            value={getStr(answers, "roleOther")}
            onChange={(e) => setStr("roleOther", e.target.value)}
          />
        </label>
      ) : null}
      <Fieldset
        q={8}
        legend="How many years have you been in ministry?"
        required
        radios={[
          ["0_1", "0–1 years"],
          ["1_2", "1–2 years"],
          ["2_5", "2–5 years"],
          ["5_10", "5–10 years"],
          ["10_plus", "10+ years"],
        ]}
        name="ministryYears"
        value={getStr(answers, "ministryYears")}
        setStr={setStr}
      />
      <Fieldset
        q={9}
        legend="What is the approximate size of your congregation?"
        required
        radios={[
          ["under_50", "Under 50"],
          ["50_150", "50–150"],
          ["150_500", "150–500"],
          ["500_1000", "500–1,000"],
          ["1000_plus", "1,000+"],
        ]}
        name="congregationSize"
        value={getStr(answers, "congregationSize")}
        setStr={setStr}
      />
      <Fieldset
        q={10}
        legend="Did you attend seminary prior to filling your role?"
        required
        radios={[
          ["yes", "Yes (please specify below)"],
          ["no", "No"],
        ]}
        name="seminary"
        value={getStr(answers, "seminary")}
        setStr={setStr}
      />
      {getStr(answers, "seminary") === "yes" ? (
        <label className="flex flex-col gap-1.5">
          <FieldLabel required q={11}>
            Seminary details
          </FieldLabel>
          <input
            className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
            value={getStr(answers, "seminarySpecify")}
            onChange={(e) => setStr("seminarySpecify", e.target.value)}
          />
        </label>
      ) : null}
      <Fieldset
        q={12}
        legend="Is your church affiliated with a denomination?"
        required
        radios={[
          ["yes", "Yes (please specify below)"],
          ["no_nondenominational", "No (non-denominational)"],
        ]}
        name="denomination"
        value={getStr(answers, "denomination")}
        setStr={setStr}
      />
      {getStr(answers, "denomination") === "yes" ? (
        <label className="flex flex-col gap-1.5">
          <FieldLabel required q={13}>
            Denomination
          </FieldLabel>
          <input
            className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
            value={getStr(answers, "denominationSpecify")}
            onChange={(e) => setStr("denominationSpecify", e.target.value)}
          />
        </label>
      ) : null}
    </div>
  );
}

function Fieldset({
  legend,
  required,
  q,
  radios,
  name,
  value,
  setStr,
}: {
  legend: string;
  required?: boolean;
  q?: number;
  radios: [string, string][];
  name: string;
  value: string;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 max-w-none">
        <FieldLabel required={required} q={q}>
          {legend}
        </FieldLabel>
      </legend>
      <div className="grid gap-3">
        {radios.map(([v, label]) => (
          <RadioBlock
            key={v}
            name={name}
            value={v}
            selected={value === v}
            onChange={(nv) => setStr(name, nv)}
            label={label}
          />
        ))}
      </div>
    </fieldset>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        {kicker}
      </p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function StepNetwork({
  answers,
  setStr,
  toggleInList,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
  toggleInList: (k: string, v: string) => void;
}) {
  const concerns = getArr(answers, "networkConcerns");
  const concernOpts: [string, string][] = [
    ["theological_alignment", "Theological alignment"],
    ["trust_accountability", "Trust and accountability"],
    ["misuse_funds", "Misuse of funds or resources"],
    ["lack_control", "Lack of control or oversight"],
    ["data_privacy", "Data privacy concerns"],
    ["no_major", "No major concerns"],
    ["other", "Other (please specify below)"],
  ];
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 2" title="Church network & collaboration" />
      <Fieldset
        q={14}
        legend="How open would your church be to participating in a nationwide network of churches across different denominations working together to meet needs and share resources?"
        required
        radios={[
          ["very_open", "Very open"],
          ["somewhat_open", "Somewhat open"],
          ["neutral", "Neutral"],
          ["somewhat_hesitant", "Somewhat hesitant"],
          ["not_open", "Not open"],
        ]}
        name="networkOpenness"
        value={getStr(answers, "networkOpenness")}
        setStr={setStr}
      />
      <div>
        <FieldLabel required q={15}>
          What would be your primary concerns, if any, about participating in a nationwide,
          cross-denominational network of churches? (Select all that apply)
        </FieldLabel>
        <div className="mt-3 grid gap-3">
          {concernOpts.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                concerns.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={concerns.includes(v)}
                onChange={() => toggleInList("networkConcerns", v)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 focus:ring-slate-900 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
      {concerns.includes("other") ? (
        <label className="flex flex-col gap-1.5">
          <FieldLabel required q={16}>
            Other concern
          </FieldLabel>
          <input
            className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
            value={getStr(answers, "networkConcernsOther")}
            onChange={(e) => setStr("networkConcernsOther", e.target.value)}
          />
        </label>
      ) : null}
      <Fieldset
        q={17}
        legend="In your view, what level of theological alignment would be necessary for churches to participate together in such a network?"
        required
        radios={[
          ["strict", "Strict alignment required"],
          ["moderate", "Moderate alignment required"],
          ["broad", "Broad alignment acceptable"],
          ["minimal", "Minimal alignment needed"],
          ["none", "No alignment necessary"],
        ]}
        name="theologicalAlignmentNeeded"
        value={getStr(answers, "theologicalAlignmentNeeded")}
        setStr={setStr}
      />
    </div>
  );
}

function StepTrust({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 3" title="Trust, safety & verification" />
      <Fieldset
        q={18}
        legend="How important would a tiered verification system be for your leadership team in participating in such a network? (For example, a system that helps ensure real people are behind profiles in the app.)"
        required
        radios={[
          ["extremely", "Extremely important"],
          ["very", "Very important"],
          ["moderately", "Moderately important"],
          ["slightly", "Slightly important"],
          ["not", "Not important"],
        ]}
        name="tieredVerificationImportance"
        value={getStr(answers, "tieredVerificationImportance")}
        setStr={setStr}
      />
      <Fieldset
        q={19}
        legend="What level of verification would you expect for needs or requests shared across churches in the network?"
        required
        radios={[
          ["church_leadership", "Verified by church leadership"],
          ["platform_team", "Verified by platform team"],
          ["multiple_members", "Verified by multiple members"],
          ["minimal", "Minimal verification required"],
          ["none", "No verification required"],
        ]}
        name="verificationExpectation"
        value={getStr(answers, "verificationExpectation")}
        setStr={setStr}
      />
      <Fieldset
        q={20}
        legend="Which of the following best reflects your perspective?"
        required
        radios={[
          ["own_denom_only", "We would only support individuals and needs within our own denomination"],
          [
            "others_aligned",
            "We would consider supporting individuals from other denominations with proper alignment",
          ],
          [
            "open_body",
            "We are open to supporting individuals across denominations as part of the broader Body of Christ",
          ],
          ["unsure", "Unsure"],
        ]}
        name="crossDenomSupport"
        value={getStr(answers, "crossDenomSupport")}
        setStr={setStr}
      />
    </div>
  );
}

function StepChallenges({
  answers,
  toggleInList,
}: {
  answers: SurveyAnswers;
  toggleInList: (k: string, v: string, max?: number) => void;
}) {
  const leadership: [string, string][] = [
    ["identify_needs", "Difficulty identifying and meeting needs within the congregation"],
    ["visibility_skills", "Limited visibility into members' skills, resources, or availability to help"],
    ["giving_patterns", "Inconsistent or unpredictable giving patterns"],
    ["admin_burden", "Administrative burden in coordinating care, benevolence, or support"],
    ["collab_churches", "Limited collaboration or resource sharing with other churches across the nation"],
  ];
  const member: [string, string][] = [
    ["awareness_needs", "Lack of awareness of needs they could help meet within their church or other churches across the nation"],
    ["limited_serve", "Limited opportunities to use their skills, spiritual gifts, or resources to serve others"],
    ["hesitation_help", "Hesitation or discomfort in asking for help or sharing personal needs"],
    ["giving_impact", "Uncertainty about where their giving is going or how it is making an impact"],
    ["disconnected", "Feeling disconnected from the broader Body of Christ beyond their local congregation"],
  ];
  const tech: [string, string][] = [
    ["meet_needs", "Identifying and meeting needs more effectively"],
    ["visibility_gifts", "Increasing visibility into members' skills, gifts, and resources"],
    ["giving_transparency", "Improving consistency and transparency in giving"],
    ["reduce_admin", "Reducing administrative burden for leadership"],
    ["connection_churches", "Strengthening connection and collaboration between churches across the nation"],
  ];
  const lc = getArr(answers, "leadershipChallenges");
  const mc = getArr(answers, "memberChallenges");
  const tc = getArr(answers, "techCanHelp");
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 4" title="Understanding current challenges" />
      <div>
        <FieldLabel required q={21}>
          Which of the following challenges are currently most significant for your leadership team?
        </FieldLabel>
        <p className="mt-1 text-base text-slate-500">Select up to 3 ({lc.length}/3)</p>
        <div className="mt-3 grid gap-3">
          {leadership.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                lc.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={lc.includes(v)}
                onChange={() => toggleInList("leadershipChallenges", v, 3)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel required q={22}>
          From your perspective, which challenges do members of your congregation most commonly experience?
        </FieldLabel>
        <p className="mt-1 text-base text-slate-500">Select up to 3 ({mc.length}/3)</p>
        <div className="mt-3 grid gap-3">
          {member.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                mc.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={mc.includes(v)}
                onChange={() => toggleInList("memberChallenges", v, 3)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel required q={23}>
          Which of these challenges do you believe technology could meaningfully help address? (Select all that
          apply)
        </FieldLabel>
        <div className="mt-3 grid gap-3">
          {tech.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                tc.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={tc.includes(v)}
                onChange={() => toggleInList("techCanHelp", v)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepDiscipleship({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 5" title="Discipleship & spiritual formation" />
      <Fieldset
        q={24}
        legend="How intentional would you say your leadership team is in actively discipling members of your congregation according to Scripture?"
        required
        radios={[
          [
            "extremely",
            "Extremely intentional — discipleship is a central and clearly structured priority",
          ],
          [
            "very",
            "Very intentional — discipleship is emphasized but may not be fully structured",
          ],
          ["moderate", "Moderately intentional — discipleship happens, but inconsistently"],
          ["slight", "Slightly intentional — discipleship is present but not a major focus"],
          ["not", "Not intentional — discipleship is not actively pursued in a structured way"],
        ]}
        name="discipleshipLeadership"
        value={getStr(answers, "discipleshipLeadership")}
        setStr={setStr}
      />
      <Fieldset
        q={25}
        legend="How intentional do you believe your congregation would say your leadership team is in discipling them according to Scripture?"
        required
        radios={[
          [
            "extremely",
            "Extremely intentional — clearly experienced and recognized by members",
          ],
          ["very", "Very intentional — generally felt, though not universally"],
          ["moderate", "Moderately intentional — experienced by some, but not consistently"],
          ["slight", "Slightly intentional — rarely experienced by most members"],
          ["not", "Not intentional — not meaningfully experienced by the congregation"],
        ]}
        name="discipleshipCongregation"
        value={getStr(answers, "discipleshipCongregation")}
        setStr={setStr}
      />
    </div>
  );
}

function StepPlatform({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 6" title="Platform value & functionality" />
      <Fieldset
        q={26}
        legend="How valuable would it be for your leadership team to have increased visibility into the resources within your congregation (e.g., skills, experience, spiritual gifts, needs, and willingness for free work)?"
        required
        radios={[
          ["extremely", "Extremely valuable"],
          ["very", "Very valuable"],
          ["moderately", "Moderately valuable"],
          ["slightly", "Slightly valuable"],
          ["not", "Not valuable"],
        ]}
        name="valueCongregationVisibility"
        value={getStr(answers, "valueCongregationVisibility")}
        setStr={setStr}
      />
      <Fieldset
        q={27}
        legend="How valuable would it be to have visibility into resources across other churches in a nationwide network?"
        required
        radios={[
          ["extremely", "Extremely valuable"],
          ["very", "Very valuable"],
          ["moderately", "Moderately valuable"],
          ["slightly", "Slightly valuable"],
          ["not", "Not valuable"],
        ]}
        name="valueNationwideVisibility"
        value={getStr(answers, "valueNationwideVisibility")}
        setStr={setStr}
      />
      <Fieldset
        q={28}
        legend="How likely would your leadership team be to pilot a platform that enables connection, giving, and resource sharing across churches nationwide?"
        required
        radios={[
          ["very_likely", "Very likely"],
          ["likely", "Likely"],
          ["neutral", "Neutral"],
          ["unlikely", "Unlikely"],
          ["very_unlikely", "Very unlikely"],
        ]}
        name="pilotLikelihood"
        value={getStr(answers, "pilotLikelihood")}
        setStr={setStr}
      />
      <Fieldset
        q={29}
        legend="How likely do you believe your congregation would be to actively use such a platform?"
        required
        radios={[
          ["very_likely", "Very likely"],
          ["likely", "Likely"],
          ["neutral", "Neutral"],
          ["unlikely", "Unlikely"],
          ["very_unlikely", "Very unlikely"],
        ]}
        name="congregationUseLikelihood"
        value={getStr(answers, "congregationUseLikelihood")}
        setStr={setStr}
      />
    </div>
  );
}

function StepFinancial({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 7" title="Financial model & structure" />
      <Fieldset
        q={30}
        legend="How do you feel about a small platform fee (e.g., ~1%) deducted from donations made through the platform (not charged directly to the church)?"
        required
        radios={[
          ["very_comfortable", "Very comfortable"],
          ["somewhat_comfortable", "Somewhat comfortable"],
          ["neutral", "Neutral"],
          ["somewhat_uncomfortable", "Somewhat uncomfortable"],
          ["very_uncomfortable", "Very uncomfortable"],
        ]}
        name="platformFeeComfort"
        value={getStr(answers, "platformFeeComfort")}
        setStr={setStr}
      />
      <Fieldset
        q={31}
        legend="How important is transparency regarding how platform fees are used (e.g., operations, development, and potential charitable or endowment funding)?"
        required
        radios={[
          ["extremely", "Extremely important"],
          ["very", "Very important"],
          ["moderately", "Moderately important"],
          ["slightly", "Slightly important"],
          ["not", "Not important"],
        ]}
        name="feeTransparencyImportance"
        value={getStr(answers, "feeTransparencyImportance")}
        setStr={setStr}
      />
      <Fieldset
        q={32}
        legend="The platform may operate as a for-profit company with a nonprofit foundation component. What is your overall perception of this hybrid model?"
        required
        radios={[
          ["very_positive", "Very positive"],
          ["somewhat_positive", "Somewhat positive"],
          ["neutral", "Neutral"],
          ["somewhat_negative", "Somewhat negative"],
          ["very_negative", "Very negative"],
        ]}
        name="hybridModelPerception"
        value={getStr(answers, "hybridModelPerception")}
        setStr={setStr}
      />
      <label className="flex flex-col gap-1.5">
        <FieldLabel q={33}>
          Please share any thoughts, concerns, or feedback regarding this type of structure. (optional)
        </FieldLabel>
        <textarea
          rows={4}
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "financialStructureNotes")}
          onChange={(e) => setStr("financialStructureNotes", e.target.value)}
          placeholder="Share your thoughts…"
        />
      </label>
    </div>
  );
}

function StepFinalThoughts({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Section 8" title="Final thoughts" />
      <label className="flex flex-col gap-1.5">
        <FieldLabel q={34}>
          What would be the most important factor in your decision to participate in a platform like this?
          (optional)
        </FieldLabel>
        <textarea
          rows={4}
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "participationFactor")}
          onChange={(e) => setStr("participationFactor", e.target.value)}
          placeholder="Share your thoughts…"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel q={35}>
          Do you have any additional concerns, ideas, or feedback about this concept? (Feel free to also share
          thoughts on potential payroll and banking features within such a platform.) (optional)
        </FieldLabel>
        <textarea
          rows={4}
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "additionalFeedback")}
          onChange={(e) => setStr("additionalFeedback", e.target.value)}
          placeholder="Share your thoughts…"
        />
      </label>
    </div>
  );
}

function StepExchange({
  answers,
  setStr,
  toggleInList,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
  toggleInList: (k: string, v: string) => void;
}) {
  const features: [string, string][] = [
    [
      "donor_giving",
      "Donor Giving & Tithing Pages — Accept online donations with automated receipts and reporting",
    ],
    [
      "banking",
      "Banking & Financial Management — Church bank accounts with built-in financial oversight",
    ],
    ["payroll", "Payroll Processing — Manage staff and contractor payments directly"],
    ["budgeting", "Budgeting Tools — Plan, track, and review church spending"],
    [
      "website",
      "Website Builder — Create and manage your church's website without technical expertise",
    ],
    [
      "survey_tools",
      "Survey & Feedback Tools — Gather input from your congregation digitally",
    ],
    [
      "missionary_splits",
      "Missionary & Ministry Donation Splits — Route donations to specific missionaries or ministries automatically",
    ],
    [
      "notes_comms",
      "Notes & Communication Tools — Share updates, sermon notes, and announcements",
    ],
    [
      "social",
      "Community Social Features — Connect members within and across congregations",
    ],
    ["events", "Event Management — Organize and promote church events"],
  ];
  const bud: [string, string][] = [
    ["budget_vs_actual", "Compare budgeted spending to actual spending"],
    ["trends", "Trend analysis for spending over time"],
    ["monthly_tabs", "Monthly tabs to review past records (month-by-month view for the full year)"],
    [
      "categories",
      "Category-based tracking (e.g., missions, facilities, staff, outreach)",
    ],
    ["charts", "Visual reports and charts"],
    ["export", "Export capabilities (PDF, spreadsheet)"],
  ];
  const ef = getArr(answers, "exchangeFeatures");
  const bf = getArr(answers, "budgetingFeatures");
  return (
    <div className="space-y-6">
      <SectionHeading kicker="The Exchange — key features" title="Platform features & pricing" />
      <div>
        <FieldLabel required q={36}>
          Which of the following features would be most valuable to your church?
        </FieldLabel>
        <p className="mt-1 text-base text-slate-500">Select all that apply</p>
        <div className="mt-3 grid gap-3">
          {features.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                ef.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={ef.includes(v)}
                onChange={() => toggleInList("exchangeFeatures", v)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel required q={37}>
          If your church had access to a digital budgeting tool, which features would be most important?
        </FieldLabel>
        <p className="mt-1 text-base text-slate-500">Select all that apply</p>
        <div className="mt-3 grid gap-3">
          {bud.map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 sm:items-center ${
                bf.includes(v)
                  ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={bf.includes(v)}
                onChange={() => toggleInList("budgetingFeatures", v)}
                className="mt-1 size-4 rounded border-slate-400 text-slate-700 sm:mt-0"
              />
              <span className="text-base text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <Fieldset
        q={38}
        legend="If a platform offered all of the features above, how likely would you be to try it for your church?"
        required
        radios={[
          ["very_likely", "Very likely"],
          ["somewhat_likely", "Somewhat likely"],
          ["neutral", "Neutral"],
          ["unlikely", "Unlikely"],
          ["very_unlikely", "Very unlikely"],
        ]}
        name="tryPlatformLikelihood"
        value={getStr(answers, "tryPlatformLikelihood")}
        setStr={setStr}
      />
      <label className="flex flex-col gap-1.5">
        <FieldLabel required q={39}>
          Based on everything you&apos;ve seen in this survey, what monthly price range would your church be
          willing to invest in a platform like this?
        </FieldLabel>
        <select
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "monthlyPriceWilling")}
          onChange={(e) => setStr("monthlyPriceWilling", e.target.value)}
        >
          <option value="">Select an option…</option>
          {PLATFORM_MONTHLY_PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel required q={40}>
          If a Payroll add-on were available for managing church staff payments, what would your church be
          willing to pay monthly for that feature?
        </FieldLabel>
        <select
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "payrollAddonPrice")}
          onChange={(e) => setStr("payrollAddonPrice", e.target.value)}
        >
          <option value="">Select an option…</option>
          {PAYROLL_ADDON_PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function StepGospel({
  answers,
  setStr,
}: {
  answers: SurveyAnswers;
  setStr: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading kicker="Gospel impact & pilot program" title="Vision, community & referral" />
      <Fieldset
        q={41}
        legend="Do you believe a tool like the one described in this survey would help your congregation live out the gospel more effectively?"
        required
        radios={[
          ["strongly_agree", "Strongly agree"],
          ["agree", "Agree"],
          ["neutral", "Neutral"],
          ["disagree", "Disagree"],
          ["strongly_disagree", "Strongly disagree"],
        ]}
        name="gospelToolAgreement"
        value={getStr(answers, "gospelToolAgreement")}
        setStr={setStr}
      />
      <label className="flex flex-col gap-1.5">
        <FieldLabel q={42}>
          In what ways do you think technology could better support your church&apos;s mission? (optional)
        </FieldLabel>
        <textarea
          rows={3}
          className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
          value={getStr(answers, "missionTechSupport")}
          onChange={(e) => setStr("missionTechSupport", e.target.value)}
          placeholder="Share your thoughts…"
        />
      </label>
      <blockquote className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-base italic leading-relaxed text-slate-700">
        &ldquo;{GRAND_RAPIDS_PILOT_BLURB}&rdquo;
      </blockquote>
      <Fieldset
        q={43}
        legend="Would your church be interested in participating in a pilot program for the Grand Rapids church community?"
        required
        radios={[
          ["yes_love", "Yes, we'd love to be part of this"],
          ["more_info", "We're interested but would like more information first"],
          ["not_now", "Not at this time"],
        ]}
        name="pilotInterestGR"
        value={getStr(answers, "pilotInterestGR")}
        setStr={setStr}
      />
      <Fieldset
        q={44}
        legend="Do you know anyone else — a pastor, church leader, or ministry director — who would benefit from learning about this platform and taking this survey?"
        required
        radios={[
          ["yes", "Yes"],
          ["no", "No"],
        ]}
        name="referralKnowsSomeone"
        value={getStr(answers, "referralKnowsSomeone")}
        setStr={setStr}
      />
      {getStr(answers, "referralKnowsSomeone") === "yes" ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-base font-medium text-slate-900">
            If you feel comfortable sharing, please provide their contact information. (optional)
          </p>
          <label className="flex flex-col gap-1.5">
            <FieldLabel q={45}>Name</FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
              value={getStr(answers, "referralName")}
              onChange={(e) => setStr("referralName", e.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel q={46}>Church / organization</FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
              value={getStr(answers, "referralChurch")}
              onChange={(e) => setStr("referralChurch", e.target.value)}
              placeholder="Church or organization name"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel q={47}>Email or phone</FieldLabel>
            <input
              className="rounded-lg border border-slate-300 bg-white min-h-[44px] px-3 py-2 text-base"
              value={getStr(answers, "referralContact")}
              onChange={(e) => setStr("referralContact", e.target.value)}
              placeholder="Email or phone number"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
