import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { startDirectConversation } from '../api/conversations';

const Stars = ({ value }) => {
  const v = Math.round(value || 0);
  return (
    <span className="text-yellow-500">
      {'★'.repeat(v)}
      <span className="text-black-200">{'★'.repeat(5 - v)}</span>
    </span>
  );
};

export default function InstructorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-profile', id],
    queryFn: () =>
      api.get(`/reviews/instructor-profile/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return <Spinner full />;
  if (!data) return <p className="text-black-500">Instructor not found</p>;

  const { instructor, stats, courses, reviews } = data;

  const isSelf = user?._id && String(user._id) === String(instructor._id);
  const canMessage = !!user && !isSelf;

  const handleMessage = async () => {
    if (!user) {
      nav(`/login?redirect=/instructors/${id}`);
      return;
    }
    setStarting(true);
    try {
      const conv = await startDirectConversation(instructor._id);
      if (!conv?._id) {
        toast.error('Could not open conversation');
        return;
      }
      nav(`/messages?c=${conv._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-10 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-display font-extrabold text-4xl flex-shrink-0">
            {instructor.name?.[0] || 'I'}
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
              Instructor
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">
              {instructor.name}
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-xl leading-relaxed">
              {instructor.bio ||
                'Experienced professional passionate about teaching. Has helped thousands of students learn practical, job-ready skills.'}
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="font-bold text-white">{stats.averageRating}</span>
                <Stars value={stats.averageRating} />
                <span className="text-white/60">({stats.totalReviews} reviews)</span>
              </span>
              <span className="text-white/60">·</span>
              <span className="text-white/80">{stats.courses} courses</span>
              <span className="text-white/60">·</span>
              <span className="text-white/80">
                {stats.students.toLocaleString()} students
              </span>
            </div>

            {canMessage && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={starting}
                  className="inline-flex items-center gap-2 bg-white text-black-900 hover:bg-white/90 font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  <span>💬</span>
                  <span>{starting ? 'Opening…' : 'Message'}</span>
                </button>
              </div>
            )}

            {!user && (
              <div className="mt-5">
                <Link
                  to={`/login?redirect=/instructors/${id}`}
                  className="inline-flex items-center gap-2 bg-white text-black-900 hover:bg-white/90 font-semibold px-5 py-2.5 rounded-xl transition"
                >
                  Log in to message
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COURSES */}
      <section>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-black-900">
              Courses by {instructor.name}
            </h2>
            <p className="text-black-500 text-sm mt-1">
              {courses.length} published course{courses.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white border border-black-200 rounded-2xl p-8 text-center text-black-500">
            This instructor has not published any courses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => {
              const hasDiscount = (c.discountPercent || 0) > 0;
              const final = hasDiscount
                ? Math.round((c.price - (c.price * c.discountPercent) / 100) * 100) / 100
                : c.price;
              return (
                <Link
                  key={c._id}
                  to={`/courses/${c._id}`}
                  className="group bg-white border border-black-200 rounded-2xl overflow-hidden hover:shadow-soft transition flex flex-col"
                >
                  <div className="relative aspect-video bg-black-100 overflow-hidden">
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black-300 text-3xl">
                        🎓
                      </div>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        {c.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs font-semibold text-black-500 uppercase tracking-wider mb-2">
                      {c.category?.name || 'Course'}
                    </div>
                    <h3 className="font-display font-bold text-lg text-black-900 line-clamp-2 leading-snug">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="font-semibold text-black-900">
                        {c.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <Stars value={c.averageRating || 0} />
                      <span className="text-black-500">
                        ({c.totalReviews || 0})
                      </span>
                    </div>
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      {c.price === 0 ? (
                        <span className="text-lg font-bold text-black-900">Free</span>
                      ) : hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-black-400 line-through text-sm">
                            ${c.price}
                          </span>
                          <span className="text-lg font-bold text-black-900">
                            ${final}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-black-900">
                          ${c.price}
                        </span>
                      )}
                      <span className="text-xs text-black-400 group-hover:text-black-900 transition">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* REVIEWS */}
      <section>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-black-900">
              What students say
            </h2>
            <p className="text-black-500 text-sm mt-1">
              {stats.totalReviews} review{stats.totalReviews === 1 ? '' : 's'} across all
              courses
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white border border-black-200 rounded-2xl p-8 text-center text-black-500">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white border border-black-200 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-black-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {r.student?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="font-semibold text-black-900">
                        {r.student?.name || 'Student'}
                      </span>
                      <span className="text-xs text-black-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars value={r.rating} />
                      {r.course?.title && (
                        <Link
                          to={`/courses/${r.course._id}`}
                          className="text-xs text-black-500 hover:text-black-900 hover:underline"
                        >
                          on {r.course.title}
                        </Link>
                      )}
                    </div>
                    {r.comment && (
                      <p className="text-black-700 leading-relaxed mt-3">{r.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}