import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

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
        className={`flex items-center gap-1.5 border rounded-sm pl-3 pr-2.5 py-1.5 text-sm font-medium transition-colors ${
          value
            ? 'bg-slate-700 text-white border-slate-700'
            : 'bg-white text-slate-700 border-gray-200 hover:border-gray-300'
        }`}
      >
        {value ? `${label}: ${activeLabel}` : label}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-sm shadow-lg z-50 overflow-hidden">
          <ul className="py-1">
            {options.map(o => {
              const val   = o.value ?? o;
              const lbl   = o.label ?? o;
              const active = value === val;
              return (
                <li
                  key={val}
                  onClick={() => { onChange(active ? '' : val); setOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    active ? 'bg-slate-50 text-slate-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 ${active ? 'bg-slate-700 border-slate-700' : 'border-gray-300'}`}>
                    {active && (
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white fill-current">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {lbl}
                </li>
              );
            })}
          </ul>
          {value && (
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SearchFilters = ({ search, onSearch, placeholder = 'Search…', filters = [], resultCount }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 border border-gray-300 rounded-sm px-4 py-2.5 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition mb-3 w-1/2">
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        type="text"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder-gray-400"
      />
    </div>

    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => <FilterDropdown key={f.label} {...f} />)}
      </div>
      {resultCount !== undefined && (
        <span className="text-xs text-gray-400">
          {resultCount === 0 ? 'No results' : `${resultCount} result${resultCount !== 1 ? 's' : ''}`}
        </span>
      )}
    </div>
  </div>
);

export default SearchFilters;
