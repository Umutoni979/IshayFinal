import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const DataTable = ({ columns, data, pageSize: defaultPageSize = 10 }) => {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sort, setSort]         = useState({ key: null, dir: 'asc' });

  const toggleSort = (key) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
    setPage(1);
  };

  const sorted = [...data].sort((a, b) => {
    if (!sort.key) return 0;
    const av = a[sort.key] ?? '';
    const bv = b[sort.key] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start      = (page - 1) * pageSize;
  const rows       = sorted.slice(start, start + pageSize);

  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="bg-white w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>
          <thead>
            <tr className="border-b-2 border-gray-300">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className={`text-left px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap select-none ${col.sortable !== false ? 'cursor-pointer hover:text-black' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sort.key === col.key
                        ? sort.dir === 'asc'
                          ? <ChevronUp size={13} className="text-orange-500" />
                          : <ChevronDown size={13} className="text-orange-500" />
                        : <ChevronsUpDown size={12} className="text-gray-600" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-600 text-sm">
                  No results found.
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-gray-600 last:border-0 hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2 text-gray-600 text-sm font-bold">
                    {col.render ? col.render(row) : row[col.key] ?? <span className="text-gray-600">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="ml-2 text-gray-600">{start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`e-${i}`} className="px-2 text-gray-600">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
