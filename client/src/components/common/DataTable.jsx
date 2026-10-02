import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';

/**
 * Reusable DataTable Architecture for TiffinLink
 *
 * Props:
 * - columns: Array of {
 *     key: string,
 *     label: string,
 *     sortable?: boolean,
 *     align?: 'left' | 'center' | 'right',
 *     width?: string,
 *     render?: (val, row, index) => React.ReactNode
 *   }
 * - data: Array of records
 * - loading: boolean
 * - totalCount?: number (if server-side paginated)
 * - page?: number
 * - pageSize?: number
 * - onPageChange?: (newPage) => void
 * - onPageSizeChange?: (newSize) => void
 * - onSearch?: (query) => void (if server-side search)
 * - onRefresh?: () => void
 * - filters?: Array of {
 *     key: string,
 *     label: string,
 *     value: string,
 *     options: Array<{ value: string, label: string }>,
 *     onChange: (val) => void
 *   }
 * - searchPlaceholder?: string
 * - title?: string
 * - subtitle?: string
 * - exportFileName?: string
 * - emptyMessage?: string
 * - onRowClick?: (row) => void
 * - actions?: React.ReactNode (custom toolbar buttons)
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  totalCount,
  page,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
  filters = [],
  searchPlaceholder = 'Search records...',
  title,
  subtitle,
  exportFileName = 'TiffinLink_Export',
  emptyMessage = 'No records found matching current criteria.',
  onRowClick,
  actions
}) {
  // Client-side search & sort when server-side handlers are not provided
  const isServerPaginated = typeof page === 'number' && typeof onPageChange === 'function';
  const isServerSearch = typeof onSearch === 'function';

  const [clientSearch, setClientSearch] = useState('');
  const [clientSort, setClientSort] = useState({ key: null, direction: 'asc' });
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(pageSize);

  const activePage = isServerPaginated ? page : clientPage;
  const activePageSize = isServerPaginated ? pageSize : clientPageSize;

  const handleSearchChange = (val) => {
    if (isServerSearch) {
      onSearch(val);
    } else {
      setClientSearch(val);
      setClientPage(1);
    }
  };

  const handleSort = (colKey) => {
    setClientSort((prev) => {
      if (prev.key === colKey) {
        return {
          key: colKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: colKey, direction: 'asc' };
    });
  };

  // Process data for client-side search, sort, and pagination
  const processedData = useMemo(() => {
    if (isServerPaginated && isServerSearch) {
      return data;
    }

    let list = [...data];

    // Client-side text filter
    if (!isServerSearch && clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      list = list.filter((row) => {
        return Object.values(row).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Client-side sort
    if (clientSort.key) {
      const { key, direction } = clientSort;
      list.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return direction === 'asc' ? -1 : 1;
        if (strA > strB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [data, clientSearch, clientSort, isServerPaginated, isServerSearch]);

  const totalRecords = isServerPaginated && typeof totalCount === 'number' ? totalCount : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / activePageSize));

  // Current page records
  const displayRows = useMemo(() => {
    if (isServerPaginated) {
      return data;
    }
    const start = (activePage - 1) * activePageSize;
    return processedData.slice(start, start + activePageSize);
  }, [data, processedData, isServerPaginated, activePage, activePageSize]);

  // Page change
  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isServerPaginated) {
      onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = processedData.length > 0 ? processedData : data;
    if (!exportData || exportData.length === 0) return;

    const headers = columns.map((c) => `"${c.label}"`).join(',');
    const rows = exportData.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#ded9d1]/70 shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Header and Toolbar */}
      {(title || subtitle || onRefresh || actions || searchPlaceholder || filters.length > 0) && (
        <div className="p-4 sm:p-5 border-b border-[#ded9d1]/60 bg-[#fbf9f5] flex flex-col gap-4">
          {(title || subtitle || actions || onRefresh) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {title && (
                  <h3 className="font-serif text-lg sm:text-xl text-[#1a1a1a] font-bold tracking-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="font-sans text-xs text-[#665d52] mt-0.5">{subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {actions}

                <button
                  onClick={handleExportCSV}
                  disabled={data.length === 0}
                  className="px-3 py-1.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#ded9d1] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  title="Export to CSV"
                >
                  <FileSpreadsheet size={14} className="text-[#665d52]" />
                  <span>Export CSV</span>
                </button>

                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-1.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] transition-colors border border-[#ded9d1] shadow-2xs"
                    title="Refresh data"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#665d52]" />
              <input
                type="text"
                value={isServerSearch ? undefined : clientSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-[#ded9d1] pl-9 pr-8 py-1.5 font-sans text-xs text-[#1a1a1a] placeholder:text-[#665d52] focus:outline-none focus:border-[#1a1a1a] transition-colors shadow-2xs"
              />
              {!isServerSearch && clientSearch && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#665d52] hover:text-[#1a1a1a]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            {filters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((flt) => (
                  <div
                    key={flt.key}
                    className="flex items-center bg-white px-2.5 py-1.5 border border-[#ded9d1] shadow-2xs gap-1.5"
                  >
                    <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">
                      {flt.label}:
                    </span>
                    <select
                      value={flt.value}
                      onChange={(e) => flt.onChange(e.target.value)}
                      className="bg-transparent font-sans text-xs font-medium text-[#1a1a1a] focus:outline-none cursor-pointer"
                    >
                      {flt.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-[#efeeea] text-[#665d52] uppercase font-mono text-[10px] tracking-wider border-b border-[#ded9d1]/80">
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3.5 px-4 font-semibold ${alignClass} ${
                      col.sortable ? 'cursor-pointer select-none hover:text-[#1a1a1a]' : ''
                    } ${col.className || ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      {col.sortable && (
                        clientSort.key === col.key ? (
                          clientSort.direction === 'asc' ? (
                            <ArrowUp size={12} className="text-[#1a1a1a]" />
                          ) : (
                            <ArrowDown size={12} className="text-[#1a1a1a]" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-[#665d52]/50" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#ded9d1]/40">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-[#665d52]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-[#1a1a1a]" />
                    <span className="font-mono text-xs">Loading records from database...</span>
                  </div>
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-[#665d52]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-medium text-sm text-[#1a1a1a]">{emptyMessage}</span>
                    <span className="font-mono text-xs text-[#665d52]">
                      Try clearing search queries or adjusting filters.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              displayRows.map((row, rowIdx) => (
                <tr
                  key={row._id || row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-[#f5f3ef]/80 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    const rawVal = row[col.key];

                    return (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 ${alignClass} ${col.className || ''}`}
                      >
                        {col.render ? col.render(rawVal, row, rowIdx) : (rawVal !== undefined && rawVal !== null ? String(rawVal) : '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer summary */}
      <div className="p-3.5 bg-[#fbf9f5] border-t border-[#ded9d1]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#665d52] font-mono">
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-[#1a1a1a]">
              {totalRecords === 0 ? 0 : (activePage - 1) * activePageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-[#1a1a1a]">
              {Math.min(totalRecords, activePage * activePageSize)}
            </strong>{' '}
            of <strong className="text-[#1a1a1a]">{totalRecords}</strong> records
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-[#ded9d1]">
            <span className="text-[11px] text-[#665d52]">Per page:</span>
            <select
              value={activePageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (isServerPaginated && onPageSizeChange) {
                  onPageSizeChange(newSize);
                } else {
                  setClientPageSize(newSize);
                  setClientPage(1);
                }
              }}
              className="bg-white border border-[#ded9d1] text-[#1a1a1a] px-2 py-0.5 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Navigation Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => changePage(activePage - 1)}
            disabled={activePage <= 1 || loading}
            className="p-1.5 bg-white border border-[#ded9d1] hover:bg-[#efeeea] text-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="px-3 py-1 font-mono text-xs bg-white border border-[#ded9d1] text-[#1a1a1a] font-semibold">
            Page {activePage} of {totalPages}
          </span>

          <button
            onClick={() => changePage(activePage + 1)}
            disabled={activePage >= totalPages || loading}
            className="p-1.5 bg-white border border-[#ded9d1] hover:bg-[#efeeea] text-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
