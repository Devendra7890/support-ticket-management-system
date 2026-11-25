import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminRoute from './components/routing/AdminRoute';
import PublicOnlyRoute from './components/routing/PublicOnlyRoute';
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/user/DashboardPage';
import TicketsPage from './pages/user/TicketsPage';
import CreateTicketPage from './pages/user/CreateTicketPage';
import TicketDetailsPage from './pages/user/TicketDetailsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminTicketDetailsPage from './pages/admin/AdminTicketDetailsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#f8fafc',
            },
          }}
        />

        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<UserLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/create" element={<CreateTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="tickets" element={<AdminTicketsPage />} />
              <Route path="tickets/:id" element={<AdminTicketDetailsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
