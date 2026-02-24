import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import api from '@/lib/axios';

dayjs.locale('ko');

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  remainingSlots: number;
}

interface CounselorInfo {
  name: string;
  email: string;
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [error, setError] = useState('');

  const { data: validateData, isLoading: validating, isError: tokenInvalid } = useQuery({
    queryKey: ['validate', token],
    queryFn: async () => {
      const res = await api.get('/invitations/validate', { params: { token } });
      return res.data.data as { counselor: CounselorInfo };
    },
    enabled: !!token,
    retry: false,
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['available-schedules', token],
    queryFn: async () => {
      const res = await api.get('/schedules/available', { params: { token } });
      return res.data.data as { schedules: Schedule[] };
    },
    enabled: !!token && !tokenInvalid,
  });

  const bookMutation = useMutation({
    mutationFn: (data: { scheduleId: string; token: string; clientName: string; clientEmail: string; clientPhone?: string }) =>
      api.post('/bookings', data),
    onSuccess: () => {
      const schedule = schedules.find((s) => s.id === selectedScheduleId);
      navigate('/complete', {
        state: {
          clientName,
          date: schedule?.date,
          startTime: schedule?.startTime?.slice(0, 5),
          endTime: schedule?.endTime?.slice(0, 5),
        },
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || '예약에 실패했습니다.';
      setError(msg);
    },
  });

  if (!token) {
    navigate('/invalid', { replace: true });
    return null;
  }

  if (validating) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#64748b' }}>확인 중...</p>
      </div>
    );
  }

  if (tokenInvalid) {
    navigate('/invalid', { replace: true });
    return null;
  }

  const schedules = scheduleData?.schedules ?? [];
  const scheduleDateSet = new Set(schedules.map((s) => s.date));
  const daySchedules = selectedDate ? schedules.filter((s) => s.date === selectedDate) : [];

  // 캘린더 계산
  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = currentMonth.startOf('month').day();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data: { scheduleId: string; token: string; clientName: string; clientEmail: string; clientPhone?: string } = {
      scheduleId: selectedScheduleId,
      token,
      clientName,
      clientEmail,
    };
    if (clientPhone) data.clientPhone = clientPhone;
    bookMutation.mutate(data);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, color: '#1e293b', marginBottom: 4 }}>상담 예약</h1>
          {validateData?.counselor && (
            <p style={{ fontSize: 14, color: '#64748b' }}>
              상담사: {validateData.counselor.name}
            </p>
          )}
        </div>

        {/* Step 1: 캘린더 날짜 선택 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: '#1e293b' }}>1. 날짜 선택</h3>

          {/* 캘린더 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
              style={navBtnStyle}
            >
              &lt;
            </button>
            <strong style={{ fontSize: 15, color: '#1e293b' }}>
              {currentMonth.format('YYYY년 MM월')}
            </strong>
            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
              style={navBtnStyle}
            >
              &gt;
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', fontSize: 13 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} style={{ padding: 6, fontWeight: 600, color: '#64748b' }}>{d}</div>
            ))}

            {/* 날짜 셀 */}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              const hasSchedule = scheduleDateSet.has(dateStr);
              const isPast = dayjs(dateStr).isBefore(dayjs(), 'day');

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!isPast && hasSchedule) {
                      setSelectedDate(dateStr);
                      setSelectedScheduleId('');
                    }
                  }}
                  style={{
                    padding: 6,
                    cursor: hasSchedule && !isPast ? 'pointer' : 'default',
                    borderRadius: 6,
                    background: isSelected ? '#2563eb' : 'transparent',
                    color: isPast
                      ? '#cbd5e1'
                      : isSelected
                        ? '#fff'
                        : hasSchedule
                          ? '#1e293b'
                          : '#94a3b8',
                    fontWeight: isSelected ? 600 : 400,
                    position: 'relative',
                  }}
                >
                  {day}
                  {hasSchedule && !isPast && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: isSelected ? '#fff' : '#2563eb',
                        margin: '2px auto 0',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {!selectedDate && schedules.length > 0 && (
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
              파란 점이 있는 날짜를 선택하세요
            </p>
          )}
          {schedules.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              예약 가능한 스케줄이 없습니다.
            </p>
          )}
        </div>

        {/* Step 2: 시간 선택 */}
        {selectedDate && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, color: '#1e293b' }}>
              2. 시간 선택 — {dayjs(selectedDate).format('MM월 DD일 (ddd)')}
            </h3>
            {daySchedules.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>해당 날짜에 예약 가능한 시간이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {daySchedules
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => {
                    const full = !s.available;
                    const selected = selectedScheduleId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !full && setSelectedScheduleId(s.id)}
                        disabled={full}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: full ? '#f1f5f9' : selected ? '#eff6ff' : '#fff',
                          color: full ? '#94a3b8' : '#1e293b',
                          cursor: full ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          fontSize: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {s.startTime.slice(0, 5)} ~ {s.endTime.slice(0, 5)}
                        </span>
                        <span style={{ fontSize: 13, color: full ? '#ef4444' : '#64748b' }}>
                          {full ? '마감' : `잔여 ${s.remainingSlots}명`}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: 정보 입력 */}
        {selectedScheduleId && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, color: '#1e293b' }}>3. 정보 입력</h3>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>이름 *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>이메일 *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>연락처 (선택)</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={bookMutation.isPending}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: bookMutation.isPending ? '#94a3b8' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: bookMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {bookMutation.isPending ? '예약 중...' : '예약 신청'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 14,
  color: '#475569',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#475569', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
