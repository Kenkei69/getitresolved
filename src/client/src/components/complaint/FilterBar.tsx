import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, Star } from 'lucide-react';
import { CategorySummary, ServiceAreaSummary, DepartmentSummary } from '../../../../shared/types';
import { api } from '../../services/api';

interface FilterBarProps {
  filters: any;
  onChange: (newFilters: any) => void;
  showDepartmentFilter?: boolean;
  showReviewFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  showDepartmentFilter = false,
  showReviewFilter = false,
}) => {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    Promise.all([api.getCategories(), api.getServiceAreas(), api.getDepartments()])
      .then(([cats, areas, depts]) => {
        setCategories(cats);
        setServiceAreas(areas);
        setDepartments(depts);
      })
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: searchInput.trim(), page: 1 });
  };

  const handleReset = () => {
    setSearchInput('');
    onChange({
      page: 1,
      limit: 15,
      sortBy: 'coreScore',
      sortOrder: 'desc',
    });
  };

  const toggleStar = (starKey: string) => {
    const current = filters[starKey] === 'true';
    onChange({
      ...filters,
      [starKey]: current ? undefined : 'true',
      page: 1,
    });
  };

  const hasActiveFilters =
    !!filters.search ||
    !!filters.categoryId ||
    !!filters.serviceAreaId ||
    (showDepartmentFilter && !!filters.departmentId) ||
    !!filters.status ||
    (showReviewFilter && !!filters.reviewState) ||
    filters.starRed === 'true' ||
    filters.starPink === 'true' ||
    filters.starOrange === 'true' ||
    filters.starGreen === 'true' ||
    filters.sortBy !== 'coreScore';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 mb-6">
      {/* Search & Reset Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <label htmlFor="search-complaints" className="sr-only">
            Search complaints
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="search-complaints"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by reference, title, description, or address..."
            className="w-full text-sm pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500 placeholder:text-slate-400 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap self-end sm:self-auto min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
        {/* Status */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-600 mb-1">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value || undefined, page: 1 })}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active (Non-Resolved)</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-semibold text-slate-600 mb-1">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.categoryId || ''}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined, page: 1 })}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Service Area */}
        <div>
          <label htmlFor="filter-ward" className="block text-xs font-semibold text-slate-600 mb-1">
            Service Area / Ward
          </label>
          <select
            id="filter-ward"
            value={filters.serviceAreaId || ''}
            onChange={(e) => onChange({ ...filters, serviceAreaId: e.target.value || undefined, page: 1 })}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
          >
            <option value="">All Service Areas</option>
            {serviceAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department (If admin) */}
        {showDepartmentFilter && (
          <div>
            <label htmlFor="filter-department" className="block text-xs font-semibold text-slate-600 mb-1">
              Department
            </label>
            <select
              id="filter-department"
              value={filters.departmentId || ''}
              onChange={(e) => onChange({ ...filters, departmentId: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            >
              <option value="">All Departments</option>
              <option value="UNASSIGNED">Unassigned (Needs Triage)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Review State (If admin) */}
        {showReviewFilter && (
          <div>
            <label htmlFor="filter-review" className="block text-xs font-semibold text-slate-600 mb-1">
              Review State
            </label>
            <select
              id="filter-review"
              value={filters.reviewState || ''}
              onChange={(e) => onChange({ ...filters, reviewState: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            >
              <option value="">All</option>
              <option value="REQUIRED">Review Required</option>
              <option value="APPROVED">Review Approved</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
          </div>
        )}

        {/* Sort By */}
        <div>
          <label htmlFor="filter-sort" className="block text-xs font-semibold text-slate-600 mb-1">
            Sort Order
          </label>
          <select
            id="filter-sort"
            value={filters.sortBy || 'coreScore'}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value, page: 1 })}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
          >
            <option value="coreScore">Core Score (Impact)</option>
            <option value="urgency">Urgency</option>
            <option value="priority">Priority</option>
            <option value="duration">Age / Duration</option>
            <option value="feasibility">Feasibility</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Star Criteria Toggles Row */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          Filter by Indicator Star (&gt; 7.0):
        </span>

        {/* Red Star Toggle */}
        <button
          type="button"
          onClick={() => toggleStar('starRed')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            filters.starRed === 'true'
              ? 'bg-red-500 text-white border-red-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
          }`}
          title="Filter complaints where Priority strictly exceeds 7.0"
        >
          <span className={filters.starRed === 'true' ? 'text-white' : 'text-priorityRed'}>★</span>
          <span>Priority &gt; 7</span>
        </button>

        {/* Pink Star Toggle */}
        <button
          type="button"
          onClick={() => toggleStar('starPink')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            filters.starPink === 'true'
              ? 'bg-pink-500 text-white border-pink-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'
          }`}
          title="Filter complaints where Duration strictly exceeds 7.0 (at least 24 days unresolved)"
        >
          <span className={filters.starPink === 'true' ? 'text-white' : 'text-durationPink'}>★</span>
          <span>Duration &gt; 7 (Age &ge; 24d)</span>
        </button>

        {/* Orange Star Toggle */}
        <button
          type="button"
          onClick={() => toggleStar('starOrange')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            filters.starOrange === 'true'
              ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
          }`}
          title="Filter complaints where Urgency strictly exceeds 7.0"
        >
          <span className={filters.starOrange === 'true' ? 'text-white' : 'text-urgencyOrange'}>★</span>
          <span>Urgency &gt; 7</span>
        </button>

        {/* Green Star Toggle */}
        <button
          type="button"
          onClick={() => toggleStar('starGreen')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            filters.starGreen === 'true'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
          }`}
          title="Filter complaints where Feasibility strictly exceeds 7.0"
        >
          <span className={filters.starGreen === 'true' ? 'text-white' : 'text-feasibilityGreen'}>★</span>
          <span>Feasibility &gt; 7</span>
        </button>
      </div>
    </div>
  );
};
