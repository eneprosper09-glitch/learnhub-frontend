import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
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

  const courses = Array.isArray(data) ? data : [];
  const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
  const avgRating =
    courses.length > 0
      ? (
          courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length
        ).toFixed(1)
      : '0.0';

  const firstName = (user?.name || 'instructor').split(' ')[0];

  return (
    <div className="space-y-8">
      {/* HERO BAND */}
      <section className="bg-black-900 rounded-3xl px-6 md:px-10 py-10 md:py-12 text-white relative overflow-hidden">
        <div
          className="absolute -right-24 -top-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: '#3b82f6' }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-3">
              Instructor dashboard
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-tight mb-2">
              Welcome back, {firstName}.
            </h1>
            <p className="text-white/70 max-w-xl">
              What would you like to teach today? Create a new course or continue working on an
              existing one.
            </p>
          </div>
          <Link
            to="/instructor/courses/new"
            className="inline-flex items-center gap-2 bg-white text-black-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-black-100 transition whitespace-nowrap"
          >
            <span className="text-lg">+</span>
            Create a course
          </Link>
        </div>

        {/* STATS TILES */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl mb-2">📚</div>
            <div className="text-3xl font-extrabold">{courses.length}</div>
            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Courses</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-3xl font-extrabold">{totalStudents}</div>
            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Students</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-3xl font-extrabold">{avgRating}</div>
            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Avg rating</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-3xl font-extrabold">$0</div>
            <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Revenue</div>
          </div>
        </div>
      </section>

      {/* APPROVAL BANNER */}
      {user && user.role === 'instructor' && !user.isInstructorApproved && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          Your instructor account is awaiting admin approval. You cannot publish courses until
          approved.
        </div>
      )}

      {/* MAIN BODY: Courses + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COURSES GRID */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-black-900">
                Your courses
              </h2>
              <p className="text-black-500 text-sm mt-1">
                {courses.length === 0
                  ? 'Start by creating your first course.'
                  : `${courses.length} course${courses.length === 1 ? '' : 's'} total`}
              </p>
            </div>
            <Link
              to="/instructor/courses/new"
              className="text-sm font-semibold text-black-900 hover:underline"
            >
              + New course
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-black-200 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="font-display font-bold text-xl text-black-900 mb-2">
                No courses yet
              </h3>
              <p className="text-black-500 mb-6 max-w-md mx-auto">
                Turn your experience into a course. Share what you know and reach thousands of
                students.
              </p>
              <Link
                to="/instructor/courses/new"
                className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                Create your first course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {courses.map((c) => (
                <div
                  key={c._id}
                  className="group bg-white border border-black-200 rounded-2xl overflow-hidden shadow-card hover:shadow-soft hover:border-black-900 transition flex flex-col"
                >
                  <div className="relative aspect-video bg-black-100 overflow-hidden">
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black-300 text-4xl">
                        🎓
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                        c.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-white text-black-700'
                      }`}
                    >
                      {c.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-black-500 uppercase tracking-wider font-semibold mb-1">
                      {c.category?.name || 'Uncategorized'}
                    </div>
                    <h3 className="font-display font-bold text-lg text-black-900 line-clamp-2 mb-3">
                      {c.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-black-500 mb-4">
                      <span>👥 {c.totalStudents || 0}</span>
                      <span>📖 {c.totalLessons || 0}</span>
                      <span>⭐ {c.averageRating?.toFixed(1) || '0.0'}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-black-100">
                      <span className="font-bold text-black-900 text-sm">
                        {c.price > 0 ? `$${c.price}` : 'Free'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/instructor/courses/${c._id}`}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/instructor/courses/${c._id}/curriculum`}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
                        >
                          Lessons
                        </Link>
                        <button
                          onClick={() => togglePublish(c._id)}
                          className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition ${
                            c.isPublished
                              ? 'border border-black-300 hover:bg-black-50 text-black-700'
                              : 'bg-black-900 hover:bg-black-800 text-white'
                          }`}
                        >
                          {c.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => deleteCourse(c._id)}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-black-200 rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-bold text-base text-black-900 mb-4">
              Quick actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/instructor/courses/new"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-black-900 hover:bg-black-800 text-white font-medium transition"
              >
                <span className="text-lg">+</span>
                <span className="text-sm">Create a new course</span>
              </Link>
              <Link
                to="/courses"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-black-200 hover:bg-black-50 text-black-800 font-medium transition"
              >
                <span className="text-lg">🔍</span>
                <span className="text-sm">Browse public catalog</span>
              </Link>
              <button
                disabled
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-black-200 text-black-400 font-medium cursor-not-allowed"
              >
                <span className="text-lg">💰</span>
                <span className="text-sm">Earnings (coming soon)</span>
              </button>
            </div>
          </div>

          <div className="bg-black-50 border border-black-100 rounded-2xl p-5">
            <h3 className="font-display font-bold text-base text-black-900 mb-3">
              Tips for success
            </h3>
            <ul className="space-y-3 text-sm text-black-600">
              <li className="flex gap-3">
                <span className="text-black-900">💡</span>
                <span>Courses with 5 or more lessons get 3x more enrollments.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-black-900">🎬</span>
                <span>Add a free preview lesson so students can try before they buy.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-black-900">📸</span>
                <span>Use a clear, high-contrast thumbnail. Faces and text work best.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}