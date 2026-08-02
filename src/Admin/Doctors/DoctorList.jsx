import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import StatusBadge from "../common/StatusBadge";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";
import DataTable from "../common/DataTable";

export default function DoctorList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevPageRef = useRef(1);

  const fetchDoctors = async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.doctors.list(params);
      if (page === 1 || !isForward) {
        setDoctors(res.data || []);
      } else {
        setDoctors(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctors();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.doctors.delete(deleteTarget.id);
      toast.success("Doctor deleted successfully");
      setDeleteTarget(null);
      fetchDoctors();
    } catch {
      toast.error("Failed to delete doctor");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      className: "flex-[2] min-w-0",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-lg">stethoscope</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">
              {row.user?.f_name} {row.user?.l_name}
            </p>
            <p className="text-xs text-on-surface-variant/60 truncate md:hidden">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "flex-[2] min-w-0 hidden md:block",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">{row.user?.email}</p>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      className: "flex-1 min-w-0 hidden lg:block",
      render: (row) => (
        <p className="text-sm text-on-surface truncate">{row.specialization}</p>
      ),
    },
    {
      key: "verification_status",
      header: "Status",
      className: "flex-none w-28",
      render: (row) => <StatusBadge status={row.verification_status} />,
    },
    {
      key: "created_at",
      header: "Joined",
      className: "flex-none w-28 hidden lg:block",
      render: (row) => (
        <p className="text-xs text-on-surface-variant">
          {new Date(row.created_at).toLocaleDateString()}
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
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Doctors/${row.id}`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.08] hover:text-primary transition-all"
            title="View"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Doctors/${row.id}/edit`); }}
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
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Doctors</h1>
              <p className="text-on-surface-variant mt-1">Manage all registered doctors</p>
            </div>
            <button
              onClick={() => navigate("/Admin/Doctors/create")}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Doctor
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

          {loading && doctors.length === 0 ? (
            <PageLoading />
          ) : (
            <DataTable
              columns={columns}
              data={doctors}
              meta={meta}
              onPageChange={(p) => setPage(p)}
              loading={loading}
              onLoadMore={() => setPage(p => p + 1)}
              loadingMore={loadingMore}
              emptyIcon="badge"
              emptyTitle="No doctors found"
              emptyDescription="Try adjusting your search or add a new doctor."
              emptyAction={
                <button
                  onClick={() => navigate("/Admin/Doctors/create")}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
                >
                  Add Doctor
                </button>
              }
            />
          )}

          <ConfirmModal
            open={!!deleteTarget}
            title="Delete Doctor"
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
