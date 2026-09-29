import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setName(c.name);
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, { name });
        toast.success('Category updated');
      } else {
        await api.post('/categories', { name });
        toast.success('Category created');
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
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      toast.success('Category deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (isLoading) return <Spinner full />;

  const items = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
            Admin
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Categories</h1>
          <p className="text-white/70 text-sm mt-1">
            {items.length} categor{items.length === 1 ? 'y' : 'ies'} on the platform
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white text-black-900 hover:bg-black-100 font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap"
        >
          + Add category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-full bg-white border-2 border-dashed border-black-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🏛️</div>
            <h3 className="font-display font-bold text-lg text-black-900 mb-2">
              No categories yet
            </h3>
            <p className="text-black-500 mb-5 text-sm">
              Categories help students find courses. Create your first one.
            </p>
            <button
              onClick={openCreate}
              className="bg-black-900 hover:bg-black-800 text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              + Add your first category
            </button>
          </div>
        )}
        {items.map((c) => (
          <div
            key={c._id}
            className="bg-white border border-black-200 rounded-2xl p-5 shadow-card hover:shadow-soft transition"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-black-900 text-white flex items-center justify-center font-display font-extrabold text-lg">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-black-500 font-mono">{c.slug}</span>
            </div>
            <div className="font-display font-bold text-lg text-black-900">{c.name}</div>
            <div className="flex gap-2 mt-5 pt-4 border-t border-black-100">
              <button
                onClick={() => openEdit(c)}
                className="text-sm px-3 py-1.5 rounded-lg border border-black-300 hover:bg-black-50 font-medium text-black-700 flex-1 transition"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium flex-1 transition"
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
        title={editing ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black-800 mb-1.5">Name</label>
            <input
              required
              className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}