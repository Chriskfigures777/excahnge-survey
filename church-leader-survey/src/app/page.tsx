import dynamic from "next/dynamic";

const ChurchLeaderSurveyForm = dynamic(
  () =>
    import("@/components/ChurchLeaderSurveyForm").then((m) => ({
      default: m.ChurchLeaderSurveyForm,
    })),
  {
    loading: () => (
      <div className="mx-auto flex min-h-[50dvh] max-w-6xl items-center justify-center rounded-2xl border border-slate-200/90 bg-white/90 px-6 py-16 shadow-sm">
        <p className="text-lg text-slate-600">Loading survey…</p>
      </div>
    ),
  },
);

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-200/80 via-[#e8ecf1] to-[#eef1f4] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <ChurchLeaderSurveyForm />
    </div>
  );
}
