import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

export default function ScientificRepForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ user_id: "", company_id: "" });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.scientificReps.show(id);
        const s = res.data || res;
        setForm({
          user_id: s.user_id || "",
          company_id: s.company_id || "",
        });
      } catch {
        toast.error("Failed to load scientific rep");
        navigate("/Admin/ScientificReps");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.scientificReps.update(id, form);
        toast.success("Scientific rep updated successfully");
      } else {
        await adminApi.scientificReps.create(form);
        toast.success("Scientific rep created successfully");
      }
      navigate("/Admin/ScientificReps");
    } catch {
      toast.error(isEdit ? "Failed to update scientific rep" : "Failed to create scientific rep");
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
            <PageHeader icon="biotech" title={isEdit ? "Edit Scientific Rep" : "Add Scientific Rep"} />
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
            icon={isEdit ? "edit" : "add"}
            title={isEdit ? "Edit Scientific Rep" : "Add Scientific Rep"}
            description={isEdit ? "Update scientific rep information" : "Register a new scientific rep"}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">
                    User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="user_id"
                    value={form.user_id}
                    onChange={handleChange}
                    required
                    placeholder="Enter user UUID"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">
                    Company ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_id"
                    value={form.company_id}
                    onChange={handleChange}
                    required
                    placeholder="Enter company UUID"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/Admin/ScientificReps")}
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
                {isEdit ? "Update Scientific Rep" : "Create Scientific Rep"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
