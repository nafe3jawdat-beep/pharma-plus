import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import { PageLoading } from "../common/LoadingSkeleton";

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    email: "",
    phone_number: "",
    age: "",
    gender: "",
    location: "",
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      try {
        const res = await adminApi.users.show(id);
        if (mounted) {
          const u = res.data;
          setFormData({
            f_name: u.f_name || "",
            l_name: u.l_name || "",
            email: u.email || "",
            phone_number: u.phone_number || "",
            age: u.age != null ? String(u.age) : "",
            gender: u.gender || "",
            location: u.location || "",
            role: "",
          });
        }
      } catch (err) {
        if (mounted) setSubmitError(err.message || "Failed to load user");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.f_name.trim()) errs.f_name = "First name is required";
    if (!formData.l_name.trim()) errs.l_name = "Last name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Invalid email format";
    if (formData.age && (isNaN(formData.age) || Number(formData.age) < 1 || Number(formData.age) > 150)) {
      errs.age = "Age must be between 1 and 150";
    }
    if (!isEdit && !formData.role) errs.role = "Role is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        f_name: formData.f_name.trim(),
        l_name: formData.l_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender || undefined,
        location: formData.location.trim() || undefined,
      };
      if (!isEdit) payload.role = formData.role;

      if (isEdit) {
        await adminApi.users.update(id, payload);
      } else {
        await adminApi.users.create(payload);
      }
      navigate("/Admin/Users");
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="h-full overflow-y-auto bg-surface relative">
      <div className="max-w-3xl mx-auto px-8 py-10 pb-32">
        <PageHeader
          icon="manage_accounts"
          title={isEdit ? "Edit User" : "New User"}
          description={isEdit ? `Editing user #${id}` : "Create a new user"}
        />

        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-sm text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="First Name" name="f_name" value={formData.f_name} onChange={handleChange} error={errors.f_name} />
            <Field label="Last Name" name="l_name" value={formData.l_name} onChange={handleChange} error={errors.l_name} />
          </div>

          <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
          <Field label="Phone Number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="Age" name="age" type="number" min={1} max={150} value={formData.age} onChange={handleChange} error={errors.age} />
            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <Field label="Location" name="location" value={formData.location} onChange={handleChange} />
          </div>

          {!isEdit && (
            <div className="flex flex-col space-y-1.5">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="patient">Patient</option>
                <option value="specialist">Specialist</option>
                <option value="scientific_rep">Scientific Rep</option>
              </select>
              {errors.role && <p className="text-xs text-rose-500 font-medium ml-1">{errors.role}</p>}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-surface-container-high">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              {isEdit ? "Update User" : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/Admin/Users")}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, error, ...attrs }) {
  return (
    <div className="flex flex-col space-y-1.5">
      <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        {...attrs}
        className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
          error ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400" : "border-surface-container-high"
        }`}
      />
      {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
    </div>
  );
}
