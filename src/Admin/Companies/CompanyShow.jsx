import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";

function InfoCard({ title, children, className = "" }) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-surface-container-high/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">{title}</h3>
        </div>
      )}
      <div className="p-6 space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-on-surface-variant/60 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right">{value || "—"}</span>
    </div>
  );
}

export default function CompanyShow() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.companies.show(id);
        setCompany(res.data || res);
      } catch (err) {
        toast.error(err?.response?.data?.message || t("common.error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.companies.delete(id);
      toast.success(t("companies.deleted"));
      navigate("/Admin/Companies");
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="business" title="—" />
            <PageLoading />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="business" title={t("common.notFound")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-500/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
          <PageHeader
            icon="business"
            title={company.commercial_name}
            description={company.commercial_registration}
          >
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => navigate(`/Admin/Companies/${id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {t("common.edit")}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-all ring-1 ring-rose-200"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                {t("common.delete")}
              </button>
            </div>
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard title={t("companies.companyInfo")}>
              <InfoRow label={t("companies.commercialName")} value={company.commercial_name} />
              <InfoRow label={t("companies.commercialRegistration")} value={company.commercial_registration} />
              <InfoRow label={t("companies.address")} value={company.address} />
              <InfoRow label={t("companies.phone")} value={company.phone} />
              <InfoRow label={t("companies.licenseNumber")} value={company.license_number} />
              {company.license_image && (
                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-sm font-medium text-on-surface-variant/60 flex-shrink-0">{t("companies.licenseImage")}</span>
                  <img
                    src={company.license_image}
                    alt={t("companies.licenseImage")}
                    className="max-w-[200px] max-h-[120px] rounded-xl object-cover border border-surface-container-high/60 shadow-sm"
                  />
                </div>
              )}
              <InfoRow
                label={t("companies.status")}
                value={<StatusBadge status={company.status} />}
              />
            </InfoCard>

            {company.owner && (
              <InfoCard title={t("companies.ownerInfo")}>
                <InfoRow label="ID" value={company.owner.id} />
                <InfoRow label={t("users.firstName")} value={company.owner.f_name} />
                <InfoRow label={t("users.lastName")} value={company.owner.l_name} />
                <InfoRow label={t("users.email")} value={company.owner.email} />
                <InfoRow label={t("users.phone")} value={company.owner.phone_number} />
              </InfoCard>
            )}

            <InfoCard title={t("companies.timestamps")}>
              <InfoRow label={t("common.createdAt")} value={company.created_at ? new Date(company.created_at).toLocaleString() : "—"} />
              <InfoRow label={t("common.updatedAt")} value={company.updated_at ? new Date(company.updated_at).toLocaleString() : "—"} />
            </InfoCard>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title={t("companies.deleteTitle")}
        message={t("companies.deleteMessage", { name: company.commercial_name })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
        destructive
      />
    </div>
  );
}
