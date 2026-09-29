import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { RowSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';

function ProgressRing({ value }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - ((value || 0) / 100) * c;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="flex-shrink-0">
      <circle cx="30" cy="30" r={r} stroke="#e5e5e5" strokeWidth="5" fill="none" />
      <circle
        cx="30"
        cy="30"
        r={r}
        stroke="#0a0a0a"
        strokeWidth="5"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0a0a0a">
        {value || 0}%
      </text>
    </svg>
  );
}

export default function MyLearning() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unenrollTarget, setUnenrollTarget] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/enrollments/me').then((r) => r.data.data),
  });

  const { data: streakRes } = useQuery({
    queryKey: ['my-streak'],
    queryFn: () => api.get('/my/streak').then((r) => r.data.data),
  });

  const unenrollMutation = useMutation({
    mutationFn: (courseId) =>
      api.put(`/enrollments/${courseId}/unenroll`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Unenrolled');
      setUnenrollTarget(null);
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
    onSettled: () => setUnenrolling(false),
  });

  const confirmUnenroll = () => {
    if (!unenrollTarget) return;
    setUnenrolling(true);
    unenrollMutation.mutate(unenrollTarget.course?._id);
  };

  const items = Array.isArray(data) ? data : [];
  const inProgress = items.filter((e) => (e.progressPercent || 0) < 100).length;
  const completed = items.filter((e) => (e.progressPercent || 0) === 100).length;
  const firstName = (user?.name || 'learner').split(' ')[0];

  const currentStreak = streakRes?.currentStreak || 0;
  const longestStreak = streakRes?.longestStreak || 0;

  return (
    <div className="space-y-8">
      {/* DARK HEADER BAND */}
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-10 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-3">
              My learning
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight mb-3">
              Hi {firstName}, welcome back.
            </h1>
            <p className="text-white/70 max-w-xl text-sm md:text-base">
              Continue where you left off or explore new courses to keep growing.
            </p>
          </div>

          {/* STREAK CARD */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm flex items-center gap-5">
            <div className="text-4xl">🔥</div>
            <div>
              <div className="text-3xl font-extrabold">{currentStreak}</div>
              <div className="text-xs uppercase tracking-wider text-white/60 mt-0.5">
                Day streak
              </div>
              <div className="text-xs text-white/50 mt-1">
                Longest: {longestStreak} day{longestStreak === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 mt-8">
          <div>
            <div className="text-3xl font-extrabold">{items.length}</div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mt-1">
              Enrolled
            </div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <div className="text-3xl font-extrabold">{inProgress}</div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mt-1">
              In progress
            </div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <div className="text-3xl font-extrabold">{completed}</div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mt-1">
              Completed
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="bg-white border border-black-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="font-display font-bold text-xl text-black-900 mb-2">
            Nothing here yet
          </h2>
          <p className="text-black-500 mb-6 max-w-md mx-auto">
            Browse the catalog and enroll in your first course to get started.
          </p>
          <Link
            to="/courses"
            className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Explore courses
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl text-black-900 mb-4">
            In progress
          </h2>
          <div className="space-y-4">
            {items.map((e) => {
              const isComplete = (e.progressPercent || 0) === 100;
              return (
                <div
                  key={e._id}
                  className="bg-white border border-black-200 rounded-2xl p-5 flex items-center gap-5 hover:shadow-soft transition flex-wrap"
                >
                  <div className="w-40 h-24 bg-black-100 rounded-xl overflow-hidden flex-shrink-0">
                    {e.course?.thumbnailUrl ? (
                      <img
                        src={e.course.thumbnailUrl}
                        alt={e.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black-300 text-2xl">
                        🎓
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black-500 uppercase tracking-wider mb-1">
                      {e.course?.category?.name || 'Course'}
                    </div>
                    <Link
                      to={`/courses/${e.course?._id}`}
                      className="font-display font-bold text-lg text-black-900 hover:text-black-600 line-clamp-2"
                    >
                      {e.course?.title}
                    </Link>
                    <div className="text-sm text-black-500 mt-1">
                      {e.completedCount || 0} of {e.totalLessons || 0} lessons
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <Link
                        to={`/courses/${e.course?._id}`}
                        className="text-sm font-semibold text-black-900 hover:underline"
                      >
                        Resume →
                      </Link>
                      {isComplete && (
                        <Link
                          to={`/certificates/${e.course?._id}`}
                          className="text-sm font-semibold text-green-700 hover:underline"
                        >
                          🏆 View certificate
                        </Link>
                      )}
                      <button
                        onClick={() => setUnenrollTarget(e)}
                        className="text-sm text-black-500 hover:text-red-600"
                      >
                        Unenroll
                      </button>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <ProgressRing value={e.progressPercent || 0} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!unenrollTarget}
        onClose={() => setUnenrollTarget(null)}
        onConfirm={confirmUnenroll}
        loading={unenrolling}
        title="Unenroll from course"
        confirmLabel="Unenroll"
        message={
          unenrollTarget?.paid
            ? 'You will lose access for now, but you can re-enroll for free at any time because you already paid.'
            : 'You will lose access to the course. You can re-enroll at any time.'
        }
      />
    </div>
  );
}