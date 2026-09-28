import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = {
  title: '',
  description: '',
  videoUrl: '',
  videoPublicId: '',
  duration: 0,
  isFree: false,
};

export default function CurriculumManager() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
  });

  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['course-edit', id] });
    queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (l) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description || '',
      videoUrl: l.videoUrl || '',
      videoPublicId: l.videoPublicId || '',
      duration: l.duration || 0,
      isFree: !!l.isFree,
    });
    setModalOpen(true);
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/lessons/${editing._id}`, form);
        toast.success('Lesson updated');
      } else {
        await api.post(`/courses/${id}/lessons`, form);
        toast.success('Lesson added');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/lessons/${deleteTarget._id}`);
      toast.success('Lesson deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <Spinner full />;
  if (!course || typeof course !== 'object') {
    return <p className="text-slate-500">Course not found</p>;
  }

  return (
    <div className="space-y-5">
      <Link to="/instructor" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to dashboard
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-slate-500 text-sm">{lessons.length} lessons</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg"
        >
          + Add Lesson
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {lessons.length === 0 && (
          <p className="p-6 text-slate-500 text-sm">No lessons yet. Add your first lesson.</p>
        )}
        {lessons.map((l, i) => (
          <div key={l._id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-slate-400 w-6 text-right">{i + 1}.</span>
              <div className="min-w-0">
                <div className="font-medium truncate">{l.title}</div>
                <div className="text-xs text-slate-500">
                  {l.duration ? `${l.duration}s` : 'No duration'}
                  {l.isFree && (
                    <span className="ml-2 text-green-600 font-medium">Free preview</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(l)}
                className="text-sm px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(l)}
                className="text-sm px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Lesson' : 'Add Lesson'}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Video</label>
            {form.videoUrl && (
              <p className="text-xs text-slate-500 mb-1 truncate">{form.videoUrl}</p>
            )}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files[0] && uploadVideo(e.target.files[0])}
            />
            {uploading && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
            <input
              type="text"
              placeholder="Or paste video URL"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-2 text-sm"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
              />
              Free preview lesson
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Lesson"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
}