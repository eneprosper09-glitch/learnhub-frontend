import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function LessonPlayer() {
  const { id: courseId, lessonId } = useParams();
  const nav = useNavigate();
  const [completing, setCompleting] = useState(false);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data),
  });

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => api.get(`/my/progress/${courseId}`).then((r) => r.data.data),
    retry: false,
  });

  const { data: playData, isLoading: loadingPlay, error: playError } = useQuery({
    queryKey: ['play', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/play`).then((r) => r.data.data),
    enabled: !!lessonId,
    retry: false,
  });

  const lessons = course?.lessons || [];
  const currentLesson = useMemo(
    () => lessons.find((l) => l._id === lessonId),
    [lessons, lessonId]
  );

  const currentIndex = lessons.findIndex((l) => l._id === lessonId);
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  useEffect(() => {
    if (!lessonId && lessons.length > 0) {
      nav(`/courses/${courseId}/lessons/${lessons[0]._id}`, { replace: true });
    }
  }, [lessonId, lessons, courseId, nav]);

  const isCompleted = progressData?.lessons?.find((l) => l._id === lessonId)?.completed;
  const isLocked = playError?.response?.status === 403;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/my/lessons/${lessonId}/complete`);
      toast.success('Lesson marked complete');
      refetchProgress();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setCompleting(false);
    }
  };

  if (loadingCourse) return <Spinner full />;
  if (!course) return <p className="text-slate-500">Course not found</p>;

  const progressPercent = progressData?.progressPercent || 0;
  const price = Number(course.price) || 0;
  const isPaid = price > 0;
  const firstFree = lessons.find((l) => l.isFree);

  return (
    <div className="space-y-4">
      <Link to={`/courses/${courseId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to course
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-xl overflow-hidden">
            {loadingPlay ? (
              <div className="w-full aspect-video flex items-center justify-center">
                <Spinner />
              </div>
            ) : isLocked ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-lg font-semibold mb-1">This lesson is locked</p>
                <p className="text-slate-300 text-sm mb-4">
                  {isPaid
                    ? `Buy this course for $${price} to unlock all lessons.`
                    : 'Enroll in this course to unlock all lessons.'}
                </p>
                <Link
                  to={isPaid ? `/checkout/${courseId}` : `/courses/${courseId}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
                >
                  {isPaid ? `Buy for $${price}` : 'Enroll now'}
                </Link>
                {firstFree && firstFree._id !== lessonId && (
                  <Link
                    to={`/courses/${courseId}/lessons/${firstFree._id}`}
                    className="mt-3 text-green-300 underline text-sm"
                  >
                    Or watch the free preview
                  </Link>
                )}
              </div>
            ) : playData?.videoUrl ? (
              <video
                key={lessonId}
                src={playData.videoUrl}
                controls
                className="w-full aspect-video"
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-white">
                No video available
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Progress</span>
              <span className="text-sm font-semibold text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <h2 className="text-xl font-bold mt-5">{currentLesson?.title}</h2>
            <p className="text-slate-600 mt-2">{currentLesson?.description}</p>

            <div className="flex items-center justify-between mt-5 gap-2 flex-wrap">
              <div className="flex gap-2">
                {prev && (
                  <button
                    onClick={() => nav(`/courses/${courseId}/lessons/${prev._id}`)}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                  >
                    ← Prev
                  </button>
                )}
                {next && (
                  <button
                    onClick={() => nav(`/courses/${courseId}/lessons/${next._id}`)}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                  >
                    Next →
                  </button>
                )}
              </div>

              {!isLocked &&
                (isCompleted ? (
                  <span className="text-sm text-green-600 font-medium">✅ Completed</span>
                ) : (
                  <button
                    onClick={markComplete}
                    disabled={completing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {completing ? 'Saving...' : 'Mark complete'}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 font-semibold">Curriculum</div>
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {lessons.map((lesson, i) => {
                const done = progressData?.lessons?.find((l) => l._id === lesson._id)?.completed;
                const active = lesson._id === lessonId;
                return (
                  <li key={lesson._id}>
                    <Link
                      to={`/courses/${courseId}/lessons/${lesson._id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        active ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-slate-400 w-6 text-right">{i + 1}.</span>
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {lesson.isFree && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          FREE
                        </span>
                      )}
                      {done ? (
                        <span className="text-green-600">✔</span>
                      ) : lesson.locked ? (
                        <span className="text-slate-400">🔒</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}