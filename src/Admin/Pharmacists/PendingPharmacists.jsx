import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";

export default function PendingPharmacists() {
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await adminApi.pharmacists.pendingVerifications();
      setPharmacists(res.data || []);
    } catch {
      toast.error("Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPending();
  }, []);

  const openApprove = (pharmacist) => {
    setActionTarget(pharmacist);
    setActionType("approve");
    setRejectionReason("");
  };

  const openReject = (pharmacist) => {
    setActionTarget(pharmacist);
    setActionType("reject");
    setRejectionReason("");
  };

  const handleConfirm = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      const payload =
        actionType === "approve"
          ? { status: "approved" }
          : { status: "rejected", rejection_reason: rejectionReason };
      await adminApi.pharmacists.verify(actionTarget.id, payload);
      toast.success(
        actionType === "approve" ? "Pharmacist approved successfully" : "Pharmacist rejected"
      );
      setActionTarget(null);
      setActionType(null);
      fetchPending();
    } catch {
      toast.error(
        actionType === "approve" ? "Failed to approve pharmacist" : "Failed to reject pharmacist"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        icon="verified_user"
        title="Pending Verifications"
        description="Review and verify pharmacist registrations"
      />

      {pharmacists.length === 0 ? (
        <EmptyState
          icon="verified_user"
          title="No pending verifications"
          description="All pharmacists have been reviewed."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pharmacists.map((pharmacist) => {
            const user = pharmacist.user || {};
            return (
              <div
                key={pharmacist.id}
                className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {user.f_name} {user.l_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={pharmacist.verification_status} />
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-on-surface-variant">
                    <span className="font-medium text-on-surface">Phone:</span> {user.phone_number || "—"}
                  </p>
                </div>

                {pharmacist.syndicate_card && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
                      Syndicate Card
                    </p>
                    <a
                      href={pharmacist.syndicate_card}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-medium hover:underline break-all"
                    >
                      {pharmacist.syndicate_card}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-surface-container-high">
                  <button
                    onClick={() => openApprove(pharmacist)}
                    className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve
                  </button>
                  <button
                    onClick={() => openReject(pharmacist)}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionType === "approve" && (
        <ConfirmModal
          open
          title="Approve Pharmacist"
          message={`Are you sure you want to approve ${actionTarget?.user?.f_name} ${actionTarget?.user?.l_name}?`}
          confirmLabel="Approve"
          onConfirm={handleConfirm}
          onCancel={() => { setActionTarget(null); setActionType(null); }}
          loading={processing}
        />
      )}

      {actionType === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setActionTarget(null); setActionType(null); }} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full p-6 animate-[fadeIn_0.2s_ease]">
            <h3 className="text-lg font-bold text-on-surface mb-2">Reject Pharmacist</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Provide a reason for rejecting {actionTarget?.user?.f_name} {actionTarget?.user?.l_name}.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-6 resize-none"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setActionTarget(null); setActionType(null); }}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing || !rejectionReason.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {processing && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
