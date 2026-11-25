import Button from '../common/Button';
import TextField from '../forms/TextField';
import SelectField from '../forms/SelectField';
import {
  ADMIN_CATEGORY_FILTER_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from '../../utils/ticketConstants';
import { RotateCcw, Search } from 'lucide-react';

const AdminTicketFilters = ({
  searchInput,
  creatorInput,
  filters,
  onSearchInputChange,
  onCreatorInputChange,
  onFilterChange,
  onSearchSubmit,
  onReset,
}) => (
  <form
    className="grid gap-4 rounded-3xl border border-[var(--stm-border)] bg-white p-4 sm:p-5 xl:grid-cols-6"
    onSubmit={onSearchSubmit}
  >
    <div className="xl:col-span-2">
      <TextField
        id="search"
        label="Search"
        value={searchInput}
        onChange={onSearchInputChange}
        placeholder="Search title or description"
      />
    </div>
    <SelectField
      id="status"
      label="Status"
      value={filters.status}
      onChange={(event) => onFilterChange('status', event.target.value)}
      options={TICKET_STATUS_OPTIONS}
    />
    <SelectField
      id="priority"
      label="Priority"
      value={filters.priority}
      onChange={(event) => onFilterChange('priority', event.target.value)}
      options={TICKET_PRIORITY_OPTIONS}
    />
    <SelectField
      id="category"
      label="Category"
      value={filters.category}
      onChange={(event) => onFilterChange('category', event.target.value)}
      options={ADMIN_CATEGORY_FILTER_OPTIONS}
    />
    <SelectField
      id="sortBy"
      label="Sort by"
      value={filters.sortBy}
      onChange={(event) => onFilterChange('sortBy', event.target.value)}
      options={[
        { value: 'createdAt', label: 'Created date' },
        { value: 'updatedAt', label: 'Updated date' },
        { value: 'priority', label: 'Priority' },
        { value: 'status', label: 'Status' },
      ]}
    />
    <div className="xl:col-span-2">
      <TextField
        id="createdBy"
        label="Creator ID (optional)"
        value={creatorInput}
        onChange={onCreatorInputChange}
        placeholder="Filter by creator ObjectId"
      />
    </div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end xl:col-span-4">
      <Button type="submit" className="sm:w-auto">
        <Search className="h-4 w-4" />
        Apply filters
      </Button>
      <Button type="button" variant="secondary" className="sm:w-auto" onClick={onReset}>
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  </form>
);

export default AdminTicketFilters;
