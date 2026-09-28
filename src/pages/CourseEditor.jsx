import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function CourseEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    level: 'beginner',
    language: 'English',
    thumbnailUrl: '',
    thumbnailPublicId: '',
  });
  const [uploading, setUploading] = useState(false);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const { data: existing, isLoading } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing && typeof existing === 'object' && existing.title) {
      setForm({
        title: existing.title || '',
        description: existing.description || '',
        category: existing.category?._id || '',
        price: existing.price || 0,
        level: existing.level || 'beginner',
        language: existing.language || 'English',
        thumbnailUrl: existing.thumbnailUrl || '',
        thumbnailPublicId: existing.thumbnailPublicId || '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isNew
        ? api.post('/courses', payload).then((r) => r.data.data)
        : api.put(`/courses/${id}`, payload).then((r) => r.data.data),
    onSuccess: (data) => {
      toast.success(isNew ? 'Course created' : 'Course updated');
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      if (isNew && data?._id) {
        nav(`/instructor/courses/${data._id}/curriculum`);
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Save failed'),
  });

  const uploadThumbnail = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/thumbnail', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        thumbnailUrl: data.data.url,
        thumbnailPublicId: data.data.publicId,
      }));
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (!isNew && isLoading) return <Spinner full />;

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold">{isNew ? 'New Course' : 'Edit Course'}</h1>

      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
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
            rows={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (USD)</label>
            <input
              type="number"
              min={0}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail</label>
          {form.thumbnailUrl && (
            <img
              src={form.thumbnailUrl}
              alt="thumbnail"
              className="w-48 h-28 object-cover rounded-lg mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files[0] && uploadThumbnail(e.target.files[0])}
          />
          {uploading && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => nav('/instructor')}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : isNew ? 'Create' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}