import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Landing from './pages/Landing.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Terms from './pages/Terms.jsx';
import Home from './pages/Home.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import LessonPlayer from './pages/LessonPlayer.jsx';
import MyLearning from './pages/MyLearning.jsx';
import Profile from './pages/Profile.jsx';
import Certificate from './pages/Certificate.jsx';
import Messages from './pages/Messages.jsx';
import InstructorProfile from './pages/InstructorProfile.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import CourseEditor from './pages/CourseEditor.jsx';
import CurriculumManager from './pages/CurriculumManager.jsx';
import CourseStudents from './pages/CourseStudents.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminModeration from './pages/AdminModeration.jsx';
import NotFound from './pages/NotFound.jsx';

// Redirects instructor accounts away from student-only pages.
// Admins are not redirected — they moderate and may need to test student flows.
function BlockInstructor({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role === 'instructor') {
    return <Navigate to="/instructor" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Layout />}>
        <Route path="/courses" element={<Home />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/instructors/:id" element={<InstructorProfile />} />

        <Route
          path="/checkout/:courseId"
          element={
            <ProtectedRoute>
              <BlockInstructor>
                <Checkout />
              </BlockInstructor>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-learning"
          element={
            <ProtectedRoute>
              <BlockInstructor>
                <MyLearning />
              </BlockInstructor>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificates/:courseId"
          element={
            <ProtectedRoute>
              <Certificate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

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
        path="/learn/:courseId/:lessonId"
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