import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const SUBTABS = ['Overview', 'Notes', 'Bookmarks', 'Q&A'];

const formatTime = (seconds) => {
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);

  const [completing, setCompleting] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(true);
  const [subtab, setSubtab] = useState('Overview');

  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [savingBookmark, setSavingBookmark] = useState(false);

  const [questionForm, setQuestionForm] = useState({ title: '', body: '' });
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState({});

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data),
  });

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => api.get(`/my/progress/${courseId}`).then((r) => r.data.data),
    retry: false,
  });

  const {
    data: playData,
    isLoading: loadingPlay,
    error: playError,
  } = useQuery({
    queryKey: ['play', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/play`).then((r) => r.data.data),
    enabled: !!lessonId,
    retry: false,
  });

  const { data: notesRes, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => api.get(`/notes/lesson/${lessonId}`).then((r) => r.data.data),
    enabled: !!lessonId,
    retry: false,
  });

  const { data: bookmarksRes, refetch: refetchBookmarks } = useQuery({
    queryKey: ['bookmarks', lessonId],
    queryFn: () => api.get(`/bookmarks/lesson/${lessonId}`).then((r) => r.data.data),
    enabled: !!lessonId,
    retry: false,
  });

  const { data: questionsRes, refetch: refetchQuestions } = useQuery({
    queryKey: ['questions', lessonId],
    queryFn: () => api.get(`/questions/lesson/${lessonId}`).then((r) => r.data.data),
    enabled: !!lessonId,
  });

  const lessons = course?.lessons || [];
  const sections = course?.sections || [];
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
      nav(`/learn/${courseId}/${lessons[0]._id}`, { replace: true });
    }
  }, [lessonId, lessons, courseId, nav]);

  const isCompleted = progressData?.lessons?.find((l) => l._id === lessonId)?.completed;
  const isLocked = playError?.response?.status === 403;

  const notes = Array.isArray(notesRes) ? notesRes : [];
  const bookmarks = Array.isArray(bookmarksRes) ? bookmarksRes : [];
  const questions = Array.isArray(questionsRes) ? questionsRes : [];

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

  const saveNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSavingNote(true);
    try {
      if (editingNoteId) {
        await api.put(`/notes/${editingNoteId}`, { content: noteContent });
        toast.success('Note updated');
      } else {
        await api.post(`/notes/lesson/${lessonId}`, { content: noteContent });
        toast.success('Note saved');
      }
      setNoteContent('');
      setEditingNoteId(null);
      refetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSavingNote(false);
    }
  };

  const startEditNote = (n) => {
    setEditingNoteId(n._id);
    setNoteContent(n.content);
    setSubtab('Notes');
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success('Note deleted');
      refetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const addBookmark = async (e) => {
    e.preventDefault();
    const timestamp = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
    setSavingBookmark(true);
    try {
      await api.post(`/bookmarks/lesson/${lessonId}`, {
        timestamp,
        label: bookmarkLabel || `At ${formatTime(timestamp)}`,
      });
      toast.success('Bookmark added');
      setBookmarkLabel('');
      refetchBookmarks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSavingBookmark(false);
    }
  };

  const jumpToBookmark = (b) => {
    if (videoRef.current) {
      videoRef.current.currentTime = b.timestamp;
      videoRef.current.play();
    }
  };

  const deleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/bookmarks/${bookmarkId}`);
      toast.success('Bookmark deleted');
      refetchBookmarks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    setAskingQuestion(true);
    try {
      await api.post(`/questions/lesson/${lessonId}`, questionForm);
      toast.success('Question posted');
      setQuestionForm({ title: '', body: '' });
      refetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAskingQuestion(false);
    }
  };

  const submitAnswer = async (questionId) => {
    const body = answerDrafts[questionId];
    if (!body || !body.trim()) return;
    try {
      await api.post(`/questions/${questionId}/answer`, { body });
      toast.success('Answer posted');
      setAnswerDrafts((d) => ({ ...d, [questionId]: '' }));
      refetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const resolveQuestion = async (questionId) => {
    try {
      await api.put(`/questions/${questionId}/resolve`);
      refetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${questionId}`);
      toast.success('Question deleted');
      refetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loadingCourse) return <Spinner full />;
  if (!course) return <p className="text-black-500">Course not found</p>;

  const progressPercent = progressData?.progressPercent || 0;
  const price = Number(course.price) || 0;
  const discount = Number(course.discountPercent) || 0;
  const finalPrice =
    discount > 0 ? Math.round((price - (price * discount) / 100) * 100) / 100 : price;
  const isPaid = finalPrice > 0;

  return (
    <div className="space-y-4">
      <div className="bg-black-900 text-white rounded-2xl px-5 py-3 flex items-center gap-4">
        <Link
          to={`/courses/${courseId}`}
          className="text-sm text-white/80 hover:text-white inline-flex items-center gap-2 whitespace-nowrap"
        >
          ← <span className="hidden sm:inline">Back to course</span>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
            Course progress
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">
              {progressPercent}%
            </span>
          </div>
        </div>
        <div className="hidden md:block text-sm text-white/70 truncate max-w-xs">
          {course.title}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-2xl overflow-hidden">
            {loadingPlay ? (
              <div className="w-full aspect-video flex items-center justify-center">
                <Spinner />
              </div>
            ) : isLocked ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="text-5xl mb-3">🔒</div>
                <p className="text-lg font-semibold mb-1">This lesson is locked</p>
                <p className="text-white/70 text-sm mb-5 max-w-md">
                  {isPaid
                    ? `Buy this course for $${finalPrice} to unlock all lessons.`
                    : 'Enroll in this course to unlock all lessons.'}
                </p>
                <Link
                  to={isPaid ? `/checkout/${courseId}` : `/courses/${courseId}`}
                  className="bg-white text-black-900 hover:bg-black-100 px-6 py-3 rounded-xl font-semibold transition"
                >
                  {isPaid ? `Buy for $${finalPrice}` : 'Enroll now'}
                </Link>
              </div>
            ) : playData?.videoUrl ? (
              <video
                key={lessonId}
                ref={videoRef}
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

          <div className="bg-white border border-black-200 rounded-2xl overflow-hidden">
            <div className="flex border-b border-black-100 overflow-x-auto">
              {SUBTABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSubtab(t)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    subtab === t
                      ? 'border-black-900 text-black-900'
                      : 'border-transparent text-black-500 hover:text-black-900'
                  }`}
                >
                  {t}
                  {t === 'Notes' && notes.length > 0 && (
                    <span className="ml-2 text-xs text-black-400">
                      ({notes.length})
                    </span>
                  )}
                  {t === 'Bookmarks' && bookmarks.length > 0 && (
                    <span className="ml-2 text-xs text-black-400">
                      ({bookmarks.length})
                    </span>
                  )}
                  {t === 'Q&A' && questions.length > 0 && (
                    <span className="ml-2 text-xs text-black-400">
                      ({questions.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {subtab === 'Overview' && (
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-xs font-bold tracking-widest text-black-500 uppercase">
                      Lesson {currentIndex + 1} of {lessons.length}
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  <h1 className="font-display font-bold text-2xl text-black-900">
                    {currentLesson?.title}
                  </h1>
                  {currentLesson?.description && (
                    <p className="text-black-600 mt-3 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-black-100 gap-3 flex-wrap">
                    <div className="flex gap-2">
                      {prev && (
                        <button
                          onClick={() => nav(`/learn/${courseId}/${prev._id}`)}
                          className="px-4 py-2 rounded-xl border border-black-300 hover:bg-black-50 text-sm font-medium text-black-700 transition"
                        >
                          ← Previous
                        </button>
                      )}
                      {next && (
                        <button
                          onClick={() => nav(`/learn/${courseId}/${next._id}`)}
                          className="px-4 py-2 rounded-xl bg-black-900 hover:bg-black-800 text-white text-sm font-medium transition"
                        >
                          Next lesson →
                        </button>
                      )}
                    </div>

                    {!isLocked && !isCompleted && (
                      <button
                        onClick={markComplete}
                        disabled={completing}
                        className="border border-black-300 hover:bg-black-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-black-800 disabled:opacity-50 transition"
                      >
                        {completing ? 'Saving...' : 'Mark as complete'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {subtab === 'Notes' && (
                <div>
                  <form onSubmit={saveNote} className="mb-6">
                    <label className="block text-sm font-semibold text-black-800 mb-2">
                      {editingNoteId ? 'Edit note' : 'Add a private note'}
                    </label>
                    <textarea
                      rows={4}
                      maxLength={5000}
                      className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                      placeholder="Write anything you want to remember about this lesson..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-black-400">
                        {noteContent.length}/5000 · Only you can see these
                      </span>
                      <div className="flex gap-2">
                        {editingNoteId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteContent('');
                            }}
                            className="px-4 py-2 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-sm text-black-700 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={savingNote || !noteContent.trim()}
                          className="px-5 py-2 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold text-sm disabled:opacity-50 transition"
                        >
                          {savingNote ? 'Saving...' : editingNoteId ? 'Update' : 'Save note'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {notes.length === 0 ? (
                    <div className="text-center text-black-500 py-6 text-sm">
                      You have not written any notes for this lesson yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div
                          key={n._id}
                          className="border border-black-100 rounded-xl p-4"
                        >
                          <p className="text-black-800 whitespace-pre-wrap">
                            {n.content}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-black-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEditNote(n)}
                                className="text-xs font-semibold text-black-700 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteNote(n._id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subtab === 'Bookmarks' && (
                <div>
                  <form onSubmit={addBookmark} className="mb-6">
                    <label className="block text-sm font-semibold text-black-800 mb-2">
                      Bookmark a moment in this video
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="text"
                        className="flex-1 min-w-[200px] border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                        placeholder="Label (optional)"
                        value={bookmarkLabel}
                        onChange={(e) => setBookmarkLabel(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={savingBookmark}
                        className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                      >
                        {savingBookmark ? 'Saving...' : 'Add at current time'}
                      </button>
                    </div>
                    <p className="text-xs text-black-400 mt-2">
                      Tip: pause the video at the moment you want to save.
                    </p>
                  </form>

                  {bookmarks.length === 0 ? (
                    <div className="text-center text-black-500 py-6 text-sm">
                      No bookmarks yet for this lesson.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((b) => (
                        <div
                          key={b._id}
                          className="flex items-center justify-between gap-3 border border-black-100 rounded-xl p-3"
                        >
                          <button
                            onClick={() => jumpToBookmark(b)}
                            className="flex items-center gap-3 flex-1 text-left min-w-0"
                          >
                            <span className="w-14 h-9 rounded-lg bg-black-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              ▶
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-black-900 truncate">
                                {b.label || formatTime(b.timestamp)}
                              </div>
                              <div className="text-xs text-black-500">
                                {formatTime(b.timestamp)}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => deleteBookmark(b._id)}
                            className="text-xs font-semibold text-red-600 hover:underline flex-shrink-0"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subtab === 'Q&A' && (
                <div>
                  {!isLocked && (
                    <form onSubmit={submitQuestion} className="mb-6">
                      <label className="block text-sm font-semibold text-black-800 mb-2">
                        Ask a question about this lesson
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        className="w-full border border-black-300 rounded-xl px-4 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-black-900"
                        placeholder="Title"
                        value={questionForm.title}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, title: e.target.value })
                        }
                      />
                      <textarea
                        rows={3}
                        required
                        maxLength={2000}
                        className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                        placeholder="Describe your question in detail..."
                        value={questionForm.body}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, body: e.target.value })
                        }
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={askingQuestion}
                          className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                        >
                          {askingQuestion ? 'Posting...' : 'Post question'}
                        </button>
                      </div>
                    </form>
                  )}

                  {questions.length === 0 ? (
                    <div className="text-center text-black-500 py-6 text-sm">
                      No questions yet. Be the first to ask.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q) => (
                        <div
                          key={q._id}
                          className={`border rounded-2xl p-5 ${
                            q.isResolved
                              ? 'border-green-200 bg-green-50/40'
                              : 'border-black-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-black-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {q.student?.name?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-black-900 text-sm">
                                  {q.student?.name || 'Student'}
                                </span>
                                <span className="text-xs text-black-500">
                                  {new Date(q.createdAt).toLocaleString()}
                                </span>
                                {q.isResolved && (
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                    ✓ Resolved
                                  </span>
                                )}
                              </div>
                              <div className="font-display font-bold text-lg text-black-900 mt-1">
                                {q.title}
                              </div>
                              <p className="text-black-700 leading-relaxed mt-1 whitespace-pre-wrap">
                                {q.body}
                              </p>
                            </div>
                          </div>

                          {q.answers.length > 0 && (
                            <div className="ml-12 space-y-3 mt-4 pt-4 border-t border-black-100">
                              {q.answers.map((a, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                      a.isInstructorAnswer
                                        ? 'bg-green-600 text-white'
                                        : 'bg-black-100 text-black-700'
                                    }`}
                                  >
                                    {a.user?.name?.[0] || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-black-900 text-sm">
                                        {a.user?.name || 'User'}
                                      </span>
                                      {a.isInstructorAnswer && (
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-green-700">
                                          Instructor
                                        </span>
                                      )}
                                      <span className="text-xs text-black-500">
                                        {new Date(a.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-black-700 leading-relaxed mt-1 whitespace-pre-wrap">
                                      {a.body}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Answer form for logged-in users */}
                          {user && !isLocked && (
                            <div className="ml-12 mt-4">
                              <textarea
                                rows={2}
                                maxLength={2000}
                                className="w-full border border-black-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black-900"
                                placeholder="Write a reply..."
                                value={answerDrafts[q._id] || ''}
                                onChange={(e) =>
                                  setAnswerDrafts((d) => ({
                                    ...d,
                                    [q._id]: e.target.value,
                                  }))
                                }
                              />
                              <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                                <div className="flex gap-3">
                                  {String(q.student?._id) === String(user._id) && (
                                    <button
                                      onClick={() => resolveQuestion(q._id)}
                                      className="text-xs font-semibold text-black-700 hover:underline"
                                    >
                                      {q.isResolved ? 'Mark unresolved' : 'Mark resolved'}
                                    </button>
                                  )}
                                  {(String(q.student?._id) === String(user._id) ||
                                    user.role === 'admin') && (
                                    <button
                                      onClick={() => deleteQuestion(q._id)}
                                      className="text-xs font-semibold text-red-600 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={() => submitAnswer(q._id)}
                                  className="px-4 py-1.5 rounded-lg bg-black-900 hover:bg-black-800 text-white font-semibold text-xs transition"
                                >
                                  Post reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-black-200 rounded-2xl overflow-hidden lg:sticky lg:top-24">
            <div className="px-5 py-4 border-b border-black-100">
              <div className="text-xs font-bold tracking-widest text-black-500 uppercase">
                Course content
              </div>
              <div className="font-semibold text-black-900 mt-1 truncate">
                {course.title}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {sections.map((section) => (
                <div key={section._id}>
                  <button
                    onClick={() => setModuleOpen((v) => !v)}
                    className="w-full px-5 py-3 flex items-center justify-between bg-black-50 hover:bg-black-100 transition"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-black-900 text-sm truncate">
                        {section.title}
                      </div>
                      <div className="text-xs text-black-500 mt-0.5">
                        {section.lessons.length} lesson
                        {section.lessons.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span className="text-black-500 text-xs">
                      {moduleOpen ? '▾' : '▸'}
                    </span>
                  </button>
                  {moduleOpen && (
                    <ul className="divide-y divide-black-100">
                      {section.lessons.map((lesson, i) => {
                        const done = progressData?.lessons?.find(
                          (l) => l._id === lesson._id
                        )?.completed;
                        const active = lesson._id === lessonId;
                        return (
                          <li key={lesson._id}>
                            <Link
                              to={`/learn/${courseId}/${lesson._id}`}
                              className={`flex items-start gap-3 px-5 py-3 text-sm transition ${
                                active
                                  ? 'bg-black-900 text-white'
                                  : 'hover:bg-black-50 text-black-800'
                              }`}
                            >
                              <span
                                className={`font-mono text-xs mt-0.5 flex-shrink-0 ${
                                  active ? 'text-white/60' : 'text-black-400'
                                }`}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">
                                  {lesson.title}
                                </div>
                                <div
                                  className={`text-xs mt-0.5 flex items-center gap-2 ${
                                    active ? 'text-white/60' : 'text-black-500'
                                  }`}
                                >
                                  <span>
                                    {lesson.duration
                                      ? `${Math.round(lesson.duration / 60)} min`
                                      : 'Lesson'}
                                  </span>
                                  {lesson.isFree && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        active
                                          ? 'bg-white/20 text-white'
                                          : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>
                              {done ? (
                                <span
                                  className={`text-base flex-shrink-0 ${
                                    active ? 'text-green-300' : 'text-green-600'
                                  }`}
                                >
                                  ✓
                                </span>
                              ) : lesson.locked ? (
                                <span
                                  className={`text-base flex-shrink-0 ${
                                    active ? 'text-white/60' : 'text-black-400'
                                  }`}
                                >
                                  🔒
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}