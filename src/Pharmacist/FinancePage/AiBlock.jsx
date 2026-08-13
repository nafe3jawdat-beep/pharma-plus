import { SectionCard, SectionError, SectionEmpty } from "./ui";

const scoreLabel = (s) => {
  const v = String(s ?? "").toLowerCase();
  if (/(high|ممتاز|مرتفع|عال)/.test(v)) return "green";
  if (/(low|منخفض|ضعيف)/.test(v)) return "red";
  return "amber";
};

const AI_TONES = {
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-500",
  amber: "bg-amber-50 text-amber-600",
};

export default function AiBlock({ t, ai, insights, onGenerate, onRefresh }) {
  const keyFindings = Array.isArray(insights.key_findings) ? insights.key_findings : [];
  const recommendations = Array.isArray(insights.actionable_recommendations) ? insights.actionable_recommendations : [];
  const riskAlerts = Array.isArray(insights.inventory_risk_alerts) ? insights.inventory_risk_alerts : [];

  const generateBtn = (
    <button
      onClick={onGenerate}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dim px-6 py-2.5 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="material-symbols-outlined text-lg">auto_awesome</span>
      {t("Reports.generateAiReport")}
    </button>
  );
  const refreshBtn = (
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
    >
      <span className="material-symbols-outlined text-lg">refresh</span>
      {t("Reports.refresh")}
    </button>
  );

  if (ai.status === "loading") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-on-surface-variant">{t("Reports.generating")}</span>
        </div>
      </SectionCard>
    );
  }

  if (ai.status === "pending") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")} actions={refreshBtn}>
        <SectionEmpty icon="hourglass_top" message={t("Reports.generationPending")} t={t}>
          <div className="mt-4">{refreshBtn}</div>
        </SectionEmpty>
      </SectionCard>
    );
  }

  if (ai.status === "error") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <SectionError onRetry={onRefresh} t={t} />
      </SectionCard>
    );
  }

  if (ai.status !== "ready") {
    return (
      <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dim shadow-md shadow-primary/15">
            <span className="material-symbols-outlined text-on-primary text-3xl">auto_awesome</span>
          </div>
          <p className="mb-5 max-w-md text-sm text-on-surface-variant">{t("Reports.aiInsightsPrompt")}</p>
          {generateBtn}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="auto_awesome" title={t("Reports.aiInsights")} actions={generateBtn}>
      <div className="space-y-6">
        {insights.financial_health_score != null && insights.financial_health_score !== "" && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary-dim/5 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-bold text-on-surface">{t("Reports.financialHealthScore")}</p>
            <span className={`w-fit rounded-xl px-3.5 py-1.5 text-sm font-bold tabular-nums ${AI_TONES[scoreLabel(insights.financial_health_score)]}`}>
              {insights.financial_health_score}
            </span>
          </div>
        )}

        {insights.executive_summary && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">summarize</span>
              {t("Reports.executiveSummary")}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{insights.executive_summary}</p>
          </div>
        )}

        {keyFindings.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">lightbulb</span>
              {t("Reports.keyFindings")}
            </h3>
            <ul className="space-y-2">
              {keyFindings.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-container-high bg-surface-container/30 p-3.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-primary">thumb_up</span>
              {t("Reports.recommendations")}
            </h3>
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-container-high bg-surface-container/30 p-3.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">arrow_forward</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskAlerts.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-lg text-rose-400">warning</span>
              {t("Reports.inventoryRiskAlerts")}
            </h3>
            <ul className="space-y-2">
              {riskAlerts.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-sm text-rose-700">
                  <span className="material-symbols-outlined mt-0.5 text-base text-rose-400">error_outline</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
