import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '@/lib/axios';

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookings: { id: string }[];
}

interface CounselorInfo {
  name: string;
  email: string;
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

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
    queryKey: ['available-schedules', token, selectedDate],
    queryFn: async () => {
      const params: Record<string, string> = { token };
      if (selectedDate) params.date = selectedDate;
      const res = await api.get('/schedules/available', { params });
      return res.data.data as { schedules: Schedule[] };
    },
    enabled: !!token && !tokenInvalid,
  });

  const bookMutation = useMutation({
    mutationFn: (data: { scheduleId: string; token: string; clientName: string; clientEmail: string; clientPhone?: string }) =>
      api.post('/bookings', data),
    onSuccess: () => {
      const schedule = scheduleData?.schedules.find((s) => s.id === selectedScheduleId);
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
  const dates = [...new Set(schedules.map((s) => s.date))].sort();
  const daySchedules = selectedDate ? schedules.filter((s) => s.date === selectedDate) : [];

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
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, color: '#1e293b', marginBottom: 4 }}>상담 예약</h1>
          {validateData?.counselor && (
            <p style={{ fontSize: 14, color: '#64748b' }}>
              상담사: {validateData.counselor.name}
            </p>
          )}
        </div>

        {/* Step 1: Date select */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: '#1e293b' }}>1. 날짜 선택</h3>
          {dates.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>예약 가능한 날짜가 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setSelectedScheduleId(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: selectedDate === d ? '#2563eb' : '#fff',
                    color: selectedDate === d ? '#fff' : '#475569',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: selectedDate === d ? 600 : 400,
                  }}
                >
                  {dayjs(d).format('MM/DD (ddd)')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Time select */}
        {selectedDate && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, color: '#1e293b' }}>2. 시간 선택</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daySchedules
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((s) => {
                  const booked = s.bookings?.length ?? 0;
                  const full = booked >= s.maxCapacity;
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
                        {full ? '마감' : `${booked}/${s.maxCapacity}명`}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Step 3: Info form */}
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

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#475569', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
