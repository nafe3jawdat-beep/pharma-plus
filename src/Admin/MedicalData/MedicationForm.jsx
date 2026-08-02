import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

export default function MedicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_name: "",
    barcode: "",
    manufacture_id: "",
    form: "",
    arabic_form: "",
    image: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.medications.list({ id });
        const d = (res.data || []).find((c) => String(c.id) === String(id)) || res.data;
        const item = d?.data || d;
        setForm({
          trade_name: item.trade_name || "",
          barcode: item.barcode || "",
          manufacture_id: item.manufacture_id || "",
          form: item.form || "",
          arabic_form: item.arabic_form || "",
          image: item.image || "",
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load medication");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.trade_name.trim()) {
      toast.error("Trade name is required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.medications.update(id, form);
        toast.success("Medication updated successfully");
      } else {
        await adminApi.medications.create(form);
        toast.success("Medication created successfully");
      }
      navigate("/Admin/MedicalData/Medications");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save medication");
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
            <PageHeader icon={isEdit ? "edit" : "add"} title={isEdit ? "Edit Medication" : "Add Medication"} />
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
            icon={isEdit ? "edit" : "medication"}
            title={isEdit ? "Edit Medication" : "Add Medication"}
            description={isEdit ? "Update medication information" : "Create a new medication record"}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Trade Name" required={!isEdit}>
                  <input
                    type="text"
                    name="trade_name"
                    value={form.trade_name}
                    onChange={handleChange}
                    required={!isEdit}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Enter trade name"
                  />
                </Field>

                <Field label="Barcode">
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Enter barcode"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Manufacturer ID">
                  <input
                    type="text"
                    name="manufacture_id"
                    value={form.manufacture_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Enter manufacturer ID"
                  />
                </Field>

                <Field label="Form">
                  <input
                    type="text"
                    name="form"
                    value={form.form}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="e.g. Tablet, Syrup"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Arabic Form">
                  <input
                    type="text"
                    name="arabic_form"
                    value={form.arabic_form}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Enter Arabic form name"
                  />
                </Field>

                <Field label="Image URL">
                  <input
                    type="text"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Enter image URL"
                  />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/Admin/MedicalData/Medications")}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {isEdit ? "Save" : "Create"}
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
