import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/instructor/mine').then((r) => r.data.data),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const togglePublish = async (id) => {
    try {
      await api.put(`/courses/${id}/publish`);
      toast.success('Course updated');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course? It will be removed from listings.')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (isLoading) return <Spinner full />;

  const courses = data || [];
  const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
  const avgRating =
    courses.length > 0
      ? (courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage your courses</p>
        </div>
        <Link
          to="/instructor/courses/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg"
        >
          + New Course
        </Link>
      </div>

      {user && user.role === 'instructor' && !user.isInstructorApproved && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          Your instructor account is awaiting admin approval. You cannot publish courses until approved.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Courses" value={courses.length} icon="📚" color="brand" />
        <StatCard label="Total Students" value={totalStudents} icon="👥" color="green" />
        <StatCard label="Avg Rating" value={avgRating} icon="⭐" color="yellow" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Title</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Level</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Price</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Students</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Status</th>
              <th className="bg-slate-50 text-right px-4 py-3 font-semibold text-slate-600 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  You have not created any course yet.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 border-b border-slate-100 font-medium">{c.title}</td>
                <td className="px-4 py-3 border-b border-slate-100 capitalize">{c.level}</td>
                <td className="px-4 py-3 border-b border-slate-100">
                  {c.price > 0 ? `$${c.price}` : 'Free'}
                </td>
                <td className="px-4 py-3 border-b border-slate-100">{c.totalStudents || 0}</td>
                <td className="px-4 py-3 border-b border-slate-100">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.isPublished
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 border-b border-slate-100 text-right space-x-2">
                  <button
                    onClick={() => togglePublish(c._id)}
                    className={`text-xs px-3 py-1 rounded-md ${
                      c.isPublished
                        ? 'border border-slate-300 hover:bg-slate-50'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {c.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    to={`/instructor/courses/${c._id}`}
                    className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/instructor/courses/${c._id}/curriculum`}
                    className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                  >
                    Curriculum
                  </Link>
                  <Link
                    to={`/instructor/courses/${c._id}/students`}
                    className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                  >
                    Students
                  </Link>
                  <button
                    onClick={() => deleteCourse(c._id)}
                    className="text-xs px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}