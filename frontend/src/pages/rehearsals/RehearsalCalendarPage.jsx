import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { productionsApi } from '../../api/productionsApi';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_FORM = {
  production_id: '', title: '', date: '', start_time: '', end_time: '',
  location: '', rehearsal_type: 'full', notes: '', recurrence: 'once',
  repeat_until: '', days_of_week: [], checkin_closes_at: '',
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';

const RehearsalCalendarPage = () => {
  const canWrite = usePermission('rehearsals:write');
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: rehearsals = [] } = useQuery({
    queryKey: ['rehearsals'],
    queryFn: () => rehearsalsApi.getAll().then(r => r.data.data.rehearsals),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => productionsApi.getAll().then(r => r.data.data.productions),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: (data) => rehearsalsApi.create(data),
    onSuccess: async (res, variables) => {
      queryClient.invalidateQueries(['rehearsals']);
      const created = res.data.data.rehearsal;
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(count > 1 ? `${count} sessions scheduled!` : 'Rehearsal scheduled!');
      setShowCreate(false);
      setForm(EMPTY_FORM);

      // auto-advance production planning → active
      try {
        const pid = variables.production_id;
        const prod = await productionsApi.getById(pid);
        if (prod.data.data.production.status === 'planning') {
          await productionsApi.update(pid, { status: 'active' });
          queryClient.invalidateQueries(['productions']);
          queryClient.invalidateQueries(['production', pid]);
        }
      } catch (_) {}
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create rehearsal'),
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleDateClick = (info) => {
    if (!canWrite) return;
    setForm(f => ({ ...f, date: info.dateStr }));
    setShowCreate(true);
  };

  const events = rehearsals.map(r => ({
    id: r.id, title: r.title,
    start: `${r.date}T${r.start_time}`,
    end:   `${r.date}T${r.end_time}`,
    extendedProps: { location: r.location, type: r.rehearsal_type },
  }));

  return (
    <div>
      {showCreate ? (
        /* ── Inline Schedule Form ── */
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-slate-800">Schedule Rehearsal</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const payload = { ...form };
              if (payload.recurrence === 'once') { delete payload.repeat_until; delete payload.days_of_week; }
              if (payload.recurrence !== 'weekly') delete payload.days_of_week;
              createMutation.mutate(payload);
            }}
          >
            <div className="border-t border-gray-100">
              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Production <span className="text-red-400">*</span></span>
                <select required value={form.production_id} onChange={set('production_id')} className={inputCls}>
                  <option value="">Select a production…</option>
                  {productions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Title <span className="text-red-400">*</span></span>
                <input required value={form.title} onChange={set('title')} placeholder="e.g. Act 1 Run-through" className={inputCls} />
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Date <span className="text-red-400">*</span></span>
                <input required type="date" value={form.date} onChange={set('date')} className={inputCls} />
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Start <span className="text-red-400">*</span></span>
                <input required type="time" value={form.start_time} onChange={set('start_time')} className={inputCls} />
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">End <span className="text-red-400">*</span></span>
                <input required type="time" value={form.end_time} onChange={set('end_time')} className={inputCls} />
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Location</span>
                <input value={form.location} onChange={set('location')} placeholder="e.g. Main Hall" className={inputCls} />
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Type</span>
                <select value={form.rehearsal_type} onChange={set('rehearsal_type')} className={inputCls}>
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="technical">Technical</option>
                  <option value="dress">Dress</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Repeat</span>
                <select value={form.recurrence} onChange={set('recurrence')} className={inputCls}>
                  <option value="once">Once (single session)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (pick days)</option>
                  <option value="monthly">Monthly (same day)</option>
                </select>
              </div>

              {form.recurrence !== 'once' && (
                <div className="flex items-start py-4 border-b border-gray-100">
                  <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Repeat Until <span className="text-red-400">*</span></span>
                  <input required type="date" value={form.repeat_until} onChange={set('repeat_until')} className={inputCls} />
                </div>
              )}

              {form.recurrence === 'weekly' && (
                <div className="flex items-start py-4 border-b border-gray-100">
                  <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Days <span className="text-red-400">*</span></span>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button key={i} type="button"
                        onClick={() => {
                          const next = form.days_of_week.includes(i)
                            ? form.days_of_week.filter(d => d !== i)
                            : [...form.days_of_week, i];
                          setForm(f => ({ ...f, days_of_week: next }));
                        }}
                        className={`w-10 h-10 rounded-full text-xs font-semibold border transition-colors
                          ${form.days_of_week.includes(i)
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white text-gray-500 border-gray-300 hover:border-slate-400'}`}
                      >{day}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start py-4 border-b border-gray-100">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">
                  Check-in Closes At
                  <span className="block text-gray-400 font-normal text-xs">optional</span>
                </span>
                <div className="flex-1">
                  <input type="time" value={form.checkin_closes_at} onChange={set('checkin_closes_at')} className={inputCls} />
                  <p className="text-xs text-gray-400 mt-1.5">After this time members can no longer check themselves in. Leave empty for no cutoff.</p>
                </div>
              </div>

              <div className="flex items-start py-4">
                <span className="w-44 shrink-0 text-sm font-bold text-slate-700 pt-2">Notes</span>
                <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes…"
                  className={`${inputCls} resize-none`} />
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
                {createMutation.isPending ? 'Saving…' : 'Schedule Rehearsal'}
              </button>
            </div>
          </form>
        </div>

      ) : (
        /* ── Normal Calendar View ── */
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-normal text-slate-800">Rehearsal Schedule</h1>
            {canWrite && (
              <button onClick={() => setShowCreate(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
                + Rehearsal
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              events={events}
              dateClick={handleDateClick}
              eventContent={(info) => (
                <div className="text-xs p-0.5 truncate">
                  <strong>{info.event.title}</strong>
                  {info.event.extendedProps.location && (
                    <span className="ml-1 text-gray-300">· {info.event.extendedProps.location}</span>
                  )}
                </div>
              )}
              height="auto"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RehearsalCalendarPage;
