import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/schedules', label: '스케줄 관리' },
    { to: '/bookings', label: '예약 관리' },
    { to: '/invitations', label: '초대 링크' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220,
        background: '#1e293b',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #334155' }}>
          상담 예약 관리
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                textDecoration: 'none',
                background: isActive ? '#334155' : 'transparent',
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            margin: 16,
            padding: '8px 0',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          로그아웃
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24, background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
