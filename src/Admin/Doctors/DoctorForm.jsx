import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

export default function DoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    user_id: "",
    specialization: "",
    verification_status: "unverified",
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.doctors.show(id);
        const d = res.data || res;
        setForm({
          user_id: d.user_id || "",
          specialization: d.specialization || "",
          verification_status: d.verification_status || "unverified",
        });
      } catch {
        toast.error("Failed to load doctor");
        navigate("/Admin/Doctors");
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
        await adminApi.doctors.update(id, form);
        toast.success("Doctor updated successfully");
      } else {
        await adminApi.doctors.create(form);
        toast.success("Doctor created successfully");
      }
      navigate("/Admin/Doctors");
    } catch {
      toast.error(isEdit ? "Failed to update doctor" : "Failed to create doctor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        icon={isEdit ? "edit" : "add"}
        title={isEdit ? "Edit Doctor" : "Add Doctor"}
        description={isEdit ? "Update doctor information" : "Register a new doctor"}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6 space-y-6">
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
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Specialization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              required
              placeholder="e.g. Cardiology"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Verification Status</label>
            <select
              name="verification_status"
              value={form.verification_status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
            {isEdit ? "Update Doctor" : "Create Doctor"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/Admin/Doctors")}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
