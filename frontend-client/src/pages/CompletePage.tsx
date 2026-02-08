import { useLocation } from 'react-router-dom';

interface BookingInfo {
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function CompletePage() {
  const location = useLocation();
  const booking = location.state as BookingInfo | null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 400 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28, color: '#16a34a' }}>
          V
        </div>
        <h1 style={{ fontSize: 22, color: '#1e293b', marginBottom: 8 }}>예약이 완료되었습니다</h1>
        {booking && (
          <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569', textAlign: 'left' }}>
            <div style={{ marginBottom: 8 }}><strong>이름:</strong> {booking.clientName}</div>
            <div style={{ marginBottom: 8 }}><strong>날짜:</strong> {booking.date}</div>
            <div><strong>시간:</strong> {booking.startTime} ~ {booking.endTime}</div>
          </div>
        )}
        <p style={{ marginTop: 20, fontSize: 13, color: '#94a3b8' }}>
          예약 확인 이메일이 발송됩니다.
        </p>
      </div>
    </div>
  );
}
