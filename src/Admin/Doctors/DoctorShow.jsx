import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";

export default function DoctorShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.doctors.show(id);
        setDoctor(res.data || res);
      } catch {
        toast.error("Failed to load doctor details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.doctors.delete(id);
      toast.success("Doctor deleted successfully");
      navigate("/Admin/Doctors");
    } catch {
      toast.error("Failed to delete doctor");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!doctor) return null;

  const user = doctor.user || {};

  return (
    <div>
      <PageHeader
        icon="badge"
        title={`${user.f_name || ""} ${user.l_name || ""}`}
        description="Doctor details and information"
      >
        <button
          onClick={() => navigate(`/Admin/Doctors/${id}/edit`)}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6">
          <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
            User Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">First Name</span>
              <span className="text-sm font-medium text-on-surface">{user.f_name || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Last Name</span>
              <span className="text-sm font-medium text-on-surface">{user.l_name || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Email</span>
              <span className="text-sm font-medium text-on-surface">{user.email || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Phone</span>
              <span className="text-sm font-medium text-on-surface">{user.phone_number || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Age</span>
              <span className="text-sm font-medium text-on-surface">{user.age ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Gender</span>
              <span className="text-sm font-medium text-on-surface capitalize">{user.gender || "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-on-surface-variant">Location</span>
              <span className="text-sm font-medium text-on-surface">{user.location || "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6">
          <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">stethoscope</span>
            Doctor Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Specialization</span>
              <span className="text-sm font-medium text-on-surface">{doctor.specialization || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-container-high">
              <span className="text-sm text-on-surface-variant">Verification Status</span>
              <StatusBadge status={doctor.verification_status} />
            </div>
            <div className="py-2">
              <span className="text-sm text-on-surface-variant block mb-3">Syndicate Card</span>
              {doctor.syndicate_card_image ? (
                <img
                  src={doctor.syndicate_card_image}
                  alt="Syndicate Card"
                  className="w-full max-w-sm rounded-xl border border-surface-container-high"
                />
              ) : (
                <p className="text-sm text-on-surface-variant/50">No image available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Doctor"
        message={`Are you sure you want to delete ${user.f_name || ""} ${user.l_name || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
        destructive
      />
    </div>
  );
}
