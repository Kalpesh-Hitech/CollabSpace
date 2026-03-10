import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { selIsAuth, selUser, fetchMe } from "./redux/slices/authSlice";
import { THEME as T } from "./config/theme.config";
import PropTypes from "prop-types";
import Layout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashBoard";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import VerifyOtpPage from "./pages/Verifyotppage";
import ProfilePage from "./pages/Profilepage";
import TeamsPage from "./pages/Teamspage";
import UsersPage from "./pages/Userspage";
import TasksPage from "./pages/Taskspage";
import MyTasksPage from "./pages/MyTaskPage";
import AssignPage from "./pages/AssignPage";
import NotificationsPage from "./pages/NotificationPage";

// ── New dedicated form pages (replacing dialogs) ──────────────────────────────
import AddTaskPage from "./pages/AddTaskPage";
import AddTeamPage from "./pages/AddTeamPage";
import AddUserPage from "./pages/AddUserPage";
import EditTaskPage from "./pages/Edittaskpage";

function Protected({ children, roles }) {
  const isAuth = useSelector(selIsAuth);
  const user = useSelector(selUser);
  if (!isAuth) return <Navigate to="/login" replace />;
  if (roles && user?.role && !roles.includes(user.role.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
function Public({ children }) {
  const isAuth = useSelector(selIsAuth);
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}
Protected.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
};
Public.propTypes = { children: PropTypes.node.isRequired };

function AuthSync() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selIsAuth);
  useEffect(() => {
    if (isAuth) dispatch(fetchMe());
  }, [isAuth, dispatch]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <Public>
            <LoginPage />
          </Public>
        }
      />
      <Route path="/verify-email" element={<VerifyOtpPage />} />

      {/* ── Main app (inside Layout) ────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Layout>
              <DashboardPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/analytics"
        element={
          <Protected>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/report"
        element={
          <Protected>
            <Layout>
              <ReportsPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Layout>
              <ProfilePage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <Protected>
            <Layout>
              <MyTasksPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/notifications"
        element={
          <Protected>
            <Layout>
              <NotificationsPage />
            </Layout>
          </Protected>
        }
      />

      {/* ── Teams ──────────────────────────────────────────────────────────── */}
      <Route
        path="/teams"
        element={
          <Protected>
            <Layout>
              <TeamsPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/teams/new"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <AddTeamPage />
            </Layout>
          </Protected>
        }
      />

      {/* ── Tasks ──────────────────────────────────────────────────────────── */}
      <Route
        path="/tasks"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <TasksPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <AddTaskPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/assign"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <AssignPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/tasks/:id/edit"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <EditTaskPage />
            </Layout>
          </Protected>
        }
      />

      {/* ── Users ──────────────────────────────────────────────────────────── */}
      <Route
        path="/users"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <UsersPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/users/new"
        element={
          <Protected roles={["admin", "manager"]}>
            <Layout>
              <AddUserPage />
            </Layout>
          </Protected>
        }
      />

      {/* ── Fallback ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthSync />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          style: {
            background: T.colors.bg.elevated,
            color: T.colors.text.primary,
            border: `1px solid ${T.colors.bg.border}`,
            borderRadius: T.radius.md,
            fontFamily: T.fonts.body,
            fontSize: "13px",
            boxShadow: T.shadows.lg,
            maxWidth: "400px",
          },
          success: {
            iconTheme: {
              primary: T.colors.teal.DEFAULT,
              secondary: T.colors.bg.elevated,
            },
          },
          error: {
            iconTheme: {
              primary: T.colors.danger.text,
              secondary: T.colors.bg.elevated,
            },
          },
          loading: {
            iconTheme: {
              primary: T.colors.primary.DEFAULT,
              secondary: T.colors.bg.elevated,
            },
          },
          duration: 3500,
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}
