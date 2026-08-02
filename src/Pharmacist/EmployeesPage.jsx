import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { employeeService } from "../services/pharmacist";
import { cacheEmployees, getCachedEmployees } from "../services/pharmacist";
import { useTranslation } from "react-i18next";

const PERMISSIONS = [
  { key: "inventory_manage", labelKey: "employees.permManageInventory" },
  { key: "orders_process", labelKey: "employees.permProcessOrders" },
  { key: "pharmacy_manage", labelKey: "employees.permPharmacyManage" },
  { key: "operating_hours_manage", labelKey: "employees.permHoursManage" },
];

const emptyForm = {
  f_name: "", l_name: "", email: "", password: "", phone_number: "", salary: "",
  permissions: { inventory_manage: false, orders_process: false, pharmacy_manage: false, operating_hours_manage: false },
};

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = () => {
    if (!selectedPharmacy?.id) return;
    setLoading(true);
    employeeService
      .getAll(selectedPharmacy.id)
      .then((res) => {
        const employeeList = res?.data ?? res?.staff ?? res?.employees ?? [];
        setEmployees(employeeList);
        cacheEmployees(selectedPharmacy.id, employeeList).catch(() => {});
      })
      .catch(async () => {
        const cached = await getCachedEmployees(selectedPharmacy.id);
        if (cached.length > 0) {
          setEmployees(cached);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); // eslint-disable-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (emp) => {
    setEditingId(emp.id);
    setFormData({
      f_name: emp.f_name || emp.name?.split(" ")[0] || "",
      l_name: emp.l_name || emp.name?.split(" ").slice(1).join(" ") || "",
      email: emp.email || "",
      password: "",
      phone_number: emp.phone_number || emp.phone || "",
      salary: emp.salary ?? "",
      permissions: {
        inventory_manage: emp.permissions?.inventory_manage ?? false,
        orders_process: emp.permissions?.orders_process ?? false,
        pharmacy_manage: emp.permissions?.pharmacy_manage ?? false,
        operating_hours_manage: emp.permissions?.operating_hours_manage ?? false,
      },
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacy?.id) return;
    if (!formData.f_name.trim() || !formData.email.trim()) {
      toast.error(t("employees.nameEmailRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        f_name: formData.f_name,
        l_name: formData.l_name,
        email: formData.email,
        phone_number: formData.phone_number,
        permissions: formData.permissions,
      };
      if (formData.salary !== "") payload.salary = Number(formData.salary);
      if (!editingId) payload.password = formData.password;

      let result;
      if (editingId) {
        result = await employeeService.update(selectedPharmacy.id, editingId, payload);
      } else {
        result = await employeeService.create(selectedPharmacy.id, payload);
      }

      if (result?.queued) {
        toast.success(t("employees.offlineQueued"));
      } else {
        toast.success(editingId ? t("employees.employeeUpdated") : t("employees.employeeAdded"));
      }
      setFormData(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchEmployees();
    } catch {
      toast.error(editingId ? t("employees.updateFailed") : t("employees.addFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(t("employees.confirmDelete", { name: emp.name }))) return;
    try {
      const result = await employeeService.remove(selectedPharmacy.id, emp.id);
      if (result?.queued) {
        toast.success(t("employees.offlineQueued"));
      } else {
        toast.success(t("employees.employeeDeleted"));
      }
      fetchEmployees();
    } catch {
      toast.error(t("employees.deleteFailed"));
    }
  };

  const inputClass = "w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm";

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("employees.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("employees.description")}</p>
          </div>
          <button
            onClick={showForm && !editingId ? () => { setShowForm(false); setEditingId(null); } : openAddForm}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">{showForm && !editingId ? "close" : "add"}</span>
            {showForm && !editingId ? t("app.cancel") : t("employees.addEmployee")}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl shadow-sm border border-surface-container-high flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{editingId ? "edit" : "person_add"}</span>
              <h2 className="text-xl font-bold">{editingId ? t("employees.editEmployee") : t("employees.newEmployee")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.firstName")}</label>
                <input type="text" name="f_name" value={formData.f_name} onChange={handleInputChange} className={inputClass} placeholder="John" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.lastName")}</label>
                <input type="text" name="l_name" value={formData.l_name} onChange={handleInputChange} className={inputClass} placeholder="Doe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.email")}</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder={t("placeholders.pharmacyEmail")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("auth.password")}</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={inputClass} placeholder={editingId ? t("employees.leaveBlank") : "********"} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.phone")}</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className={inputClass} placeholder={t("placeholders.phoneExample")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.salary")}</label>
                <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className={inputClass} placeholder="0" min="0" />
              </div>
            </div>

            <div className="border-t border-surface-container-high pt-4">
              <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">{t("employees.permissions")}</label>
              <div className="flex flex-wrap gap-3">
                {PERMISSIONS.map((p) => (
                  <label
                    key={p.key}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all text-sm font-medium border ${
                      formData.permissions[p.key]
                        ? "bg-primary-container/30 border-primary text-primary"
                        : "bg-surface-container/50 border-surface-container-high text-on-surface-variant hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions[p.key]}
                      onChange={() => togglePermission(p.key)}
                      className="sr-only"
                    />
                    <span className={`material-symbols-outlined text-base ${formData.permissions[p.key] ? "" : "opacity-40"}`}>
                      {formData.permissions[p.key] ? "check_circle" : "check_circle_outline"}
                    </span>
                    {t(p.labelKey)}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }}
                className="px-6 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all"
              >
                {t("app.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {submitting ? (
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
                {submitting ? t("employees.saving") : (editingId ? t("employees.saveChanges") : t("employees.addEmployee"))}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center text-on-surface-variant text-sm py-12">{t("employees.loadingEmployees")}</div>
        ) : employees.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-surface-container-high text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">group</span>
              <p className="text-on-surface-variant">{t("employees.noEmployees")}</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-surface-container-high">
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.name")}</th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.email")}</th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.phone")}</th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.role")}</th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.salary")}</th>
                    <th className="text-start px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("employees.permissions")}</th>
                    <th className="text-end px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("app.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center">
                            {emp.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="font-medium text-on-surface">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{emp.email}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{emp.phone || emp.phone_number || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container/50 text-on-secondary-container">
                          {emp.role || "staff"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{emp.salary ?? "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(emp.permissions ? Object.entries(emp.permissions).filter(([, v]) => v) : []).map(([key]) => (
                            <span key={key} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-tertiary-container/40 text-on-tertiary-container">
                              {t(`employees.perm${key.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join("")}`)}
                            </span>
                          ))}
                          {(!emp.permissions || !Object.values(emp.permissions).some(Boolean)) && (
                            <span className="text-[10px] text-on-surface-variant">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(emp)}
                            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all"
                            title={t("app.edit")}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-2 rounded-xl hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-all"
                            title={t("app.delete")}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
