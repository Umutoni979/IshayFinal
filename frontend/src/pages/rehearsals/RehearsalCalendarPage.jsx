import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { rehearsalsApi } from '../../api/rehearsalsApi';
import { productionsApi } from '../../api/productionsApi';
import { Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_FORM = {
  production_id:     '',
  title:             '',
  date:              '',
  start_time:        '',
  end_time:          '',
  location:          '',
  rehearsal_type:    'full',
  notes:             '',
  recurrence:        'once',
  repeat_until:      '',
  days_of_week:      [],
  checkin_closes_at: '',
};

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
    onSuccess: (res) => {
      queryClient.invalidateQueries(['rehearsals']);
      const created = res.data.data.rehearsal;
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(count > 1 ? `${count} sessions scheduled!` : 'Rehearsal scheduled!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create rehearsal'),
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Clicking a calendar date pre-fills the date field
  const handleDateClick = (info) => {
    if (!canWrite) return;
    setForm(f => ({ ...f, date: info.dateStr }));
    setShowCreate(true);
  };


  const events = rehearsals.map(r => ({
    id:    r.id,
    title: r.title,
    start: `${r.date}T${r.start_time}`,
    end:   `${r.date}T${r.end_time}`,
    extendedProps: { location: r.location, type: r.rehearsal_type },
  }));

  const input = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={24} /> Rehearsal Schedule
        </h1>
        {canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Rehearsal
          </button>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">Schedule Rehearsal</h2>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload = { ...form };
                if (payload.recurrence === 'once') { delete payload.repeat_until; delete payload.days_of_week; }
                if (payload.recurrence !== 'weekly') delete payload.days_of_week;
                createMutation.mutate(payload);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Production *</label>
                <select required value={form.production_id} onChange={set('production_id')} className={input}>
                  <option value="">Select a production…</option>
                  {productions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input required value={form.title} onChange={set('title')} placeholder="e.g. Act 1 Run-through"
                  className={input} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input required type="date" value={form.date} onChange={set('date')} className={input} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start *</label>
                  <input required type="time" value={form.start_time} onChange={set('start_time')} className={input} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End *</label>
                  <input required type="time" value={form.end_time} onChange={set('end_time')} className={input} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input value={form.location} onChange={set('location')} placeholder="e.g. Main Hall"
                    className={input} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.rehearsal_type} onChange={set('rehearsal_type')} className={input}>
                    <option value="full">Full</option>
                    <option value="partial">Partial</option>
                    <option value="technical">Technical</option>
                    <option value="dress">Dress</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Repeat</label>
                <select value={form.recurrence} onChange={set('recurrence')} className={input}>
                  <option value="once">Once (single session)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (pick days)</option>
                  <option value="monthly">Monthly (same day)</option>
                </select>
              </div>

              {form.recurrence !== 'once' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Repeat until *</label>
                  <input required type="date" value={form.repeat_until} onChange={set('repeat_until')} className={input} />
                </div>
              )}

              {form.recurrence === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Days of week *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button
                        key={i}
                        type="button"
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
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Self check-in cutoff */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Self check-in closes at
                  <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="time" value={form.checkin_closes_at} onChange={set('checkin_closes_at')}
                  className={input} />
                <p className="text-xs text-gray-400 mt-0.5">After this time members can no longer check themselves in. Leave empty for no cutoff.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes…"
                  className={`${input} resize-none`} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium disabled:opacity-60 transition-colors">
                  {createMutation.isPending ? 'Saving…' : 'Schedule Rehearsal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default RehearsalCalendarPage;
