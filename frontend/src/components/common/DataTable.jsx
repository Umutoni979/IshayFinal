import { useState, useRef } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const DataTable = ({ columns, data, pageSize: defaultPageSize = 10 }) => {
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(defaultPageSize);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);

  const totalPages = Math.ceil(data.length / pageSize);
  const start      = (page - 1) * pageSize;
  const rows       = data.slice(start, start + pageSize);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(f => !f);
  };

  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Build page numbers to show
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
    <div ref={containerRef} className={`bg-white ${fullscreen ? 'fixed inset-0 z-50 overflow-auto p-6' : ''}`}>
      {/* Table toolbar */}
      <div className="flex items-center justify-end px-4 py-2 border border-gray-200 border-b-0 rounded-t-sm bg-gray-50">
        <button
          onClick={toggleFullscreen}
          className="text-gray-400 hover:text-slate-700 transition-colors p-1"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-b-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-2.5 text-gray-600 font-semibold text-xs whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No results found.
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2">
                    {col.render ? col.render(row) : row[col.key] ?? <span className="text-gray-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded text-gray-400 hover:text-slate-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-slate-800 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded text-gray-400 hover:text-slate-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
