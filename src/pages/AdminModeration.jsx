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
    if (!window.confirm('Delete this course? It will be removed from all listings.')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (isLoading) return <Spinner full />;

  const courses = Array.isArray(data) ? data : [];
  const published = courses.filter((c) => c.isPublished).length;
  const drafts = courses.length - published;

  return (
    <div className="space-y-6">
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white">
        <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
          Admin
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Course moderation</h1>
        <p className="text-white/70 text-sm mt-1">
          {published} published · {drafts} draft{drafts === 1 ? '' : 's'}
        </p>
      </div>

      <div className="bg-white border border-black-200 rounded-2xl p-4 shadow-card">
        <input
          className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
          placeholder="Search courses by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Course
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Instructor
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Students
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Price
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Status
              </th>
              <th className="bg-black-50 text-right px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-black-500">
                  No courses found.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c._id} className="hover:bg-black-50/60">
                <td className="px-4 py-3 border-b border-black-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-black-100 overflow-hidden flex-shrink-0">
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black-300">
                          🎓
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/courses/${c._id}`}
                      className="hover:text-black-700 font-medium text-black-900 line-clamp-2"
                    >
                      {c.title}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-black-600">
                  {c.instructor?.name || '—'}
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-black-600">
                  {c.totalStudents || 0}
                </td>
                <td className="px-4 py-3 border-b border-black-100 font-medium text-black-900">
                  {c.price > 0 ? `$${c.price}` : 'Free'}
                </td>
                <td className="px-4 py-3 border-b border-black-100">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.isPublished
                        ? 'bg-green-100 text-green-700'
                        : 'bg-black-100 text-black-600'
                    }`}
                  >
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => togglePublish(c._id)}
                    className="text-xs px-3 py-1.5 rounded-md border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
                  >
                    {c.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => removeCourse(c._id)}
                    className="text-xs px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition"
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