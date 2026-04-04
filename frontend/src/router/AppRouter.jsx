import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Layout from '../components/common/Layout';

// Auth pages
import LoginPage          from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage    from '../pages/auth/VerifyEmailPage';
import SetPasswordPage    from '../pages/auth/SetPasswordPage';

// App pages
import DashboardPage      from '../pages/dashboard/DashboardPage';
import MembersListPage    from '../pages/members/MembersListPage';
import MemberDetailPage   from '../pages/members/MemberDetailPage';
import ProductionsPage    from '../pages/productions/ProductionsPage';
import ProductionDetailPage from '../pages/productions/ProductionDetailPage';
import RolesPage          from '../pages/roles/RolesPage';
import RehearsalCalendarPage from '../pages/rehearsals/RehearsalCalendarPage';
import AttendancePage     from '../pages/attendance/AttendancePage';
import MyAttendancePage   from '../pages/attendance/MyAttendancePage';
import ReportsPage        from '../pages/reports/ReportsPage';
import ConflictsPage      from '../pages/conflicts/ConflictsPage';
import NotificationsPage  from '../pages/notifications/NotificationsPage';
import AdminPage          from '../pages/admin/AdminPage';
import ProfilePage        from '../pages/profile/ProfilePage';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/login"                  element={<LoginPage />} />
      <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />
      <Route path="/verify-code"   element={<VerifyEmailPage />} />
      <Route path="/set-password"  element={<SetPasswordPage />} />

      {/* Protected routes — all roles */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/productions"   element={<ProductionsPage />} />
          <Route path="/productions/:id" element={<ProductionDetailPage />} />
          <Route path="/roles"         element={<RolesPage />} />
          <Route path="/rehearsals"    element={<RehearsalCalendarPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/my-attendance" element={<MyAttendancePage />} />

          {/* Director + Coordinator only */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'coordinator']} />}>
            <Route path="/members"      element={<MembersListPage />} />
            <Route path="/members/:id"  element={<MemberDetailPage />} />
            <Route path="/attendance"   element={<AttendancePage />} />
            <Route path="/reports"      element={<ReportsPage />} />
            <Route path="/conflicts"    element={<ConflictsPage />} />
          </Route>

          {/* Director only */}
          <Route element={<ProtectedRoute allowedRoles={['director']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
