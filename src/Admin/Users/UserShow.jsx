import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function UserShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await adminApi.users.show(id);
        if (mounted) setUser(res.data);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load user");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleSuspendRestore = async () => {
    setActionLoading(true);
    try {
      if (user.suspended) {
        await adminApi.users.restore(id);
      } else {
        await adminApi.users.suspend(id);
      }
      const res = await adminApi.users.show(id);
      setUser(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      setSuspendModal(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminApi.users.delete(id);
      navigate("/Admin/Users");
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
      setDeleteModal(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error && !user) {
    return (
      <div className="h-full overflow-y-auto bg-surface relative">
        <div className="max-w-7xl mx-auto px-8 py-10 pb-32">
          <PageHeader icon="error" title="User not found" description="Could not load user details" />
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700 font-medium">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const profileCards = [];
  const profileTypes = ["doctor", "pharmacist", "patient", "specialist", "scientific_rep", "company"];
  for (const key of profileTypes) {
    if (user[key]) {
      profileCards.push({ key, label: key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()), data: user[key] });
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-surface relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-10 pb-32">
        <PageHeader
          icon="manage_accounts"
          title={`${user.f_name} ${user.l_name}`}
          description={`User #${user.id}`}
        >
          <button
            onClick={() => navigate(`/Admin/Users/${id}/edit`)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
          <button
            onClick={() => setSuspendModal(true)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ring-1 ${
              user.suspended
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-200"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-amber-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {user.suspended ? "restart_alt" : "pause_circle"}
            </span>
            {user.suspended ? "Restore" : "Suspend"}
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 ring-1 ring-rose-200"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard title="Basic Information">
            <InfoRow label="First Name" value={user.f_name} />
            <InfoRow label="Last Name" value={user.l_name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone_number} />
            <InfoRow label="Age" value={user.age} />
            <InfoRow label="Gender" value={user.gender} />
            <InfoRow label="Location" value={user.location} />
          </InfoCard>

          <div className="space-y-6">
            <InfoCard title="Roles">
              <div className="flex flex-wrap gap-2">
                {(user.roles || []).length > 0 ? (
                  (user.roles || []).map((r) => (
                    <span key={r} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/[0.08] text-primary ring-1 ring-primary/10">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-on-surface-variant/50">No roles assigned</span>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Permissions">
              <div className="flex flex-wrap gap-2">
                {(user.permissions || []).length > 0 ? (
                  (user.permissions || []).map((p) => (
                    <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high/60 text-on-surface-variant ring-1 ring-outline-variant/10">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-on-surface-variant/50">No permissions assigned</span>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Status">
              <div className="flex items-center gap-3">
                <StatusBadge status={user.suspended ? "suspended" : "active"} />
                {user.suspended && user.suspended_at && (
                  <span className="text-xs text-on-surface-variant/60">
                    Suspended on {new Date(user.suspended_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </InfoCard>
          </div>
        </div>

        {profileCards.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-extrabold text-on-surface mb-4">Related Profiles</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {profileCards.map(({ key, label, data }) => (
                <InfoCard key={key} title={label}>
                  {Object.entries(data).map(([k, v]) => (
                    <InfoRow key={k} label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} value={v != null ? String(v) : null} />
                  ))}
                </InfoCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={suspendModal}
        title={user.suspended ? "Restore User" : "Suspend User"}
        message={
          user.suspended
            ? `Are you sure you want to restore "${user.f_name} ${user.l_name}"? They will regain access to the platform.`
            : `Are you sure you want to suspend "${user.f_name} ${user.l_name}"? They will lose access to the platform immediately.`
        }
        confirmLabel={user.suspended ? "Restore" : "Suspend"}
        cancelLabel="Cancel"
        onConfirm={handleSuspendRestore}
        onCancel={() => setSuspendModal(false)}
        loading={actionLoading}
        destructive={!user.suspended}
        icon={user.suspended ? "restart_alt" : "pause_circle"}
      />

      <ConfirmModal
        open={deleteModal}
        title="Delete User"
        message={`Are you sure you want to delete "${user.f_name} ${user.l_name}"? This action cannot be undone and all associated data will be permanently removed.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        loading={actionLoading}
        destructive
      />
    </div>
  );
}
