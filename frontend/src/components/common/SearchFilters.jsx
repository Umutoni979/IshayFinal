import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = options.find(o => (o.value ?? o) === value)?.label ?? value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 transition-colors min-w-[120px] justify-between"
      >
        <span>{value ? `${label}: ${activeLabel}` : `All ${label}s`}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-md z-50 overflow-hidden py-1">
          {value && (
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
          {options.map(o => {
            const val    = o.value ?? o;
            const lbl    = o.label ?? o;
            const active = value === val;
            return (
              <button
                key={val}
                onClick={() => { onChange(active ? '' : val); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  active ? 'text-orange-600 bg-orange-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {lbl}
                {active && <Check size={13} className="text-orange-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SearchFilters = ({ search, onSearch, placeholder = 'Search…', filters = [], resultCount }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white focus-within:border-gray-400 transition flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="text-gray-600 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
        />
      </div>

      {filters.map(f => <FilterDropdown key={f.label} {...f} />)}

      {resultCount !== undefined && (
        <span className="text-xs text-gray-600 ml-auto">
          {resultCount === 0 ? 'No results' : `${resultCount} result${resultCount !== 1 ? 's' : ''}`}
        </span>
      )}
    </div>
  </div>
);

export default SearchFilters;
