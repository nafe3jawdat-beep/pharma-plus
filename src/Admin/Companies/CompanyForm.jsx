import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

const STATUSES = ["pending", "active", "suspended"];

export default function CompanyForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    commercial_name: "",
    commercial_registration: "",
    address: "",
    phone: "",
    license_number: "",
    status: "pending",
    owner_id: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.companies.show(id);
        const c = res.data || res;
        setForm({
          commercial_name: c.commercial_name || "",
          commercial_registration: c.commercial_registration || "",
          address: c.address || "",
          phone: c.phone || "",
          license_number: c.license_number || "",
          status: c.status || "pending",
          owner_id: c.owner_id || "",
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || t("common.error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.commercial_name.trim() || !form.commercial_registration.trim()) {
      toast.error(t("common.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.companies.update(id, form);
        toast.success(t("companies.updated"));
      } else {
        await adminApi.companies.create(form);
        toast.success(t("companies.created"));
      }
      navigate("/Admin/Companies");
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="business" title={isEdit ? t("companies.editTitle") : t("companies.createTitle")} />
            <PageLoading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-8 py-10 pb-32">
          <PageHeader
            icon={isEdit ? "edit" : "add_business"}
            title={isEdit ? t("companies.editTitle") : t("companies.createTitle")}
            description={isEdit ? t("companies.editDescription") : t("companies.createDescription")}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={t("companies.commercialName")} required>
                  <input
                    type="text"
                    name="commercial_name"
                    value={form.commercial_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={t("companies.commercialNamePlaceholder")}
                  />
                </Field>

                <Field label={t("companies.commercialRegistration")} required>
                  <input
                    type="text"
                    name="commercial_registration"
                    value={form.commercial_registration}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={t("companies.commercialRegistrationPlaceholder")}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={t("companies.address")}>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={t("companies.addressPlaceholder")}
                  />
                </Field>

                <Field label={t("companies.phone")}>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={t("companies.phonePlaceholder")}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={t("companies.licenseNumber")}>
                  <input
                    type="text"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={t("companies.licenseNumberPlaceholder")}
                  />
                </Field>

                <Field label={t("companies.status")}>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={t("companies.ownerId")}>
                <input
                  type="text"
                  name="owner_id"
                  value={form.owner_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-mono"
                  placeholder={t("companies.ownerIdPlaceholder")}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/Admin/Companies")}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {isEdit ? t("common.save") : t("common.create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
