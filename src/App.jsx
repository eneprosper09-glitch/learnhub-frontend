import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Home from './pages/Home.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import LessonPlayer from './pages/LessonPlayer.jsx';
import MyLearning from './pages/MyLearning.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import CourseEditor from './pages/CourseEditor.jsx';
import CurriculumManager from './pages/CurriculumManager.jsx';
import CourseStudents from './pages/CourseStudents.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminModeration from './pages/AdminModeration.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/checkout/:courseId" element={<Checkout />} />
        <Route path="/my-learning" element={<MyLearning />} />

        <Route
          path="/instructor"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/new"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id/curriculum"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <CurriculumManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id/students"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <CourseStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminModeration />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/courses/:id/lessons/:lessonId"
        element={
          <ProtectedRoute>
            <LessonPlayer />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}