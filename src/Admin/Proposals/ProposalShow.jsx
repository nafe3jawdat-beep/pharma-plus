import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import { PageLoading } from "../common/LoadingSkeleton";

export default function ProposalShow() {
  const { id } = useParams();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [specialistId, setSpecialistId] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.proposals.show(id);
        setProposal(res.data || res);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load proposal");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAssign = async () => {
    if (!specialistId.trim()) {
      toast.error("Specialist ID is required");
      return;
    }
    setProcessing(true);
    try {
      await adminApi.proposals.assign(id, { specialist_id: specialistId });
      toast.success("Proposal assigned successfully");
      setAssignOpen(false);
      setSpecialistId("");
      const res = await adminApi.proposals.show(id);
      setProposal(res.data || res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign proposal");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await adminApi.proposals.approve(id);
      toast.success("Proposal approved successfully");
      const res = await adminApi.proposals.show(id);
      setProposal(res.data || res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve proposal");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setProcessing(true);
    try {
      await adminApi.proposals.reject(id, { rejection_reason: rejectionReason });
      toast.success("Proposal rejected");
      setRejectOpen(false);
      setRejectionReason("");
      const res = await adminApi.proposals.show(id);
      setProposal(res.data || res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject proposal");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="rate_review" title="—" />
            <PageLoading />
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="rate_review" title="Not Found" />
          </div>
        </div>
      </div>
    );
  }

  const isPending = proposal.status === "pending";
  const isAssigned = proposal.status === "assigned";
  const isApproved = proposal.status === "approved";
  const isRejected = proposal.status === "rejected";
  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
          <PageHeader
            icon="rate_review"
            title={proposal.medication_name || "Proposal"}
            description={`Proposal #${proposal.id}`}
          >
            <div className="ml-auto flex items-center gap-2">
              {isPending && (
                <>
                  <button
                    onClick={() => setAssignOpen(true)}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">assignment</span>
                    Assign
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Reject
                  </button>
                </>
              )}
              {isAssigned && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Reject
                  </button>
                </>
              )}
              {(isApproved || isRejected) && (
                <>
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant/50 text-sm font-bold cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant/50 text-sm font-bold cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Reject
                  </button>
                </>
              )}
            </div>
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 mb-4">Medication Information</h3>
              <div className="space-y-3">
                <InfoRow label="Name" value={proposal.medication_name} />
                <InfoRow label="Form" value={proposal.form} />
                <InfoRow
                  label="Status"
                  value={<StatusBadge status={proposal.status} />}
                />
                {proposal.image_url && (
                  <div className="flex items-start justify-between gap-4 py-1.5">
                    <span className="text-xs font-medium text-on-surface-variant/70 flex-shrink-0 w-36">Image</span>
                    <img
                      src={proposal.image_url}
                      alt={proposal.medication_name}
                      className="max-w-[200px] max-h-[120px] rounded-lg object-cover border border-surface-container-high"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 mb-4">People</h3>
              <div className="space-y-3">
                <InfoRow label="Pharmacist" value={proposal.pharmacist?.name || "—"} />
                <InfoRow label="Specialist" value={proposal.specialist?.name || "—"} />
              </div>
            </div>

            {isRejected && proposal.rejection_reason && (
              <div className="bg-surface-container/40 rounded-2xl border border-rose-200 dark:border-rose-900/30 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-4">Rejection Reason</h3>
                <p className="text-sm text-on-surface">{proposal.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setAssignOpen(false); setSpecialistId(""); }} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full p-6 animate-[fadeIn_0.2s_ease]">
            <h3 className="text-lg font-bold text-on-surface mb-2">Assign Specialist</h3>
            <p className="text-sm text-on-surface-variant mb-4">Enter the specialist ID to assign this proposal.</p>
            <input
              type="text"
              value={specialistId}
              onChange={(e) => setSpecialistId(e.target.value)}
              placeholder="Specialist ID"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-6"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setAssignOpen(false); setSpecialistId(""); }}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={processing || !specialistId.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dim transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {processing && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setRejectOpen(false); setRejectionReason(""); }} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-md w-full p-6 animate-[fadeIn_0.2s_ease]">
            <h3 className="text-lg font-bold text-on-surface mb-2">Reject Proposal</h3>
            <p className="text-sm text-on-surface-variant mb-4">Provide a reason for rejection.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-surface-container-high text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-6 resize-none"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setRejectOpen(false); setRejectionReason(""); }}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs font-medium text-on-surface-variant/70 flex-shrink-0 w-36">{label}</span>
      <span className="text-sm text-on-surface text-right">{value || "—"}</span>
    </div>
  );
}
