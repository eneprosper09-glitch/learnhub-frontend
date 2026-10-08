import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const CourseChat = lazy(() => import('./CourseChat.jsx'));

const TABS = [
  'About',
  'What you will learn',
  'Modules',
  'Instructor',
  'Reviews',
  'Announcements',
  'Chat',
];

const WHAT_YOU_LEARN = [
  'Build real projects with modern tools and frameworks',
  'Apply best practices used by senior engineers and designers',
  'Understand the fundamentals deeply, not just the syntax',
  'Prepare for a portfolio, interviews, and real-world work',
];

const Stars = ({ value, size = 'md' }) => {
  const v = Math.round(value || 0);
  const cls = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={`${cls} text-yellow-500`}>
      {'★'.repeat(v)}
      <span className="text-black-200">{'★'.repeat(5 - v)}</span>
    </span>
  );
};

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('About');
  const [unenrollOpen, setUnenrollOpen] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  });

  const { data: reviewsRes, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.get(`/reviews/course/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: myReviewRes, refetch: refetchMyReview } = useQuery({
    queryKey: ['my-review', id, user?._id],
    queryFn: () => api.get(`/reviews/course/${id}/mine`).then((r) => r.data.data),
    enabled: !!user && !!id,
  });

  const { data: announcementsRes, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['announcements', id],
    queryFn: () => api.get(`/announcements/course/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (myReviewRes && !prefilled) {
      setReviewForm({
        rating: myReviewRes.rating || 5,
        comment: myReviewRes.comment || '',
      });
      setPrefilled(true);
    }
  }, [myReviewRes, prefilled]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course', id] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['play'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
    queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    queryClient.invalidateQueries({ queryKey: ['my-review', id] });
    queryClient.invalidateQueries({ queryKey: ['announcements', id] });
  };

  const unenrollMutation = useMutation({
    mutationFn: () => api.put(`/enrollments/${id}/unenroll`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Unenrolled');
      setUnenrollOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
    onSettled: () => setUnenrolling(false),
  });

  if (isLoading) return <Spinner full />;
  if (!data) return <p className="text-black-500">Course not found</p>;

  const price = Number(data.price) || 0;
  const discount = Number(data.discountPercent) || 0;
  const finalPrice =
    discount > 0 ? Math.round((price - (price * discount) / 100) * 100) / 100 : price;
  const hasDiscount = discount > 0;
  const isPaid = finalPrice > 0;
  const firstLesson = data.lessons?.[0];
  const firstFreeLesson = data.lessons?.find((l) => l.isFree);
  const unverified = user && !user.isEmailVerified;
  const totalLessons = data.lessons?.length || 0;

  const reviews = Array.isArray(reviewsRes?.data) ? reviewsRes.data : [];
  const avgRating = reviewsRes?.averageRating || 0;
  const reviewCount = reviewsRes?.count || 0;
  const announcements = Array.isArray(announcementsRes) ? announcementsRes : [];

  // --- Viewer relationship to this course ---
  const courseInstructorId = data.instructor?._id || data.instructor || null;
  const isOwnCourse =
    user && courseInstructorId && String(user._id) === String(courseInstructorId);
  const isInstructorViewer = user?.role === 'instructor';
  // Instructors cannot enroll at all. Admins can (they moderate and may need
  // to test student flows). Students can.
  const canEnroll = !isInstructorViewer && !isOwnCourse;

  const goToFirstLesson = () => {
    if (!user) {
      nav(`/login?redirect=/courses/${id}`);
      return;
    }
    if (firstLesson) nav(`/learn/${id}/${firstLesson._id}`);
  };

  const goToLesson = (lesson) => {
    if (!user) {
      nav(`/login?redirect=/courses/${id}`);
      return;
    }
    nav(`/learn/${id}/${lesson._id}`);
  };

  const handleEnrollClick = () => {
    if (!user) {
      nav(`/login?redirect=/courses/${id}`);
      return;
    }
    if (!canEnroll) return;
    if (data.previouslyPaid) {
      api
        .post(`/enrollments/${id}/enroll`, {})
        .then(() => {
          toast.success('Welcome back');
          invalidate();
        })
        .catch((err) => {
          if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            toast.error('Please verify your email before enrolling.');
          } else {
            toast.error(err.response?.data?.message || 'Failed');
          }
        });
      return;
    }
    nav(`/checkout/${id}`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/reviews/course/${id}`, reviewForm);
      toast.success(myReviewRes ? 'Review updated' : 'Review submitted');
      refetchReviews();
      refetchMyReview();
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMyReview = async () => {
    if (!myReviewRes?._id) return;
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/reviews/${myReviewRes._id}`);
      toast.success('Review deleted');
      setReviewForm({ rating: 5, comment: '' });
      setPrefilled(false);
      refetchReviews();
      refetchMyReview();
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/courses" className="text-sm text-black-500 hover:text-black-800">
        ← Back to courses
      </Link>

      {unverified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Your email is not verified yet. Verify it before enrolling or uploading files.
        </div>
      )}

      {/* ANNOUNCEMENT PREVIEW */}
      {announcements.length > 0 && (
        <div className="bg-black-900 text-white rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg flex-shrink-0">
              📣
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-1">
                Announcement
              </div>
              <div className="font-semibold truncate">{announcements[0].title}</div>
              <p className="text-white/80 text-sm mt-1 line-clamp-2">
                {announcements[0].body}
              </p>
              <button
                onClick={() => setTab('Announcements')}
                className="text-xs font-semibold mt-2 hover:underline"
              >
                View all announcements →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white border border-black-200 rounded-2xl p-6 md:p-8">
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold tracking-widest text-black-500 uppercase mb-3">
            {data.category?.name || 'Course'}
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-black-900 leading-tight">
            {data.title}
          </h1>
          <p className="text-lg text-black-700 mt-4 leading-relaxed">
            {data.description ||
              'Learn practical skills with a hands-on, project-based curriculum.'}
          </p>
          <div className="flex flex-wrap items-center gap-5 text-sm text-black-600 mt-5">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-black-900">
                {avgRating.toFixed(1)}
              </span>
              <Stars value={avgRating} />
              <span>({reviewCount})</span>
            </span>
            <span>{totalLessons} lessons</span>
            <span className="capitalize">{data.level}</span>
            <span>{data.language}</span>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 bg-white rounded-2xl">
            <div className="relative aspect-video bg-black-100 rounded-xl overflow-hidden border border-black-200">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black-300 text-4xl">
                  🎓
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {discount}% OFF
                </span>
              )}
            </div>
            <div className="mt-5">
              {/* INSTRUCTOR VIEW — own course */}
              {isOwnCourse && (
                <div className="space-y-3">
                  <div className="bg-black-50 border border-black-100 rounded-xl p-4">
                    <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-1">
                      You teach this course
                    </div>
                    <div className="text-sm text-black-700">
                      This is your course. Manage lessons, students, and settings from the
                      instructor dashboard.
                    </div>
                  </div>
                  <Link
                    to={`/instructor/courses/${data._id}`}
                    className="block w-full text-center bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
                  >
                    Manage course
                  </Link>
                  <Link
                    to={`/instructor/courses/${data._id}/curriculum`}
                    className="block w-full text-center border border-black-900 text-black-900 hover:bg-black-50 font-semibold py-3 rounded-xl transition"
                  >
                    Edit curriculum
                  </Link>
                  <Link
                    to={`/instructor/courses/${data._id}/students`}
                    className="block w-full text-center border border-black-300 text-black-700 hover:bg-black-50 font-medium py-2.5 rounded-xl transition text-sm"
                  >
                    View students
                  </Link>
                </div>
              )}

              {/* INSTRUCTOR VIEW — someone else's course */}
              {!isOwnCourse && isInstructorViewer && (
                <div className="space-y-3">
                  <div className="bg-black-50 border border-black-100 rounded-xl p-4">
                    <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-1">
                      Preview mode
                    </div>
                    <div className="text-sm text-black-700">
                      Instructor accounts cannot enroll in courses. You can preview this
                      course from a student's perspective, but not take it.
                    </div>
                  </div>
                  {firstFreeLesson && (
                    <button
                      onClick={() => goToLesson(firstFreeLesson)}
                      className="block w-full text-center border border-black-900 text-black-900 hover:bg-black-50 font-semibold py-3 rounded-xl transition"
                    >
                      Preview this course
                    </button>
                  )}
                  <Link
                    to="/instructor"
                    className="block w-full text-center text-sm font-semibold text-black-700 hover:text-black-900 py-2"
                  >
                    ← Back to Teach
                  </Link>
                </div>
              )}

              {/* STUDENT / ADMIN / LOGGED-OUT VIEW */}
              {!isInstructorViewer && (
                <>
                  {price === 0 ? (
                    <div className="font-display font-extrabold text-3xl text-black-900">
                      Free
                    </div>
                  ) : hasDiscount ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-black-400 line-through text-lg">
                        ${price}
                      </span>
                      <span className="font-display font-extrabold text-3xl text-black-900">
                        ${finalPrice}
                      </span>
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {discount}% OFF
                      </span>
                    </div>
                  ) : (
                    <div className="font-display font-extrabold text-3xl text-black-900">
                      ${price}
                    </div>
                  )}
                  {isPaid && (
                    <div className="text-xs text-black-500 mt-2">
                      One-time payment · Lifetime access
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    {firstFreeLesson && !data.enrolled && (
                      <button
                        onClick={() => goToLesson(firstFreeLesson)}
                        className="w-full border border-black-900 text-black-900 hover:bg-black-50 font-semibold py-3 rounded-xl transition"
                      >
                        Preview this course
                      </button>
                    )}

                    {!user ? (
                      <Link
                        to={`/login?redirect=/courses/${id}`}
                        className="block w-full text-center bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
                      >
                        Log in to {isPaid ? 'buy' : 'enroll'}
                      </Link>
                    ) : data.enrolled ? (
                      <>
                        <button
                          onClick={goToFirstLesson}
                          className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
                        >
                          Continue learning
                        </button>
                        <button
                          onClick={() => setUnenrollOpen(true)}
                          className="w-full text-sm text-black-500 hover:text-red-600 py-2"
                        >
                          Unenroll from this course
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEnrollClick}
                        className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
                      >
                        {data.previouslyPaid
                          ? 'Re-enroll (free)'
                          : isPaid
                          ? `Buy for $${finalPrice}`
                          : 'Enroll now'}
                      </button>
                    )}
                  </div>

                  <ul className="mt-6 pt-5 space-y-3 text-sm text-black-600 border-t border-black-100">
                    <li className="flex items-center gap-3">
                      <span>📚</span>
                      <span>{totalLessons} lessons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span>⏱️</span>
                      <span>Self-paced</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span>📱</span>
                      <span>Access on mobile and desktop</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span>🏆</span>
                      <span>Certificate on completion</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span>♾️</span>
                      <span>Lifetime access</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* TABS */}
      <div className="border-b border-black-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 md:px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t
                  ? 'border-black-900 text-black-900'
                  : 'border-transparent text-black-500 hover:text-black-900'
              }`}
            >
              {t}
              {t === 'Reviews' && reviewCount > 0 && (
                <span className="ml-2 text-xs text-black-400">({reviewCount})</span>
              )}
              {t === 'Announcements' && announcements.length > 0 && (
                <span className="ml-2 text-xs text-black-400">
                  ({announcements.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-black-200 rounded-2xl p-6 md:p-8">
        {tab === 'About' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="font-display font-bold text-2xl text-black-900 mb-3">
                About this course
              </h2>
              <p className="text-black-700 leading-relaxed">
                {data.description ||
                  'This course takes you from the fundamentals to real-world application. You will build projects, learn industry practices, and finish with a portfolio piece you are proud of.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black-50 rounded-xl p-5">
                <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-2">
                  Level
                </div>
                <div className="font-semibold text-black-900 capitalize">
                  {data.level}
                </div>
              </div>
              <div className="bg-black-50 rounded-xl p-5">
                <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-2">
                  Language
                </div>
                <div className="font-semibold text-black-900">{data.language}</div>
              </div>
              <div className="bg-black-50 rounded-xl p-5">
                <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-2">
                  Lessons
                </div>
                <div className="font-semibold text-black-900">{totalLessons}</div>
              </div>
              <div className="bg-black-50 rounded-xl p-5">
                <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-2">
                  Certificate
                </div>
                <div className="font-semibold text-black-900">Yes, on completion</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'What you will learn' && (
          <div className="max-w-3xl">
            <h2 className="font-display font-bold text-2xl text-black-900 mb-6">
              What you will learn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WHAT_YOU_LEARN.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-black-900 font-bold flex-shrink-0">✓</span>
                  <span className="text-black-700 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Modules' && (
          <div className="max-w-3xl">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display font-bold text-2xl text-black-900">
                Course content
              </h2>
              <span className="text-sm text-black-500">
                {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
              </span>
            </div>

            {totalLessons === 0 && (
              <p className="text-black-500">No lessons have been published yet.</p>
            )}

            <div className="space-y-4">
              {data.sections?.map((section) => (
                <div
                  key={section._id}
                  className="border border-black-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-black-50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-display font-bold text-black-900">
                        {section.title}
                      </div>
                      {section.description && (
                        <div className="text-xs text-black-500 mt-0.5">
                          {section.description}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-black-500">
                      {section.lessons.length} lesson
                      {section.lessons.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="divide-y divide-black-100">
                    {section.lessons.map((lesson, i) => (
                      <div
                        key={lesson._id}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-black-400 font-mono text-sm w-6 text-right flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-black-900 truncate">
                              {lesson.title}
                            </div>
                            <div className="text-xs text-black-500 mt-0.5">
                              {lesson.duration
                                ? `${Math.round(lesson.duration / 60)} min`
                                : 'Lesson'}
                              {lesson.isFree && (
                                <span className="ml-3 text-green-700 font-semibold">
                                  Free preview
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {lesson.isFree || data.enrolled || isOwnCourse ? (
                            <button
                              onClick={() => goToLesson(lesson)}
                              className="text-sm font-semibold text-black-900 hover:underline"
                            >
                              {lesson.isFree && !data.enrolled && !isOwnCourse
                                ? 'Preview'
                                : 'Start'}
                            </button>
                          ) : (
                            <span className="text-black-400 text-lg">🔒</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Instructor' && (
          <div className="max-w-3xl">
            <h2 className="font-display font-bold text-2xl text-black-900 mb-6">
              Instructor
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-black-900 text-white flex items-center justify-center font-display font-extrabold text-3xl flex-shrink-0 overflow-hidden">
                {data.instructor?.avatarUrl ? (
                  <img
                    src={data.instructor.avatarUrl}
                    alt={data.instructor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  data.instructor?.name?.[0] || 'I'
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-display font-bold text-xl text-black-900">
                    {data.instructor?.name || 'Instructor'}
                  </span>
                  {data.instructor?._id && (
                    <Link
                      to={`/instructors/${data.instructor._id}`}
                      className="text-sm text-black-900 font-semibold hover:underline"
                    >
                      View profile →
                    </Link>
                  )}
                </div>
                <p className="text-black-700 leading-relaxed">
                  {data.instructor?.bio ||
                    'Experienced professional passionate about teaching. Has helped thousands of students learn practical, job-ready skills.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'Reviews' && (
          <div className="max-w-3xl">
            <div className="flex items-baseline gap-6 mb-8 flex-wrap">
              <div>
                <div className="font-display font-extrabold text-5xl text-black-900">
                  {avgRating.toFixed(1)}
                </div>
                <div className="mt-2">
                  <Stars value={avgRating} size="lg" />
                </div>
                <div className="text-sm text-black-500 mt-2">
                  {reviewCount} review{reviewCount === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs text-black-500 w-8">{star} ★</span>
                      <div className="flex-1 h-1.5 bg-black-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-black-500 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {data.enrolled && user && (
              <form
                onSubmit={submitReview}
                className="bg-black-50 border border-black-100 rounded-2xl p-6 mb-8"
              >
                <h3 className="font-display font-bold text-lg text-black-900 mb-4">
                  {myReviewRes ? 'Update your review' : 'Leave a review'}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-black-800 mb-2">
                    Your rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`text-3xl transition ${
                          star <= reviewForm.rating
                            ? 'text-yellow-500'
                            : 'text-black-200'
                        } hover:scale-110`}
                        aria-label={`${star} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-black-800 mb-2">
                    Comment (optional)
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                    placeholder="Share what you think about this course..."
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  {myReviewRes && (
                    <button
                      type="button"
                      onClick={deleteMyReview}
                      className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-white text-black-700 font-medium transition"
                    >
                      Delete review
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                  >
                    {submitting
                      ? 'Submitting...'
                      : myReviewRes
                      ? 'Update review'
                      : 'Submit review'}
                  </button>
                </div>
              </form>
            )}

            {!data.enrolled && (
              <div className="bg-black-50 border border-black-100 rounded-2xl p-5 text-sm text-black-600 mb-8">
                Only enrolled students can leave a review.
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center text-black-500 py-8">
                No reviews yet. Be the first to share your thoughts.
              </div>
            ) : (
              <div className="space-y-5">
                {reviews.map((r) => (
                  <div key={r._id} className="border border-black-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-black-900 text-white flex items-center justify-center font-semibold">
                        {r.student?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-black-900 text-sm">
                          {r.student?.name || 'Student'}
                        </div>
                        <div className="text-xs text-black-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="text-black-700 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Announcements' && (
          <div className="max-w-3xl">
            <h2 className="font-display font-bold text-2xl text-black-900 mb-6">
              Announcements
            </h2>

            {announcements.length === 0 ? (
              <div className="text-center text-black-500 py-8">
                No announcements yet.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a._id} className="border border-black-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-black-900 text-white flex items-center justify-center font-semibold text-sm">
                        {a.instructor?.name?.[0] || 'I'}
                      </div>
                      <div>
                        <div className="font-semibold text-black-900 text-sm">
                          {a.instructor?.name || 'Instructor'}
                        </div>
                        <div className="text-xs text-black-500">
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-display font-bold text-lg text-black-900 mt-2">
                      {a.title}
                    </div>
                    <p className="text-black-700 leading-relaxed mt-2 whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Chat' && (
          <div>
            {user ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16 text-sm text-black-500">
                    Loading chat…
                  </div>
                }
              >
                <CourseChat
                  courseId={id}
                  courseInstructorId={courseInstructorId}
                  courseTitle={data.title}
                />
              </Suspense>
            ) : (
              <div className="text-center py-8">
                <p className="text-black-500 mb-4">
                  Log in to join the course chat.
                </p>
                <Link
                  to={`/login?redirect=/courses/${id}`}
                  className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={unenrollOpen}
        onClose={() => setUnenrollOpen(false)}
        onConfirm={() => {
          setUnenrolling(true);
          unenrollMutation.mutate();
        }}
        loading={unenrolling}
        title="Unenroll from course"
        confirmLabel="Unenroll"
        message={
          data.previouslyPaid
            ? 'You will lose access for now, but you can re-enroll for free at any time because you already paid.'
            : 'You will lose access to the course. You can re-enroll at any time.'
        }
      />
    </div>
  );
}