import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import StatusBadge from "../common/StatusBadge";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";
import DataTable from "../common/DataTable";

export default function PharmacistList() {
  const navigate = useNavigate();
  const [pharmacists, setPharmacists] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevPageRef = useRef(1);

  const fetchPharmacists = async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.pharmacists.list(params);
      if (page === 1 || !isForward) {
        setPharmacists(res.data || []);
      } else {
        setPharmacists(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch {
      toast.error("Failed to load pharmacists");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPharmacists();
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.pharmacists.delete(deleteTarget.id);
      toast.success("Pharmacist deleted successfully");
      setDeleteTarget(null);
      fetchPharmacists();
    } catch {
      toast.error("Failed to delete pharmacist");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <p className="text-sm font-bold text-on-surface truncate">
          {row.user?.f_name} {row.user?.l_name}
        </p>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">{row.user?.email}</p>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">{row.user?.phone_number}</p>
      ),
    },
    {
      key: "verification_status",
      header: "Status",
      render: (row) => <StatusBadge status={row.verification_status} />,
    },
    {
      key: "syndicate_card",
      header: "Syndicate Card",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">
          {row.syndicate_card
            ? row.syndicate_card.length > 30
              ? `${row.syndicate_card.slice(0, 30)}...`
              : row.syndicate_card
            : "—"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "140px",
      className: "flex items-center justify-end gap-1 flex-shrink-0",
      render: (row) => (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Pharmacists/${row.id}`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.08] hover:text-primary transition-all"
            title="View"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Pharmacists/${row.id}/edit`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.08] hover:text-primary transition-all"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Pharmacists</h1>
              <p className="text-on-surface-variant mt-1">Manage all registered pharmacists</p>
            </div>
            <button
              onClick={() => navigate("/Admin/Pharmacists/create")}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Pharmacist
            </button>
          </div>

          <div className="relative max-w-sm">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/40">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container/50 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40"
            />
          </div>

          {loading && pharmacists.length === 0 ? (
            <PageLoading />
          ) : (
            <DataTable
              columns={columns}
              data={pharmacists}
              meta={meta}
              onPageChange={(p) => setPage(p)}
              loading={loading}
              onLoadMore={() => setPage(p => p + 1)}
              loadingMore={loadingMore}
              emptyIcon="medication"
              emptyTitle="No pharmacists found"
              emptyDescription="Try adjusting your search or add a new pharmacist."
              emptyAction={
                <button
                  onClick={() => navigate("/Admin/Pharmacists/create")}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  Add Pharmacist
                </button>
              }
            />
          )}

          <ConfirmModal
            open={!!deleteTarget}
            title="Delete Pharmacist"
            message={`Are you sure you want to delete ${deleteTarget?.user?.f_name} ${deleteTarget?.user?.l_name}? This action cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
            destructive
          />
        </div>
      </div>
    </div>
  );
}
