import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import { PageLoading } from "../common/LoadingSkeleton";

const STATUS_OPTIONS = ["", "pending", "assigned", "approved", "rejected"];

export default function ProposalList() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevPageRef = useRef(1);

  const fetchList = async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page, per_page: 10 };
      if (status) params.status = status;
      const res = await adminApi.proposals.list(params);
      if (page === 1 || !isForward) {
        setData(res.data || []);
      } else {
        setData(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load proposals");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [page, status]);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const columns = [
    {
      key: "medication_name",
      header: "Medication",
      render: (row) => (
        <p className="text-sm font-bold text-on-surface truncate">{row.medication_name || "—"}</p>
      ),
    },
    {
      key: "form",
      header: "Form",
      render: (row) => (
        <p className="text-sm text-on-surface truncate">{row.form || "—"}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "pharmacist",
      header: "Pharmacist",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">
          {row.pharmacist?.name || "—"}
        </p>
      ),
    },
    {
      key: "specialist",
      header: "Specialist",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">
          {row.specialist?.name || "—"}
        </p>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      width: "140px",
      render: (row) => (
        <p className="text-xs text-on-surface-variant">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      className: "flex-shrink-0 flex items-center gap-1",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Proposals/${row.id}`); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/[0.08] text-on-surface-variant hover:text-primary transition-all"
          title="View details"
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
        </button>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Proposals</h1>
                <p className="text-on-surface-variant mt-1">Manage medication proposals</p>
              </div>
            </div>
            <PageLoading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Proposals</h1>
              <p className="text-on-surface-variant mt-1">Manage medication proposals</p>
            </div>
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="w-full bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <DataTable
            columns={columns}
            data={data}
            meta={meta}
            onPageChange={setPage}
            loading={loading}
            onLoadMore={() => setPage(p => p + 1)}
            loadingMore={loadingMore}
            emptyIcon="rate_review"
            emptyTitle="No proposals found"
            emptyDescription="Try adjusting your status filter."
          />
        </div>
      </div>
    </div>
  );
}
