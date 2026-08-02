import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import DataTable from "../common/DataTable";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";

const PAGE_SIZE = 10;

export default function PatientList() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevPageRef = useRef(1);

  const fetchList = async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page, per_page: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.patients.list(params);
      if (page === 1 || !isForward) {
        setData(res.data || []);
      } else {
        setData(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.patients.delete(deleteTarget.id);
      toast.success("Patient deleted successfully");
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast.error("Failed to delete patient");
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
      key: "age",
      header: "Age",
      render: (row) => (
        <p className="text-sm text-on-surface-variant">{row.user?.age ?? "—"}</p>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      render: (row) => (
        <p className="text-sm text-on-surface-variant capitalize">{row.user?.gender || "—"}</p>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => (
        <p className="text-sm text-on-surface-variant">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
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
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Patients/${row.id}`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.08] hover:text-primary transition-all"
            title="View"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Patients/${row.id}/edit`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.08] hover:text-primary transition-all"
            title="Edit"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all"
            title="Delete"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </>
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
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Patients</h1>
                <p className="text-on-surface-variant mt-1">Manage all registered patients</p>
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
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Patients</h1>
              <p className="text-on-surface-variant mt-1">Manage all registered patients</p>
            </div>
            <button
              onClick={() => navigate("/Admin/Patients/create")}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Patient
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/40">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-surface-container/50 text-on-surface pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40"
            />
          </div>

          <DataTable
            columns={columns}
            data={data}
            meta={meta}
            onPageChange={setPage}
            loading={loading}
            onLoadMore={() => setPage(p => p + 1)}
            loadingMore={loadingMore}
            emptyIcon="person"
            emptyTitle="No patients found"
            emptyDescription="Try adjusting your search or add a new patient."
          />
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deleteTarget?.user?.f_name || ""} ${deleteTarget?.user?.l_name || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        destructive
      />
    </div>
  );
}
