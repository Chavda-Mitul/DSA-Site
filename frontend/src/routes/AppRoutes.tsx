import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Topics } from '../pages/Topics';
import { TopicDetail } from '../pages/TopicDetail';
import { Dashboard } from '../pages/Dashboard';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminRoute } from '../components/common/AdminRoute';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { ManageTopics } from '../pages/admin/ManageTopics';
import { TopicCreate } from '../pages/admin/TopicCreate';
import { TopicEdit } from '../pages/admin/TopicEdit';
import { ManageProblems } from '../pages/admin/ManageProblems';
import { ProblemCreate } from '../pages/admin/ProblemCreate';
import { ProblemEdit } from '../pages/admin/ProblemEdit';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topics"
          element={
            <ProtectedRoute>
              <Topics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topics/:slug"
          element={
            <ProtectedRoute>
              <TopicDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="topics" element={<ManageTopics />} />
        <Route path="topics/create" element={<TopicCreate />} />
        <Route path="topics/:id/edit" element={<TopicEdit />} />
        <Route path="problems" element={<ManageProblems />} />
        <Route path="problems/create" element={<ProblemCreate />} />
        <Route path="problems/:id/edit" element={<ProblemEdit />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
