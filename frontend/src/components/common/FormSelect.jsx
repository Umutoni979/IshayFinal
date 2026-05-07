import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FormSelect = ({ value, onChange, options = [], placeholder, required, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = options.find(o => String(o.value ?? o) === String(value))?.label ?? value;

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-200 rounded px-3 py-2 text-sm bg-white text-left transition-colors focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        style={{ color: value ? '#1e293b' : '#9ca3af' }}
      >
        <span className="truncate">{activeLabel || placeholder || 'Select…'}</span>
        <ChevronDown size={14} className={`text-gray-600 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {required && (
        <input
          tabIndex={-1}
          required
          value={value ?? ''}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none w-full"
          aria-hidden
        />
      )}

      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-full z-50 overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
        >
          <ul className="py-1.5 max-h-56 overflow-y-auto">
            {options.map((o, i) => {
              const val    = String(o.value ?? o);
              const lbl    = o.label ?? o;
              const active = String(value) === val;
              return (
                <li key={val}>
                  {i > 0 && <div className="mx-3 border-t border-gray-200" />}
                  <button
                    type="button"
                    onClick={() => handleSelect(val)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-left hover:bg-gray-50 transition-colors"
                    style={{ color: active ? '#f97316' : '#374151' }}
                  >
                    {lbl}
                    {active && <Check size={13} className="text-orange-500 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FormSelect;
