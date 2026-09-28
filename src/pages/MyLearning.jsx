import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { RowSkeleton } from '../components/Skeleton';

function ProgressRing({ value }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - ((value || 0) / 100) * c;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} stroke="#e2e8f0" strokeWidth="6" fill="none" />
      <circle
        cx="36"
        cy="36"
        r={r}
        stroke="#4f46e5"
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#0f172a"
      >
        {value || 0}%
      </text>
    </svg>
  );
}

export default function MyLearning() {
  const queryClient = useQueryClient();
  const [unenrollTarget, setUnenrollTarget] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/enrollments/me').then((r) => r.data.data),
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="text-slate-500 text-sm">Continue where you left off</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-slate-500">You have not enrolled in any course yet.</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Browse courses
          </Link>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((e) => (
            <div
              key={e._id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {e.course?.thumbnailUrl ? (
                  <img
                    src={e.course.thumbnailUrl}
                    alt={e.course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl">
                    🎓
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/courses/${e.course?._id}`}
                  className="font-semibold hover:text-indigo-600 line-clamp-2"
                >
                  {e.course?.title}
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                  {e.completedCount} of {e.totalLessons} lessons
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Link
                    to={`/courses/${e.course?._id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Continue →
                  </Link>
                  <button
                    onClick={() => setUnenrollTarget(e)}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Unenroll
                  </button>
                </div>
              </div>
              <ProgressRing value={e.progressPercent} />
            </div>
          ))}
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