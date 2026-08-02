import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

export default function ActiveIngredientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ingredient_name_en: "",
    description: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.activeIngredients.list({ id });
        const d = (res.data || []).find((c) => String(c.id) === String(id)) || res.data;
        const item = d?.data || d;
        setForm({
          ingredient_name_en: item.ingredient_name_en || item.name || "",
          description: item.description || "",
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load active ingredient");
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
    if (!isEdit && !form.ingredient_name_en.trim()) {
      toast.error("Ingredient name is required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.activeIngredients.update(id, form);
        toast.success("Active ingredient updated successfully");
      } else {
        await adminApi.activeIngredients.create(form);
        toast.success("Active ingredient created successfully");
      }
      navigate("/Admin/MedicalData/Ingredients");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save active ingredient");
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
            <PageHeader icon={isEdit ? "edit" : "add"} title={isEdit ? "Edit Active Ingredient" : "Add Active Ingredient"} />
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
            icon={isEdit ? "edit" : "science"}
            title={isEdit ? "Edit Active Ingredient" : "Add Active Ingredient"}
            description={isEdit ? "Update active ingredient information" : "Create a new active ingredient record"}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6 space-y-5">
              <Field label="Ingredient Name (English)" required={!isEdit}>
                <input
                  type="text"
                  name="ingredient_name_en"
                  value={form.ingredient_name_en}
                  onChange={handleChange}
                  required={!isEdit}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="Enter ingredient name"
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                  placeholder="Enter description"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/Admin/MedicalData/Ingredients")}
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
