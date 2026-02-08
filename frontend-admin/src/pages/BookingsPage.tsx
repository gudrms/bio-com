import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '@/lib/axios';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  status: string;
  createdAt: string;
  schedule: { date: string; startTime: string; endTime: string };
  consultationRecord?: { id: string; notes: string } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: '#f59e0b' },
  confirmed: { label: '확정', color: '#2563eb' },
  completed: { label: '완료', color: '#10b981' },
  cancelled: { label: '취소', color: '#ef4444' },
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [recordNotes, setRecordNotes] = useState('');
  const [showRecordForm, setShowRecordForm] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/bookings', { params });
      return res.data.data;
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes: string }) =>
      api.post(`/bookings/${bookingId}/records`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowRecordForm(false);
      setSelectedBooking(null);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes: string }) =>
      api.put(`/bookings/${bookingId}/records`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowRecordForm(false);
      setSelectedBooking(null);
    },
  });

  const openRecordForm = (booking: Booking) => {
    setSelectedBooking(booking);
    setRecordNotes(booking.consultationRecord?.notes ?? '');
    setShowRecordForm(true);
  };

  const handleRecordSubmit = () => {
    if (!selectedBooking) return;
    if (selectedBooking.consultationRecord) {
      updateRecordMutation.mutate({ bookingId: selectedBooking.id, notes: recordNotes });
    } else {
      createRecordMutation.mutate({ bookingId: selectedBooking.id, notes: recordNotes });
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>예약 관리</h2>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'confirmed', 'pending', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: statusFilter === s ? '#2563eb' : '#fff',
              color: statusFilter === s ? '#fff' : '#475569',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: statusFilter === s ? 600 : 400,
            }}
          >
            {s === '' ? '전체' : statusLabels[s]?.label ?? s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#64748b' }}>로딩 중...</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#94a3b8', padding: 32, textAlign: 'center', background: '#fff', borderRadius: 8 }}>
          예약이 없습니다.
        </p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>날짜</th>
                <th style={thStyle}>시간</th>
                <th style={thStyle}>신청자</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>상담기록</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const st = statusLabels[b.status];
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{dayjs(b.schedule?.date).format('MM/DD')}</td>
                    <td style={tdStyle}>
                      {b.schedule?.startTime?.slice(0, 5)} ~ {b.schedule?.endTime?.slice(0, 5)}
                    </td>
                    <td style={tdStyle}>{b.clientName}</td>
                    <td style={tdStyle}>{b.clientEmail}</td>
                    <td style={tdStyle}>
                      <span style={{ color: st?.color ?? '#64748b', fontWeight: 600 }}>
                        {st?.label ?? b.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => openRecordForm(b)} style={recordBtnStyle}>
                        {b.consultationRecord ? '수정' : '작성'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Modal */}
      {showRecordForm && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 440 }}>
            <h3 style={{ marginBottom: 4 }}>
              {selectedBooking.consultationRecord ? '상담 기록 수정' : '상담 기록 작성'}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {selectedBooking.clientName} ({dayjs(selectedBooking.schedule?.date).format('MM/DD')} {selectedBooking.schedule?.startTime?.slice(0, 5)})
            </p>
            <textarea
              value={recordNotes}
              onChange={(e) => setRecordNotes(e.target.value)}
              rows={6}
              placeholder="상담 내용을 기록하세요..."
              style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => { setShowRecordForm(false); setSelectedBooking(null); }}
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#475569' }}
              >
                취소
              </button>
              <button
                onClick={handleRecordSubmit}
                disabled={createRecordMutation.isPending || updateRecordMutation.isPending || !recordNotes.trim()}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#64748b', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 14px' };
const recordBtnStyle: React.CSSProperties = { background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#2563eb', fontWeight: 600 };
