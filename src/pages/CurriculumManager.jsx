import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyLessonForm = {
  title: '',
  description: '',
  videoUrl: '',
  videoPublicId: '',
  duration: 0,
  isFree: false,
  section: '',
};

const emptySectionForm = { title: '', description: '' };

export default function CurriculumManager() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [lessonModal, setLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [sectionModal, setSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(emptySectionForm);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null);

  const [announceModal, setAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', body: '' });
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  });

  const { data: announcementsRes, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['announcements', id],
    queryFn: () => api.get(`/announcements/course/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const sections = Array.isArray(course?.sections) ? course.sections : [];
  const announcements = Array.isArray(announcementsRes) ? announcementsRes : [];
  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['course-edit', id] });
    queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
  };

  // ----- SECTIONS -----
  const openCreateSection = () => {
    setEditingSection(null);
    setSectionForm(emptySectionForm);
    setSectionModal(true);
  };

  const openEditSection = (s) => {
    setEditingSection(s);
    setSectionForm({ title: s.title, description: s.description || '' });
    setSectionModal(true);
  };

  const submitSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSection) {
        await api.put(`/sections/${editingSection._id}`, sectionForm);
        toast.success('Section updated');
      } else {
        await api.post(`/sections/course/${id}`, sectionForm);
        toast.success('Section created');
      }
      setSectionModal(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSection = async () => {
    try {
      await api.delete(`/sections/${deleteSectionTarget._id}`);
      toast.success('Section deleted');
      setDeleteSectionTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ----- LESSONS -----
  const openCreateLesson = (sectionId) => {
    setEditingLesson(null);
    setLessonForm({ ...emptyLessonForm, section: sectionId || '' });
    setLessonModal(true);
  };

  const openEditLesson = (l) => {
    setEditingLesson(l);
    setLessonForm({
      title: l.title,
      description: l.description || '',
      videoUrl: l.videoUrl || '',
      videoPublicId: l.videoPublicId || '',
      duration: l.duration || 0,
      isFree: !!l.isFree,
      section: l.section || '',
    });
    setLessonModal(true);
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLessonForm((f) => ({
        ...f,
        videoUrl: data.data.url,
        videoPublicId: data.data.publicId,
        duration: Math.round(data.data.duration || 0),
      }));
      toast.success('Video uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson._id}`, lessonForm);
        toast.success('Lesson updated');
      } else {
        await api.post(`/courses/${id}/lessons`, lessonForm);
        toast.success('Lesson added');
      }
      setLessonModal(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteLesson = async () => {
    try {
      await api.delete(`/lessons/${deleteTarget._id}`);
      toast.success('Lesson deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ----- ANNOUNCEMENTS -----
  const submitAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnounce(true);
    try {
      await api.post(`/announcements/course/${id}`, announceForm);
      toast.success('Announcement posted');
      setAnnounceModal(false);
      setAnnounceForm({ title: '', body: '' });
      refetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setSavingAnnounce(false);
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${announcementId}`);
      toast.success('Announcement deleted');
      refetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (isLoading) return <Spinner full />;
  if (!course || typeof course !== 'object') {
    return <p className="text-black-500">Course not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/instructor" className="text-sm text-black-500 hover:text-black-800">
        ← Back to dashboard
      </Link>

      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
            Curriculum
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">
            {course.title}
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {sections.length} section{sections.length === 1 ? '' : 's'} ·{' '}
            {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateSection}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            + Section
          </button>
          <button
            onClick={() => setAnnounceModal(true)}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            📣 Announcement
          </button>
          <button
            onClick={() => openCreateLesson()}
            className="bg-white text-black-900 hover:bg-black-100 font-semibold px-4 py-2.5 rounded-xl transition text-sm whitespace-nowrap"
          >
            + Lesson
          </button>
        </div>
      </div>

      {/* SECTIONS + LESSONS */}
      <div className="space-y-5">
        {sections.length === 0 && (
          <div className="bg-white border-2 border-dashed border-black-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="font-display font-bold text-lg text-black-900 mb-2">
              No content yet
            </h3>
            <p className="text-black-500 mb-5 text-sm">
              Add your first section, then lessons inside it.
            </p>
            <button
              onClick={openCreateSection}
              className="bg-black-900 hover:bg-black-800 text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              + Add your first section
            </button>
          </div>
        )}

        {sections.map((section) => (
          <div
            key={section._id}
            className="bg-white border border-black-200 rounded-2xl overflow-hidden shadow-card"
          >
            <div className="bg-black-50 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-black-900 truncate">
                  {section.title}
                </div>
                {section.description && (
                  <div className="text-xs text-black-500 mt-0.5 truncate">
                    {section.description}
                  </div>
                )}
                <div className="text-xs text-black-500 mt-0.5">
                  {section.lessons.length} lesson
                  {section.lessons.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openCreateLesson(section._id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-black-900 hover:bg-black-800 text-white font-medium transition"
                >
                  + Lesson
                </button>
                <button
                  onClick={() => openEditSection(section)}
                  className="text-xs px-3 py-1.5 rounded-md border border-black-300 hover:bg-white font-medium text-black-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteSectionTarget(section)}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="divide-y divide-black-100">
              {section.lessons.length === 0 && (
                <div className="p-5 text-sm text-black-500 text-center">
                  No lessons in this section yet.
                </div>
              )}
              {section.lessons.map((lesson, i) => (
                <div
                  key={lesson._id}
                  className="p-4 md:p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-black-100 text-black-900 font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-black-900">
                        {lesson.title}
                      </div>
                      <div className="text-xs text-black-500 mt-0.5 flex items-center gap-3">
                        <span>
                          {lesson.duration ? `${lesson.duration}s` : 'No duration'}
                        </span>
                        {lesson.isFree && (
                          <span className="text-green-700 font-semibold">
                            Free preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditLesson(lesson)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(lesson)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ANNOUNCEMENTS LIST */}
      {announcements.length > 0 && (
        <div className="bg-white border border-black-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-black-900">
              Announcements
            </h2>
            <button
              onClick={() => setAnnounceModal(true)}
              className="text-xs font-semibold text-black-900 hover:underline"
            >
              + New announcement
            </button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a._id}
                className="border border-black-100 rounded-xl p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-black-900">{a.title}</div>
                  <div className="text-xs text-black-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                  <p className="text-sm text-black-700 mt-2 line-clamp-2">{a.body}</p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a._id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION MODAL */}
      <Modal
        open={sectionModal}
        onClose={() => setSectionModal(false)}
        title={editingSection ? 'Edit Section' : 'New Section'}
        size="sm"
      >
        <form onSubmit={submitSection} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Title
            </label>
            <input
              required
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={sectionForm.title}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={3}
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={sectionForm.description}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSectionModal(false)}
              className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : editingSection ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LESSON MODAL */}
      <Modal
        open={lessonModal}
        onClose={() => setLessonModal(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add Lesson'}
      >
        <form onSubmit={submitLesson} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Section
            </label>
            <select
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={lessonForm.section}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, section: e.target.value })
              }
            >
              <option value="">No section</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Title
            </label>
            <input
              required
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={lessonForm.description}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Video
            </label>
            {lessonForm.videoUrl && (
              <p className="text-xs text-black-500 mb-2 truncate">
                {lessonForm.videoUrl}
              </p>
            )}
            <input
              type="file"
              accept="video/*"
              className="block text-sm"
              onChange={(e) =>
                e.target.files[0] && uploadVideo(e.target.files[0])
              }
            />
            {uploading && (
              <p className="text-xs text-black-500 mt-2">Uploading...</p>
            )}
            <input
              type="text"
              placeholder="Or paste a video URL"
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 mt-3 text-sm focus:outline-none focus:ring-2 focus:ring-black-900"
              value={lessonForm.videoUrl}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, videoUrl: e.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-black-700">
            <input
              type="checkbox"
              checked={lessonForm.isFree}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, isFree: e.target.checked })
              }
              className="accent-black-900 w-4 h-4"
            />
            <span className="font-medium">Free preview lesson</span>
          </label>
          <div className="flex justify-end gap-3 pt-3 border-t border-black-100">
            <button
              type="button"
              onClick={() => setLessonModal(false)}
              className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : editingLesson ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ANNOUNCEMENT MODAL */}
      <Modal
        open={announceModal}
        onClose={() => setAnnounceModal(false)}
        title="Post an announcement"
      >
        <form onSubmit={submitAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Title
            </label>
            <input
              required
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={announceForm.title}
              onChange={(e) =>
                setAnnounceForm({ ...announceForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">
              Message
            </label>
            <textarea
              rows={6}
              required
              maxLength={2000}
              className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={announceForm.body}
              onChange={(e) =>
                setAnnounceForm({ ...announceForm, body: e.target.value })
              }
            />
            <div className="text-xs text-black-400 mt-1.5">
              {announceForm.body.length}/2000
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAnnounceModal(false)}
              className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAnnounce}
              className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
            >
              {savingAnnounce ? 'Posting...' : 'Post announcement'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteLesson}
        title="Delete Lesson"
        message={`Delete "${deleteTarget?.title}"?`}
      />

      <ConfirmDialog
        open={!!deleteSectionTarget}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={confirmDeleteSection}
        title="Delete Section"
        message={`Delete "${deleteSectionTarget?.title}"? Lessons inside will be moved to "Course content".`}
      />
    </div>
  );
}