import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionsApi } from '../../api/productionsApi';
import { formatDate } from '../../utils/formatDate';
import usePermission from '../../hooks/usePermission';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, Circle, Clock, ChevronRight,
  CalendarDays, Users, FileText, Clapperboard,
  Plus, Pencil, Trash2, Save, BarChart3,
  Shirt, Package, Building2, Star, Layers,
} from 'lucide-react';
import { DetailSkeleton } from '../../components/common/Skeleton';

// ─── Constants ────────────────────────────────────────────────

const MILESTONE_CATEGORY_ICON = {
  costumes:    Shirt,
  props:       Package,
  venue:       Building2,
  performance: Star,
  other:       Layers,
};

const MILESTONE_STATUS_COLOR = {
  pending:     'text-gray-300',
  in_progress: 'text-orange-500',
  completed:   'text-green-500',
};

const EVENT_TYPE_LABEL = {
  meeting:         'Meeting',
  fitting:         'Fitting',
  venue_visit:     'Venue Visit',
  technical:       'Technical',
  dress_rehearsal: 'Dress Rehearsal',
  other:           'Other',
};

const EVENT_TYPE_COLOR = {
  meeting:         'bg-orange-100 text-orange-700',
  fitting:         'bg-pink-100 text-pink-700',
  venue_visit:     'bg-orange-100 text-orange-700',
  technical:       'bg-orange-100 text-orange-700',
  dress_rehearsal: 'bg-orange-100 text-orange-700',
  other:           'bg-gray-100 text-gray-600',
};

const attendanceColor = (rate) => {
  if (rate === null || rate === undefined) return 'text-gray-400';
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-orange-500';
  return 'text-red-500';
};

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

// ─── Timeline constants ───────────────────────────────────────

const CATEGORY_LABEL = {
  costumes:    'Costumes & Clothing',
  props:       'Props & Materials',
  venue:       'Venue & Hall',
  performance: 'Performance',
  other:       'General',
};

const CATEGORY_DESC = {
  costumes:    'All costumes, wigs and clothing must be confirmed and fitted.',
  props:       'All physical props and materials required for the production.',
  venue:       'Hall booking, stage setup and technical infrastructure.',
  performance: 'Final rehearsals, dress run and day-of-performance readiness.',
  other:       'Additional preparation tasks for this production.',
};

// ─── Stepper circle components ────────────────────────────────

// Parent group circle — matches the screenshot exactly
const ParentCircle = ({ status }) => {
  // Completed: solid indigo fill + white tick
  if (status === 'completed') {
    return (
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  // Active/in_progress: partial indigo arc top-left, rest light grey, dot inside
  if (status === 'in_progress') {
    const r = 9; const cx = 11; const cy = 11; const circ = 2 * Math.PI * r;
    return (
      <span style={{ width: 22, height: 22, position: 'relative', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', inset: 0 }}>
          {/* full light ring */}
          <circle cx={cx} cy={cy} r={r} fill="white" stroke="#ffedd5" strokeWidth="2"/>
          {/* indigo arc ~1/3 of circle, from top going clockwise */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth="2"
            strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}/>
        </svg>
        {/* inner dot */}
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }}/>
        </span>
      </span>
    );
  }
  // Pending: dashed border circle
  return (
    <span style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      border: '2px dashed #cbd5e1', background: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1' }}/>
    </span>
  );
};

// Sub-step circle — small solid dot like the screenshot sub-items
const SubCircle = ({ status, active }) => {
  if (status === 'completed') {
    return (
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
          <path d="M1 3l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (active) {
    // active sub-step = solid indigo, larger
    return <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', flexShrink: 0 }}/>;
  }
  // inactive sub-step = grey solid
  return <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }}/>;
};

// ─── Tab 1: Timeline ──────────────────────────────────────────

const TimelineTab = ({ productionId, canManage }) => {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [editMode,   setEditMode]   = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState({ title: '', category: 'other', due_date: '', notes: '' });

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', productionId],
    queryFn:  () => productionsApi.getMilestones(productionId).then(r => r.data.data.milestones),
  });

  const invalidate = () => qc.invalidateQueries(['milestones', productionId]);

  const cycleMutation = useMutation({
    mutationFn: ({ mid, status }) => productionsApi.updateMilestone(productionId, mid, { status }),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ mid, data }) => productionsApi.updateMilestone(productionId, mid, data),
    onSuccess: () => { invalidate(); setEditMode(false); toast.success('Updated'); },
    onError: () => toast.error('Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn: (mid) => productionsApi.deleteMilestone(productionId, mid),
    onSuccess: () => { invalidate(); setSelectedId(null); toast.success('Removed'); },
    onError: () => toast.error('Failed to delete'),
  });
  const createMutation = useMutation({
    mutationFn: (data) => productionsApi.createMilestone(productionId, data),
    onSuccess: () => { invalidate(); setShowAdd(false); setForm({ title: '', category: 'other', due_date: '', notes: '' }); toast.success('Milestone added'); },
    onError: () => toast.error('Failed to add milestone'),
  });

  // Group milestones by category in their order
  const catOrder = [];
  const catSeen  = new Set();
  milestones.forEach(m => { if (!catSeen.has(m.category)) { catSeen.add(m.category); catOrder.push(m.category); } });
  const byCategory = catOrder.map(cat => ({ cat, items: milestones.filter(m => m.category === cat) }));

  const groupStatus = (items) => {
    if (items.every(m => m.status === 'completed'))  return 'completed';
    if (items.some(m => m.status !== 'pending'))     return 'in_progress';
    return 'pending';
  };

  // Auto-select first non-completed milestone on load
  const firstActive = milestones.find(m => m.status !== 'completed') || milestones[0];
  const selected    = milestones.find(m => m.id === selectedId) || firstActive;

  // Which group is "active" = the group containing the selected milestone
  const activeGroup = selected ? byCategory.find(g => g.items.some(m => m.id === selected?.id)) : null;

  const completed = milestones.filter(m => m.status === 'completed').length;
  const progress  = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  const seedMutation = useMutation({
    mutationFn: () => productionsApi.seedMilestones(productionId),
    onSuccess: () => { invalidate(); toast.success('Default milestones created!'); },
    onError: () => toast.error('Failed to seed milestones'),
  });

  if (isLoading) return <div className="text-gray-400 text-sm py-12 text-center">Loading…</div>;

  if (!milestones.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 size={20} color="#cbd5e1" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600 mb-1">No milestones yet</p>
        <p className="text-xs text-gray-400">Load the default checklist or add your own milestones.</p>
      </div>
      {canManage && (
        <div className="flex gap-3">
          <button
            disabled={seedMutation.isPending}
            onClick={() => seedMutation.mutate()}
            style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: seedMutation.isPending ? 0.7 : 1 }}
          >
            {seedMutation.isPending ? 'Creating…' : '+ Load Default Milestones'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Custom    
          </button>
        </div>
      )}
      {showAdd && (
        <div style={{ width: '100%', maxWidth: 440, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Milestone title *" autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {Object.keys(MILESTONE_CATEGORY_ICON).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
              <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
            </div>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Notes (optional)" style={{ resize: 'none' }}/>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium">Cancel</button>
              <button disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate(form)}
                style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!form.title || createMutation.isPending) ? 0.5 : 1, padding: '8px 0' }}>
                {createMutation.isPending ? 'Adding…' : 'Add Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-[520px] gap-0">

      {/* ══ LEFT STEPPER PANEL ══════════════════════════════════ */}
      <div style={{ width: 256, minWidth: 256, borderRight: '1px solid #f1f5f9', paddingRight: 24, paddingTop: 4 }}>

        {byCategory.map(({ cat, items }, gi) => {
          const gs     = groupStatus(items);
          const isLast = gi === byCategory.length - 1;
          const isOpen = activeGroup?.cat === cat;

          return (
            <div key={cat} style={{ display: 'flex', gap: 0 }}>
              {/* Rail column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, minWidth: 22 }}>
                <ParentCircle status={gs} />
                {!isLast && (
                  <div style={{
                    flex: 1, width: 1, marginTop: 4,
                    borderLeft: gs === 'completed' ? '2px solid #c7d2fe' : '2px dashed #e2e8f0',
                    minHeight: isOpen ? (items.length * 28 + 8) : 28,
                  }}/>
                )}
              </div>

              {/* Content column */}
              <div style={{ marginLeft: 12, paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                {/* Group label */}
                <div
                  style={{ cursor: 'pointer', paddingTop: 1 }}
                  onClick={() => { const first = items[0]; if (first) setSelectedId(first.id); setEditMode(false); }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: gs === 'in_progress' ? '#f97316' : gs === 'completed' ? '#0f172a' : '#94a3b8',
                  }}>
                    {CATEGORY_LABEL[cat] || cat}
                  </span>
                </div>

                {/* Sub-items — only shown when this group is open */}
                {isOpen && (
                  <div style={{ marginTop: 8 }}>
                    {items.map((m, mi) => {
                      const isActiveSub = selected?.id === m.id;
                      const isLastSub   = mi === items.length - 1;
                      return (
                        <div key={m.id} style={{ display: 'flex', gap: 0 }}>
                          {/* Sub rail */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, minWidth: 10 }}>
                            <SubCircle status={m.status} active={isActiveSub} />
                            {!isLastSub && (
                              <div style={{ flex: 1, width: 1, borderLeft: '2px dashed #e2e8f0', minHeight: 12, marginTop: 2 }}/>
                            )}
                          </div>
                          {/* Sub label */}
                          <button
                            onClick={() => { setSelectedId(m.id); setEditMode(false); }}
                            style={{
                              marginLeft: 10, paddingBottom: isLastSub ? 0 : 10,
                              fontSize: 13, fontWeight: isActiveSub ? 600 : 400, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                              color: m.status === 'completed' ? '#94a3b8' : isActiveSub ? '#f97316' : '#64748b',
                              textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                            }}
                          >
                            {m.title}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add milestone */}
        {canManage && (
          <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
            <div style={{ width: 22, minWidth: 22, display: 'flex', justifyContent: 'center' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={11} color="#cbd5e1"/>
              </span>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{ marginLeft: 12, fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 2 }}
            >
              Add milestone
            </button>
          </div>
        )}
      </div>

      {/* ══ RIGHT DETAIL PANEL ══════════════════════════════════ */}
      <div style={{ flex: 1, paddingLeft: 40, paddingTop: 4, display: 'flex', flexDirection: 'column' }}>

        {/* ── Add milestone form (shown above detail when open) ── */}
        {showAdd && (
          <div style={{ marginBottom: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>New Milestone</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className={inputCls} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Milestone title *" autoFocus />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {Object.keys(MILESTONE_CATEGORY_ICON).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
                <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
              </div>
              <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Notes (optional)" style={{ resize: 'none' }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium">Cancel</button>
                <button disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate(form)}
                  style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!form.title || createMutation.isPending) ? 0.5 : 1 }}>
                  {createMutation.isPending ? 'Adding…' : 'Add Milestone'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selected && !showAdd && (
          editMode ? (
            /* ── Edit form ── */
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Edit Milestone</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className={labelCls}>Title</label>
                  <input className={inputCls} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} autoFocus />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                      {Object.keys(MILESTONE_CATEGORY_ICON).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea className={inputCls} rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} style={{ resize: 'none' }}/>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setEditMode(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium">Cancel</button>
                  <button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ mid: selected.id, data: form })}
                    style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: updateMutation.isPending ? 0.6 : 1 }}>
                    {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── View / action panel ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {CATEGORY_LABEL[selected.category] || selected.category}
                </p>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: '0 0 10px 0' }}>
                  {selected.title}
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  {selected.notes || CATEGORY_DESC[selected.category] || 'No additional notes for this milestone.'}
                </p>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                {/* Status badge */}
                <div style={{ background: selected.status === 'completed' ? '#f0fdf4' : selected.status === 'in_progress' ? '#eef2ff' : '#f8fafc', border: `1px solid ${selected.status === 'completed' ? '#bbf7d0' : selected.status === 'in_progress' ? '#c7d2fe' : '#e2e8f0'}`, borderRadius: 20, padding: '4px 12px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selected.status === 'completed' ? '#16a34a' : selected.status === 'in_progress' ? '#f97316' : '#94a3b8' }}>
                    {selected.status === 'in_progress' ? 'In Progress' : selected.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                {selected.due_date && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Due {formatDate(selected.due_date)}</span>
                  </div>
                )}
                {selected.completed_at && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 12px' }}>
                    <span style={{ fontSize: 12, color: '#16a34a' }}>Done {new Date(selected.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }}/>

              {/* Action buttons — at the bottom like the screenshot */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                {canManage && selected.status !== 'completed' && (
                  <button
                    disabled={cycleMutation.isPending}
                    onClick={() => {
                      const next = { pending: 'in_progress', in_progress: 'completed' };
                      cycleMutation.mutate({ mid: selected.id, status: next[selected.status] });
                    }}
                    className="w-full bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors mb-2 disabled:opacity-60"
                  >
                    {cycleMutation.isPending ? 'Updating…' : selected.status === 'pending' ? 'Mark as In Progress' : 'Mark as Complete'}
                  </button>
                )}
                {canManage && selected.status === 'completed' && (
                  <button
                    onClick={() => cycleMutation.mutate({ mid: selected.id, status: 'pending' })}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded transition-colors mb-2"
                  >
                    Reopen Milestone
                  </button>
                )}
                {canManage && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setForm({ title: selected.title, category: selected.category, due_date: selected.due_date||'', notes: selected.notes||'' }); setEditMode(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      <Pencil size={12}/> Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(selected.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      <Trash2 size={12}/> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ─── Tab 2: Attendance ────────────────────────────────────────

const AttendanceTab = ({ productionId }) => {
  const [openId, setOpenId] = useState(null);

  const { data: rehearsals = [], isLoading } = useQuery({
    queryKey: ['rehearsal-attendance', productionId],
    queryFn:  () => productionsApi.getRehearsalAttendance(productionId).then(r => r.data.data.rehearsals),
  });

  if (isLoading) return <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>;
  if (!rehearsals.length) return <div className="text-center py-16 text-gray-400 text-sm">No rehearsals for this production yet.</div>;

  const totalPresent = rehearsals.reduce((s, r) => s + r.counts.present + r.counts.late, 0);
  const totalRecords = rehearsals.reduce((s, r) => s + r.total, 0);
  const overallRate  = totalRecords > 0 ? Math.round(totalPresent / totalRecords * 100) : null;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Rehearsals',     value: rehearsals.length,                                                  color: 'text-slate-800' },
          { label: 'Attendance Rate', value: overallRate !== null ? `${overallRate}%` : '—',                    color: attendanceColor(overallRate) },
          { label: 'Total Present',  value: totalPresent,                                                        color: 'text-green-600' },
          { label: 'Total Absent',   value: rehearsals.reduce((s, r) => s + r.counts.absent, 0),                color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Rehearsal rows */}
      <div className="space-y-2">
        {rehearsals.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setOpenId(openId === r.id ? null : r.id)}
            >
              <CalendarDays size={15} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                <p className="text-xs text-gray-400">{formatDate(r.date)} · {r.rehearsal_type?.replace('_',' ')}{r.location ? ` · ${r.location}` : ''}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="text-green-600">{r.counts.present}P</span>
                  <span className="text-red-500">{r.counts.absent}A</span>
                  <span className="text-orange-500">{r.counts.late}L</span>
                  <span className="text-gray-400">{r.counts.excused}E</span>
                </div>
                {r.attendance_rate !== null && (
                  <span className={`text-sm font-bold w-10 text-right ${attendanceColor(r.attendance_rate)}`}>{r.attendance_rate}%</span>
                )}
                <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${openId === r.id ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {openId === r.id && (
              <div className="border-t border-gray-100 px-4 py-3">
                {!r.records.length ? (
                  <p className="text-xs text-gray-400 py-1">No attendance records marked yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {r.records.map(rec => (
                      <div key={rec.id} className="flex items-center gap-2 py-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          rec.status === 'present' ? 'bg-green-500' :
                          rec.status === 'late'    ? 'bg-orange-400' :
                          rec.status === 'excused' ? 'bg-gray-400'  : 'bg-red-400'
                        }`} />
                        <span className="text-xs text-slate-700 flex-1 truncate">{rec.member?.name || '—'}</span>
                        <span className="text-xs capitalize text-gray-500 shrink-0">{rec.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 3: Events ────────────────────────────────────────────

const EMPTY_EVENT = { title: '', description: '', event_date: '', event_time: '', event_type: 'other', status: 'scheduled' };

const EventsTab = ({ productionId, canManage }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY_EVENT);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['production-events', productionId],
    queryFn:  () => productionsApi.getEvents(productionId).then(r => r.data.data.events),
  });

  const invalidate = () => qc.invalidateQueries(['production-events', productionId]);

  const createMutation = useMutation({
    mutationFn: (data) => productionsApi.createEvent(productionId, data),
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_EVENT); toast.success('Event logged'); },
    onError: () => toast.error('Failed to add event'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ eid, data }) => productionsApi.updateEvent(productionId, eid, data),
    onSuccess: () => { invalidate(); setEditId(null); toast.success('Event updated'); },
    onError: () => toast.error('Failed to update event'),
  });

  const deleteMutation = useMutation({
    mutationFn: (eid) => productionsApi.deleteEvent(productionId, eid),
    onSuccess: () => { invalidate(); toast.success('Event deleted'); },
    onError: () => toast.error('Failed to delete event'),
  });

  const renderForm = (onSave, onCancel, saving) => (
    <div className="bg-white border border-dashed border-slate-400 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Event title" autoFocus />
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" className={inputCls} value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="time" className={inputCls} value={form.event_time} onChange={e => setForm(f => ({...f, event_time: e.target.value}))} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))}>
            {Object.entries(EVENT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional details…" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium">Cancel</button>
        <button disabled={!form.title || !form.event_date || saving} onClick={onSave}
          className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white py-1.5 rounded text-xs font-medium">
          {saving ? 'Saving…' : 'Save Event'}
        </button>
      </div>
    </div>
  );

  if (isLoading) return <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>;

  return (
    <div className="space-y-2">
      {!events.length && !showForm && (
        <div className="text-center py-12 text-gray-400 text-sm">No events logged for this production.</div>
      )}

      {events.map(ev => (
        editId === ev.id ? (
          <div key={ev.id}>
            {renderForm(
              () => updateMutation.mutate({ eid: ev.id, data: form }),
              () => setEditId(null),
              updateMutation.isPending
            )}
          </div>
        ) : (
          <div key={ev.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 items-start">
            <div className="w-10 text-center shrink-0 bg-slate-50 rounded-lg py-1.5">
              <p className="text-base font-black text-slate-800 leading-none">{new Date(ev.event_date+'T00:00:00').getDate()}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{new Date(ev.event_date+'T00:00:00').toLocaleString('default',{month:'short'})}</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">{ev.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${EVENT_TYPE_COLOR[ev.event_type] || 'bg-gray-100 text-gray-600'}`}>
                  {EVENT_TYPE_LABEL[ev.event_type]}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                  ev.status === 'completed' ? 'bg-green-100 text-green-700' :
                  ev.status === 'cancelled' ? 'bg-red-100 text-red-500'    : 'bg-orange-100 text-orange-700'
                }`}>{ev.status}</span>
              </div>
              {ev.event_time  && <p className="text-xs text-gray-400">{ev.event_time.slice(0,5)}</p>}
              {ev.description && <p className="text-xs text-gray-500 mt-1">{ev.description}</p>}
              {ev.created_by  && <p className="text-[11px] text-gray-400 mt-1">Logged by {ev.created_by.name}</p>}
            </div>
            {canManage && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditId(ev.id); setForm({ title: ev.title, description: ev.description||'', event_date: ev.event_date, event_time: ev.event_time||'', event_type: ev.event_type, status: ev.status }); }}
                  className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteMutation.mutate(ev.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        )
      ))}

      {canManage && (
        showForm
          ? renderForm(() => createMutation.mutate(form), () => { setShowForm(false); setForm(EMPTY_EVENT); }, createMutation.isPending)
          : (
            <button onClick={() => setShowForm(true)}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 mt-1">
              <Plus size={13} /> Log Event
            </button>
          )
      )}
    </div>
  );
};

// ─── Tab 4: Performance Report ────────────────────────────────

const EMPTY_REPORT = { performance_date: '', venue: '', audience_count: '', summary: '', outcomes: '', observations: '' };

const ReportTab = ({ productionId, production, canManage }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(EMPTY_REPORT);

  const { data: report, isLoading } = useQuery({
    queryKey: ['performance-report', productionId],
    queryFn:  () => productionsApi.getPerformanceReport(productionId).then(r => r.data.data.report),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => productionsApi.savePerformanceReport(productionId, data),
    onSuccess: () => { qc.invalidateQueries(['performance-report', productionId]); setEditing(false); toast.success('Report saved!'); },
    onError: () => toast.error('Failed to save report'),
  });

  const startEdit = () => {
    setForm(report
      ? { performance_date: report.performance_date||'', venue: report.venue||'', audience_count: report.audience_count||'', summary: report.summary||'', outcomes: report.outcomes||'', observations: report.observations||'' }
      : { ...EMPTY_REPORT, performance_date: production?.end_date||'', venue: production?.venue||'' }
    );
    setEditing(true);
  };

  if (isLoading) return <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>;

  if (editing || (!report && canManage)) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Performance Report</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Performance Date</label>
            <input type="date" className={inputCls} value={form.performance_date} onChange={e => setForm(f => ({...f, performance_date: e.target.value}))} />
          </div>
          <div>
            <label className={labelCls}>Venue</label>
            <input className={inputCls} value={form.venue} onChange={e => setForm(f => ({...f, venue: e.target.value}))} placeholder="e.g. Grand Theatre Hall" />
          </div>
          <div>
            <label className={labelCls}>Audience Count</label>
            <input type="number" min="0" className={inputCls} value={form.audience_count} onChange={e => setForm(f => ({...f, audience_count: e.target.value}))} placeholder="0" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Summary</label>
          <textarea className={inputCls} rows={3} value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} placeholder="How did the performance go overall?" />
        </div>
        <div>
          <label className={labelCls}>Outcomes</label>
          <textarea className={inputCls} rows={3} value={form.outcomes} onChange={e => setForm(f => ({...f, outcomes: e.target.value}))} placeholder="What was achieved? Positive highlights…" />
        </div>
        <div>
          <label className={labelCls}>Observations & Improvements</label>
          <textarea className={inputCls} rows={3} value={form.observations} onChange={e => setForm(f => ({...f, observations: e.target.value}))} placeholder="Areas to improve for next time…" />
        </div>
        <div className="flex gap-2 pt-1">
          {report && <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium">Cancel</button>}
          <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}
            className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2">
            <Save size={14} /> {saveMutation.isPending ? 'Saving…' : 'Save Report'}
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 text-gray-400">
        <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No performance report yet</p>
        <p className="text-xs mt-1 text-gray-300">Report will be filled in after the performance</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Performance Report</h3>
          {report.created_by && <p className="text-xs text-gray-400 mt-0.5">Filed by {report.created_by.name}</p>}
        </div>
        {canManage && (
          <button onClick={startEdit}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 border border-gray-200 px-3 py-1.5 rounded transition-colors">
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Performance Date', value: report.performance_date ? formatDate(report.performance_date) : '—' },
          { label: 'Venue',           value: report.venue || '—' },
          { label: 'Audience',        value: report.audience_count ? `${report.audience_count} people` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {[
        { label: 'Summary',                      value: report.summary },
        { label: 'Outcomes',                     value: report.outcomes },
        { label: 'Observations & Improvements',  value: report.observations },
      ].filter(s => s.value).map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{value}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const TABS = [
  { key: 'timeline',   label: 'Timeline',    icon: CheckCircle2 },
  { key: 'attendance', label: 'Attendance',  icon: Users },
  { key: 'events',     label: 'Events',      icon: CalendarDays },
  { key: 'report',     label: 'Perf. Report', icon: FileText },
];

const STATUS_BADGE = {
  planning:  'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-600',
};

const ProductionDetailPage = () => {
  const { id }      = useParams();
  const [tab, setTab] = useState('timeline');
  const canWrite    = usePermission('productions:write');
  const canCoord    = usePermission('rehearsals:write');
  const canManage   = canWrite || canCoord;

  const { data: production, isLoading } = useQuery({
    queryKey: ['production', id],
    queryFn:  () => productionsApi.getById(id).then(r => r.data.data.production),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', id],
    queryFn:  () => productionsApi.getMilestones(id).then(r => r.data.data.milestones),
    enabled:  !!id,
  });

  const allMilestonesDone = milestones.length > 0 && milestones.every(m => m.status === 'completed');

  if (isLoading) return <DetailSkeleton />;
  if (!production) return <div className="text-red-500 text-sm">Production not found.</div>;

  const badgeCls = STATUS_BADGE[production.status] || 'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-4xl">
     

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Clapperboard size={16} className="text-slate-500 shrink-0" />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${badgeCls}`}>{production.status}</span>
        </div>
        <h1 className="text-2xl font-normal text-slate-800 leading-tight mb-2">{production.title}</h1>
        {production.description && <p className="text-sm text-gray-500 mb-4">{production.description}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          {production.director   && <span><span className="font-medium text-gray-700">Director:</span> {production.director.name}</span>}
          {production.venue      && <span><span className="font-medium text-gray-700">Venue:</span> {production.venue}</span>}
          {production.start_date && <span><span className="font-medium text-gray-700">Dates:</span> {formatDate(production.start_date)}{production.end_date ? ` → ${formatDate(production.end_date)}` : ''}</span>}
          <span><span className="font-medium text-gray-700">Roles:</span> {production.Roles?.length ?? 0}</span>
          <span><span className="font-medium text-gray-700">Rehearsals:</span> {production.Rehearsals?.length ?? 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const isReportLocked = t.key === 'report' && !allMilestonesDone;
          return (
            <button key={t.key}
              onClick={() => !isReportLocked && setTab(t.key)}
              disabled={isReportLocked}
              title={isReportLocked ? 'Complete all milestones first' : undefined}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isReportLocked
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : tab === t.key
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <Icon size={14} />
              {t.label}
              {isReportLocked && <span className="ml-1 text-[10px] text-gray-300">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'timeline'   && <TimelineTab   productionId={id} canManage={canManage} />}
      {tab === 'attendance' && <AttendanceTab  productionId={id} />}
      {tab === 'events'     && <EventsTab      productionId={id} canManage={canManage} />}
      {tab === 'report'     && <ReportTab      productionId={id} production={production} canManage={canManage} />}
    </div>
  );
};

export default ProductionDetailPage;
