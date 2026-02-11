import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '@/lib/axios';

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
}

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [editingId, setEditingId] = useState<string | null>(null);

  const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
  const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ['schedules', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/schedules', { params: { startDate, endDate } });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { date: string; startTime: string }) => api.post('/schedules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date: string; startTime: string } }) =>
      api.put(`/schedules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const daySchedules = schedules.filter((s) => s.date === selectedDate);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = currentMonth.startOf('month').day();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const scheduleDateSet = new Set(schedules.map((s) => s.date));

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const h = Math.floor(i / 2) + 9;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { date: formDate, startTime: formTime } });
    } else {
      createMutation.mutate({ date: formDate, startTime: formTime });
    }
  };

  const openCreate = () => {
    setFormDate(selectedDate);
    setFormTime('09:00');
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s: Schedule) => {
    setFormDate(s.date);
    setFormTime(s.startTime.slice(0, 5));
    setEditingId(s.id);
    setShowForm(true);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>스케줄 관리</h2>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: 340 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} style={navBtnStyle}>&lt;</button>
            <strong>{currentMonth.format('YYYY년 MM월')}</strong>
            <button onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} style={navBtnStyle}>&gt;</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', fontSize: 13 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} style={{ padding: 6, fontWeight: 600, color: '#64748b' }}>{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              const hasSchedule = scheduleDateSet.has(dateStr);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    padding: 6,
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: isSelected ? '#2563eb' : 'transparent',
                    color: isSelected ? '#fff' : '#1e293b',
                    fontWeight: isSelected ? 600 : 400,
                    position: 'relative',
                  }}
                >
                  {day}
                  {hasSchedule && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : '#2563eb', margin: '2px auto 0' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day schedules */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>{dayjs(selectedDate).format('MM월 DD일')} 스케줄</h3>
            <button onClick={openCreate} style={primaryBtnStyle}>+ 스케줄 추가</button>
          </div>

          {isLoading ? (
            <p style={{ color: '#64748b' }}>로딩 중...</p>
          ) : daySchedules.length === 0 ? (
            <p style={{ color: '#94a3b8', padding: 20, textAlign: 'center', background: '#fff', borderRadius: 8 }}>
              등록된 스케줄이 없습니다.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daySchedules
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((s) => (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {s.startTime.slice(0, 5)} ~ {s.endTime.slice(0, 5)}
                      </span>
                      <span style={{ marginLeft: 12, fontSize: 13, color: '#64748b' }}>
                        예약 {s.currentBookings}/{s.maxCapacity}명
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(s)} style={smallBtnStyle}>수정</button>
                      <button
                        onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(s.id); }}
                        style={{ ...smallBtnStyle, color: '#ef4444' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 340 }}>
            <h3 style={{ marginBottom: 16 }}>{editingId ? '스케줄 수정' : '스케줄 추가'}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>날짜</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>시작 시간 (30분 단위)</label>
              <select value={formTime} onChange={(e) => setFormTime(e.target.value)} style={inputStyle}>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ ...smallBtnStyle, padding: '8px 16px' }}>취소</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ ...primaryBtnStyle, padding: '8px 16px' }}
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = { background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#475569' };
const primaryBtnStyle: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const smallBtnStyle: React.CSSProperties = { background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#475569' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#475569', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 };
