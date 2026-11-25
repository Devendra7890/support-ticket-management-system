import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, PlusCircle, RotateCcw, Search, Ticket } from 'lucide-react';
import * as ticketService from '../../services/ticketService';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate } from '../../utils/formatDate';
import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from '../../utils/ticketConstants';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SelectField from '../../components/forms/SelectField';
import TextField from '../../components/forms/TextField';

const INITIAL_FILTERS = {
  search: '',
  status: '',
  priority: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

const TicketsPage = () => {
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

        const response = await ticketService.getTickets(params);
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setFilters((prev) => ({ ...prev, search: nextSearch, page: 1 }));
  };

  const handleReset = () => {
    setSearchInput('');
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--stm-accent)]">
            Tickets
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
            My Tickets
          </h1>
          <p className="mt-2 text-[var(--stm-muted)]">
            Search, filter, and manage the tickets you have submitted.
          </p>
        </div>
        <Link to="/app/tickets/create">
          <Button className="sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            Create ticket
          </Button>
        </Link>
      </div>

      <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-4 sm:p-5">
        <form
          className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto_auto]"
          onSubmit={handleSearchSubmit}
        >
          <TextField
            id="search"
            label="Search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title or description"
          />
          <SelectField
            id="status"
            label="Status"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            options={TICKET_STATUS_OPTIONS}
          />
          <SelectField
            id="priority"
            label="Priority"
            value={filters.priority}
            onChange={(event) => updateFilter('priority', event.target.value)}
            options={TICKET_PRIORITY_OPTIONS}
          />
          <SelectField
            id="sortBy"
            label="Sort by"
            value={filters.sortBy}
            onChange={(event) => updateFilter('sortBy', event.target.value)}
            options={[
              { value: 'createdAt', label: 'Created date' },
              { value: 'updatedAt', label: 'Updated date' },
            ]}
          />
          <SelectField
            id="sortOrder"
            label="Order"
            value={filters.sortOrder}
            onChange={(event) => updateFilter('sortOrder', event.target.value)}
            options={[
              { value: 'desc', label: 'Newest first' },
              { value: 'asc', label: 'Oldest first' },
            ]}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </form>
      </section>

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
          description="Try adjusting filters, or create a new support ticket."
          action={
            <Link to="/app/tickets/create">
              <Button className="sm:w-auto">Create ticket</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && !error && tickets.length > 0 ? (
        <>
          <div className="space-y-3 lg:hidden">
            {tickets.map((ticket) => (
              <Link
                key={ticket._id}
                to={`/app/tickets/${ticket._id}`}
                className="block rounded-3xl border border-[var(--stm-border)] bg-white p-4"
              >
                <p className="font-semibold text-[var(--stm-ink)]">{ticket.title}</p>
                <p className="mt-1 text-xs text-[var(--stm-muted)]">{ticket.category}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <p className="mt-3 text-xs text-[var(--stm-muted)]">
                  Created {formatDate(ticket.createdAt)}
                </p>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-[var(--stm-border)] bg-white lg:block">
            <table className="min-w-full divide-y divide-[var(--stm-border)] text-left text-sm">
              <thead className="bg-slate-50 text-[var(--stm-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--stm-border)]">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/80">
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-[var(--stm-ink)]">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3 text-[var(--stm-muted)]">{ticket.category}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--stm-muted)]">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[var(--stm-muted)]">
                      {formatDate(ticket.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/app/tickets/${ticket._id}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--stm-accent)] hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export default TicketsPage;
