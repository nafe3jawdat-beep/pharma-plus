import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/admin";
import DataTable from "../common/DataTable";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "patient", label: "Patient" },
  { value: "specialist", label: "Specialist" },
  { value: "scientific_rep", label: "Scientific Rep" },
];

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevPageRef = useRef(1);

  const fetchUsers = useCallback(async () => {
    const isForward = page > prevPageRef.current;
    prevPageRef.current = page;
    if (page === 1) { setLoading(true); setError(null); }
    else setLoadingMore(true);
    try {
      const params = { page, per_page: 15 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (createdFrom) params.created_from = createdFrom;
      if (createdTo) params.created_to = createdTo;
      const res = await adminApi.users.list(params);
      if (page === 1 || !isForward) {
        setUsers(res.data || []);
      } else {
        setUsers(prev => [...prev, ...(res.data || [])]);
      }
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, search, roleFilter, createdFrom, createdTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const selectClass = "bg-surface-container/50 text-on-surface px-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40 border border-surface-container-high/60";

  const columns = [
    {
      key: "name",
      header: "Name",
      className: "flex-[2] min-w-0",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container/50 to-primary-container flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{(row.f_name?.[0] || "") + (row.l_name?.[0] || "")}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">
              {row.f_name} {row.l_name}
            </p>
            <p className="text-xs text-on-surface-variant/60 truncate md:hidden">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "flex-[2] min-w-0 hidden md:block",
      render: (row) => (
        <p className="text-sm text-on-surface-variant truncate">{row.email}</p>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "flex-1 min-w-0",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.roles || []).map((r) => (
            <span
              key={r}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/[0.08] text-primary"
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "flex-1 min-w-0 hidden lg:block",
      render: (row) => (
        <p className="text-sm text-on-surface-variant">{row.phone_number || "—"}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "flex-none w-28",
      render: (row) => <StatusBadge status={row.suspended ? "suspended" : "active"} />,
    },
    {
      key: "actions",
      header: "",
      className: "flex-none w-28",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Users/${row.id}`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/[0.08] text-on-surface-variant hover:text-primary transition-all"
            title="View"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/Admin/Users/${row.id}/edit`); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/[0.08] text-on-surface-variant hover:text-primary transition-all"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-on-surface-variant hover:text-rose-600 transition-all"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-surface relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
          <PageHeader icon="manage_accounts" title="Users" description="Manage all platform users" />
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700 font-medium">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-8">
        <PageHeader icon="manage_accounts" title="Users" description="Manage all platform users">
          <button
            onClick={() => navigate("/Admin/Users/create")}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New User
          </button>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-surface-container/50 text-on-surface pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-on-surface-variant/40"
            />
          </div>

          <select
            value={roleFilter}
            onChange={handleRoleChange}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-on-surface-variant font-semibold">From</label>
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
              className={selectClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-on-surface-variant font-semibold">To</label>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
              className={selectClass}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users}
          meta={meta}
          onPageChange={setPage}
          loading={loading}
          onLoadMore={() => setPage(p => p + 1)}
          loadingMore={loadingMore}
          emptyIcon="manage_accounts"
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search or filter criteria"
        />
      </div>
    </div>
  );
}
