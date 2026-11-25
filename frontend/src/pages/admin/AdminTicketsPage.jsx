import { useEffect, useRef, useState } from 'react';
import { Ticket } from 'lucide-react';
import * as adminTicketService from '../../services/adminTicketService';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getErrorMessage } from '../../utils/errorMessage';
import AdminTicketFilters from '../../components/admin/AdminTicketFilters';
import AdminTicketTable from '../../components/admin/AdminTicketTable';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const INITIAL_FILTERS = {
  search: '',
  status: '',
  priority: '',
  category: '',
  createdBy: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [creatorInput, setCreatorInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  useEffect(() => {
    const nextSearch = debouncedSearch.trim();
    setFilters((prev) => {
      if (prev.search === nextSearch) return prev;
      return { ...prev, search: nextSearch, page: 1 };
    });
  }, [debouncedSearch]);

  useEffect(() => {
    const seq = ++requestSeq.current;
    const loadTickets = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page: filters.page,
          limit: 10,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.category) params.category = filters.category;
        if (filters.createdBy) params.createdBy = filters.createdBy;

        const response = await adminTicketService.getAdminTickets(params);
        if (seq !== requestSeq.current) return;

        setTickets(response.data.tickets || []);
        setPagination(response.data.pagination);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setError(getErrorMessage(err, 'Unable to load tickets.'));
        setTickets([]);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    };

    loadTickets();
  }, [filters]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleReset = () => {
    setSearchInput('');
    setCreatorInput('');
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
          Tickets
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
          All Tickets
        </h1>
        <p className="mt-2 text-[var(--stm-muted)]">
          Search and manage every ticket submitted across the helpdesk.
        </p>
      </div>

      <AdminTicketFilters
        searchInput={searchInput}
        creatorInput={creatorInput}
        filters={filters}
        onSearchInputChange={(event) => setSearchInput(event.target.value)}
        onCreatorInputChange={(event) => setCreatorInput(event.target.value)}
        onFilterChange={updateFilter}
        onSearchSubmit={(event) => {
          event.preventDefault();
          setFilters((prev) => ({
            ...prev,
            search: searchInput.trim(),
            createdBy: creatorInput.trim(),
            page: 1,
          }));
        }}
        onReset={handleReset}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--stm-muted)]">
          Order
          <select
            value={filters.sortOrder}
            onChange={(event) => updateFilter('sortOrder', event.target.value)}
            className="rounded-xl border border-[var(--stm-border)] bg-white px-3 py-2 text-sm text-[var(--stm-ink)]"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-8 text-sm text-[var(--stm-muted)]">
          Loading tickets...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description="Try adjusting your filters or search query."
        />
      ) : null}

      {!loading && !error && tickets.length > 0 ? (
        <>
          <AdminTicketTable tickets={tickets} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--stm-muted)]">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)} ·{' '}
              {pagination.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="sm:w-auto"
                disabled={!pagination.hasPrevPage}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                className="sm:w-auto"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminTicketsPage;
