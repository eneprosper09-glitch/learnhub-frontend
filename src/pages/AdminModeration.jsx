import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function AdminModeration() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: () =>
      api
        .get('/courses/admin/all', { params: { search, limit: 100 } })
        .then((r) => r.data.data),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const togglePublish = async (id) => {
    try {
      await api.put(`/courses/${id}/publish`);
      toast.success('Updated');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeCourse = async (id) => {
    if (!window.confirm('Soft delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (isLoading) return <Spinner full />;

  const courses = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Course Moderation</h1>
        <p className="text-slate-500 text-sm">{courses.length} courses</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">
                Title
              </th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">
                Instructor
              </th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">
                Students
              </th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">
                Status
              </th>
              <th className="bg-slate-50 text-right px-4 py-3 font-semibold text-slate-600 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 border-b border-slate-100">
                  <Link to={`/courses/${c._id}`} className="hover:text-indigo-600 font-medium">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3 border-b border-slate-100">
                  {c.instructor?.name}
                </td>
                <td className="px-4 py-3 border-b border-slate-100">
                  {c.totalStudents || 0}
                </td>
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
                    className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                  >
                    {c.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => removeCourse(c._id)}
                    className="text-xs px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}