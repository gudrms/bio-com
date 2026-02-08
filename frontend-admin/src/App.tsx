import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import SchedulesPage from '@/pages/SchedulesPage';
import BookingsPage from '@/pages/BookingsPage';
import InvitationsPage from '@/pages/InvitationsPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/schedules" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
