import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unenrollOpen, setUnenrollOpen] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course', id] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['play'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
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
  if (!data) return <p className="text-slate-500">Course not found</p>;

  const price = Number(data.price) || 0;
  const isPaid = price > 0;
  const firstLesson = data.lessons?.[0];
  const firstFreeLesson = data.lessons?.find((l) => l.isFree);
  const unverified = user && !user.isEmailVerified;

  const goToFirstLesson = () => {
    if (firstLesson) nav(`/courses/${id}/lessons/${firstLesson._id}`);
  };

  const handleEnrollClick = () => {
    if (!user) {
      nav('/login');
      return;
    }
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

  const handleUnenroll = () => {
    setUnenrolling(true);
    unenrollMutation.mutate();
  };

  const enrollLabel = () => {
    if (data.previouslyPaid) return 'Re-enroll (free)';
    if (isPaid) return `Buy for $${price}`;
    return 'Enroll now';
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to courses
      </Link>

      {unverified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Your email is not verified yet. Check your inbox for a verification link before enrolling or uploading files.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
              {data.category?.name || 'Course'}
            </span>
            <h1 className="text-3xl font-bold mt-1">{data.title}</h1>
            <p className="text-slate-600 mt-3">{data.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
              <span>By {data.instructor?.name}</span>
              <span className="capitalize">{data.level}</span>
              <span>{data.language}</span>
              <span>{data.totalLessons} lessons</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Curriculum</h2>
            {data.lessons?.length === 0 && (
              <p className="text-slate-500 text-sm">No lessons published yet.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {data.lessons?.map((lesson, i) => (
                <li key={lesson._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-400 text-sm w-6 text-right">{i + 1}.</span>
                    <span className="text-slate-800 truncate">{lesson.title}</span>
                    {lesson.isFree && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Free preview
                      </span>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {lesson.isFree ? (
                      <button
                        onClick={() => nav(`/courses/${id}/lessons/${lesson._id}`)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md"
                      >
                        ▶ Play
                      </button>
                    ) : data.enrolled ? (
                      <button
                        onClick={() => nav(`/courses/${id}/lessons/${lesson._id}`)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md"
                      >
                        ▶ Play
                      </button>
                    ) : (
                      <span className="text-slate-400 text-sm">🔒</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm sticky top-6">
            <div className="aspect-video bg-slate-100">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
                  🎓
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {isPaid ? `$${price}` : 'Free'}
              </div>
              {isPaid && (
                <div className="text-xs text-slate-500 mb-4">
                  One-time payment. Lifetime access.
                </div>
              )}

              {firstFreeLesson && !data.enrolled && (
                <button
                  onClick={() => nav(`/courses/${id}/lessons/${firstFreeLesson._id}`)}
                  className="w-full mb-2 border border-green-500 text-green-700 hover:bg-green-50 font-medium py-2 rounded-lg"
                >
                  ▶ Watch free preview
                </button>
              )}

              {!user ? (
                <Link
                  to="/login"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg"
                >
                  Login to {isPaid ? 'buy' : 'enroll'}
                </Link>
              ) : data.enrolled ? (
                <>
                  <button
                    onClick={goToFirstLesson}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg"
                  >
                    Continue learning
                  </button>
                  <button
                    onClick={() => setUnenrollOpen(true)}
                    className="w-full mt-2 text-sm text-slate-500 hover:text-red-600"
                  >
                    Unenroll from this course
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEnrollClick}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg"
                >
                  {enrollLabel()}
                </button>
              )}

              {data.previouslyPaid && !data.enrolled && (
                <p className="text-xs text-green-600 mt-3">
                  You already own this course. Re-enroll for free.
                </p>
              )}

              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                <li>✅ Lifetime access</li>
                <li>✅ Progress tracking</li>
                <li>✅ {data.totalLessons} lessons</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={unenrollOpen}
        onClose={() => setUnenrollOpen(false)}
        onConfirm={handleUnenroll}
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