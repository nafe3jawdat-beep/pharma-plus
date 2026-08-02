import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import EmptyState from "../common/EmptyState";
import { PageLoading } from "../common/LoadingSkeleton";

const VERIFY_STATUSES = ["active", "rejected", "suspended"];

export default function PendingCompanies() {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ status: "active", rejection_reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.companies.pending();
        setCompanies(res.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || t("common.error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const openVerify = (company) => {
    setVerifyingId(company.id);
    setVerifyForm({ status: "active", rejection_reason: "" });
  };

  const closeVerify = () => {
    setVerifyingId(null);
    setVerifyForm({ status: "active", rejection_reason: "" });
  };

  const handleVerify = async () => {
    if (!verifyingId) return;
    setSubmitting(true);
    try {
      await adminApi.companies.verify(verifyingId, verifyForm);
      toast.success(t("companies.verified"));
      setCompanies((prev) => prev.filter((c) => c.id !== verifyingId));
      closeVerify();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="pending_actions" title={t("companies.pendingTitle")} description={t("companies.pendingDescription")} />
            <PageLoading />
          </div>
        </div>
      </div>
    );
  }

  if (!loading && companies.length === 0) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="pending_actions" title={t("companies.pendingTitle")} description={t("companies.pendingDescription")} />
            <EmptyState
              icon="check_circle"
              title={t("companies.noPendingTitle")}
              description={t("companies.noPendingDescription")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
          <PageHeader icon="pending_actions" title={t("companies.pendingTitle")} description={t("companies.pendingDescription")} />

          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{company.commercial_name}</h3>
                      {company.commercial_registration && (
                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">{company.commercial_registration}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs">call</span>
                          {company.phone}
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                      {company.license_number && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs">badge</span>
                          {company.license_number}
                        </div>
                      )}
                      {company.owner && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs">person</span>
                          {`${company.owner.f_name || ""} ${company.owner.l_name || ""}`.trim()}
                        </div>
                      )}
                    </div>

                    {company.license_image && (
                      <img
                        src={company.license_image}
                        alt={t("companies.licenseImage")}
                        className="max-w-[240px] max-h-[140px] rounded-lg object-cover border border-surface-container-high"
                      />
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {verifyingId === company.id ? (
                      <div className="w-72 space-y-3 p-4 bg-surface-container rounded-xl border border-surface-container-high">
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">
                            {t("companies.verifyStatus")}
                          </label>
                          <select
                            value={verifyForm.status}
                            onChange={(e) => setVerifyForm((prev) => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                          >
                            {VERIFY_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {verifyForm.status === "rejected" && (
                          <div>
                            <label className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">
                              {t("companies.rejectionReason")}
                            </label>
                            <textarea
                              value={verifyForm.rejection_reason}
                              onChange={(e) => setVerifyForm((prev) => ({ ...prev, rejection_reason: e.target.value }))}
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                              placeholder={t("companies.rejectionReasonPlaceholder")}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleVerify}
                            disabled={submitting}
                            className="flex-1 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {submitting && <span className="material-symbols-outlined text-xs animate-spin">refresh</span>}
                            {t("common.confirm")}
                          </button>
                          <button
                            onClick={closeVerify}
                            disabled={submitting}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-all"
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openVerify(company)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        {t("companies.verify")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
