import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import EmptyState from "../common/EmptyState";
import { PageLoading } from "../common/LoadingSkeleton";

export default function ActivityLog() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.audit.activity();
        setMessage(res?.data?.message || res?.message || "Audit logging is available in a future release.");
      } catch (err) {
        setMessage(err?.response?.data?.message || "Audit logging is available in a future release.");
        toast.error(err?.response?.data?.message || "Failed to load activity log");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
            <PageHeader icon="history" title="Activity Log" description="Audit trail of system activity" />
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
        <div className="relative max-w-7xl mx-auto px-8 py-10 pb-32">
          <PageHeader icon="history" title="Activity Log" description="Audit trail of system activity" />
          <EmptyState
            icon="history"
            title="Activity Log"
            description={message}
          />
        </div>
      </div>
    </div>
  );
}
