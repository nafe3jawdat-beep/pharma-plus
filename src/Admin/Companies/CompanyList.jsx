import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { adminApi } from "../../services/admin";
import PageHeader from "../common/PageHeader";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import ConfirmModal from "../common/ConfirmModal";
import { PageLoading } from "../common/LoadingSkeleton";

const PAGE_SIZE = 10;

export default function CompanyList() {
  const { t } = useTranslation();
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

  const fetchList = useCallback(async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = { page, per_page: PAGE_SIZE };
      if (search.trim()) params.commercial_name = search.trim();
      const res = await adminApi.companies.list(params);
      if (page === 1 || !isForward) {
        setData(res.data || []);
      } else {
        setData(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.companies.delete(deleteTarget.id);
      toast.success(t("companies.deleted"));
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "commercial_name",
      header: "Company",
      className: "flex-[2] min-w-0",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-900/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-violet-500 text-lg">business</span>
          </div>
          <button
            onClick={() => navigate(`/Admin/Companies/${row.id}`)}
            className="text-sm font-bold text-on-surface truncate text-left hover:text-primary transition-colors"
          >
            {row.commercial_name}
          </button>
        </div>
      ),
    },
    {
      key: "commercial_registration",
      header: "Reg. No.",
      className: "flex-1 min-w-0",
      render: (row) => (
        <p className="text-xs text-on-surface-variant font-mono bg-surface-container-high/50 px-2 py-1 rounded-md inline-block">{row.commercial_registration}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "flex-none w-28",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "owner",
      header: "Owner",
      className: "flex-1 min-w-0 hidden md:block",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">
          {row.owner ? `${row.owner.f_name || ""} ${row.owner.l_name || ""}`.trim() : "—"}
        </p>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      className: "flex-none w-32 hidden lg:block",
      render: (row) => (
        <p className="text-xs text-on-surface-variant">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "flex-shrink-0 flex items-center gap-1",
      render: (row) => (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Companies/${row.id}`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/[0.08] text-on-surface-variant hover:text-primary transition-all"
            title={t("common.show")}
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Companies/${row.id}/edit`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/[0.08] text-on-surface-variant hover:text-primary transition-all"
            title={t("common.edit")}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-on-surface-variant hover:text-rose-600 transition-all"
            title={t("common.delete")}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
          <PageHeader icon="business" title={t("companies.title")} description={t("companies.description")} />
          <PageLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
        <PageHeader icon="business" title={t("companies.title")} description={t("companies.description")}>
          <button
            onClick={() => navigate("/Admin/Companies/create")}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t("common.add")}
          </button>
        </PageHeader>

        <div>
          <div className="relative max-w-sm">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("companies.searchPlaceholder")}
              className="w-full bg-surface-container/50 text-on-surface pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          meta={meta}
          onPageChange={setPage}
          loading={loading}
          onLoadMore={() => setPage(p => p + 1)}
          loadingMore={loadingMore}
          emptyIcon="business"
          emptyTitle={t("companies.emptyTitle")}
          emptyDescription={t("companies.emptyDescription")}
        />
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title={t("companies.deleteTitle")}
        message={deleteTarget ? t("companies.deleteMessage", { name: deleteTarget.commercial_name }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        destructive
      />
    </div>
  );
}
