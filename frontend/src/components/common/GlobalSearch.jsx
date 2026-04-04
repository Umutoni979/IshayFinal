import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, X, ChevronRight } from 'lucide-react';
import { productionsApi } from '../../api/productionsApi';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { rolesApi } from '../../api/rolesApi';
import { usersApi } from '../../api/usersApi';

const HISTORY_KEY = (userId) => `ishya_search_${userId}`;
const MAX_HISTORY = 10;

const CATEGORIES = {
  productions: { label: 'Production', color: 'bg-violet-100 text-violet-700', path: (item) => `/productions/${item.id}` },
  rehearsals:  { label: 'Rehearsal',  color: 'bg-blue-100 text-blue-700',    path: (item) => `/rehearsals` },
  roles:       { label: 'Role',       color: 'bg-amber-100 text-amber-700',   path: (item) => `/roles` },
  members:     { label: 'Member',     color: 'bg-green-100 text-green-700',   path: (item) => `/members/${item.id}` },
};

const getLabel = (item, category) => {
  if (category === 'productions') return item.title || item.name;
  if (category === 'rehearsals')  return item.title || item.location || `Rehearsal ${item.id}`;
  if (category === 'roles')       return item.name || item.role_name;
  if (category === 'members')     return item.name;
  return item.name || item.title;
};

const getSubLabel = (item, category) => {
  if (category === 'productions') return item.status || item.genre;
  if (category === 'rehearsals')  return item.date ? new Date(item.date).toLocaleDateString() : '';
  if (category === 'roles')       return item.production?.title || '';
  if (category === 'members')     return item.role || item.email || '';
  return '';
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const GlobalSearch = ({ user }) => {
  const navigate = useNavigate();
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY(user?.id))) || []; }
    catch { return []; }
  });
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const debouncedQ   = useDebounce(query, 280);

  // Sync history to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) localStorage.setItem(HISTORY_KEY(user.id), JSON.stringify(history));
  }, [history, user?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search
  useEffect(() => {
    if (!debouncedQ.trim()) { setResults({}); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    const q = debouncedQ.toLowerCase();

    Promise.allSettled([
      productionsApi.getAll(),
      rehearsalsApi.getAll(),
      rolesApi.getAll(),
      usersApi.getAll(),
    ]).then(([prods, reh, roles, members]) => {
      if (cancelled) return;

      const extract = (res, key, fallback = []) =>
        res.status === 'fulfilled' ? (res.value?.data?.data?.[key] || fallback) : fallback;

      const filter = (arr, category) =>
        arr.filter(item => getLabel(item, category)?.toLowerCase().includes(q)).slice(0, 5);

      const allProds   = extract(prods,   'productions');
      const allReh     = extract(reh,     'rehearsals');
      const allRoles   = extract(roles,   'roles');
      const allMembers = extract(members, 'users');

      setResults({
        productions: filter(allProds,   'productions'),
        rehearsals:  filter(allReh,     'rehearsals'),
        roles:       filter(allRoles,   'roles'),
        members:     filter(allMembers, 'members'),
      });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedQ]);

  const addHistory = useCallback((entry) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.label !== entry.label || h.category !== entry.category);
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const removeHistory = (index, e) => {
    e.stopPropagation();
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
  };

  const handleSelect = (item, category) => {
    const label    = getLabel(item, category);
    const path     = CATEGORIES[category].path(item);
    const catLabel = CATEGORIES[category].label;
    addHistory({ label, category: catLabel, path });
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleHistoryClick = (entry) => {
    addHistory(entry); // move to top
    setOpen(false);
    setQuery('');
    navigate(entry.path);
  };

  const totalResults = Object.values(results).reduce((s, a) => s + a.length, 0);
  const showHistory  = open && !query.trim() && history.length > 0;
  const showResults  = open && query.trim().length > 0;
  const showEmpty    = showResults && !loading && totalResults === 0;

  return (
    <div ref={containerRef} className="flex-1 flex justify-center px-4 max-w-2xl mx-auto w-full relative">
      {/* Input */}
      <div className="flex w-full max-w-xl relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search productions, rehearsals, members…"
          className="flex-1 border border-gray-300 rounded-l-full px-5 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults({}); inputRef.current?.focus(); }}
            className="absolute right-[52px] top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="px-5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-colors"
        >
          <Search size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (showHistory || showResults || loading) && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 mx-auto max-w-xl bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">

          {/* Loading */}
          {loading && (
            <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-slate-500 rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {/* Empty */}
          {showEmpty && (
            <div className="px-5 py-6 text-sm text-gray-400 text-center">
              No results for "<span className="text-gray-600 font-medium">{query}</span>"
            </div>
          )}

          {/* Results */}
          {showResults && !loading && totalResults > 0 && (
            <div className="py-2 max-h-[420px] overflow-y-auto">
              {Object.entries(results).map(([category, items]) => {
                if (!items.length) return null;
                const meta = CATEGORIES[category];
                return (
                  <div key={category}>
                    <p className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {meta.label}s
                    </p>
                    {items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item, category)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{getLabel(item, category)}</p>
                          {getSubLabel(item, category) && (
                            <p className="text-xs text-gray-400 truncate">{getSubLabel(item, category)}</p>
                          )}
                        </div>
                        <ChevronRight size={13} className="text-gray-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div className="py-2 max-h-[360px] overflow-y-auto">
              <div className="flex items-center justify-between px-5 pt-2 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent searches</p>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Clear all
                </button>
              </div>
              {history.map((entry, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleHistoryClick(entry)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                >
                  <Clock size={14} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{entry.label}</p>
                    <p className="text-xs text-gray-400">{entry.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeHistory(i, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-gray-500 transition-all"
                  >
                    <X size={12} />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
