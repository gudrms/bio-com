import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function InvitationsPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: (recipientEmail: string) => api.post('/invitations', { recipientEmail }),
    onSuccess: () => {
      setMessage('초대 링크가 발송되었습니다.');
      setEmail('');
    },
    onError: () => {
      setMessage('발송에 실패했습니다. 이메일 설정을 확인하세요.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    sendMutation.mutate(email);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>초대 링크 발송</h2>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 480, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
          신청자에게 예약 페이지 링크를 이메일로 발송합니다.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#475569', marginBottom: 4 }}>
              수신자 이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14,
              background: sendMutation.isError ? '#fef2f2' : '#f0fdf4',
              color: sendMutation.isError ? '#dc2626' : '#16a34a',
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={sendMutation.isPending}
            style={{
              background: sendMutation.isPending ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              cursor: sendMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {sendMutation.isPending ? '발송 중...' : '초대 링크 발송'}
          </button>
        </form>
      </div>
    </div>
  );
}
