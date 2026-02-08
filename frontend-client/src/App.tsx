import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import BookingPage from '@/pages/BookingPage';
import CompletePage from '@/pages/CompletePage';
import InvalidTokenPage from '@/pages/InvalidTokenPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/complete" element={<CompletePage />} />
          <Route path="/invalid" element={<InvalidTokenPage />} />
          <Route path="*" element={<Navigate to="/invalid" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
