import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
  });

  const { data: enrollmentsRes } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/enrollments/me').then((r) => r.data.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/me', payload).then((r) => r.data),
    onSuccess: async () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      if (refreshUser) await refreshUser();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    saveMutation.mutate(form, {
      onSettled: () => setSaving(false),
    });
  };

  const uploadAvatarFile = async (file) => {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, avatarUrl: data.data.url }));
      // Auto-save the avatar to the profile
      await api.put('/auth/me', { avatarUrl: data.data.url });
      toast.success('Avatar updated');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      if (refreshUser) await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setForm((f) => ({ ...f, avatarUrl: '' }));
    try {
      await api.put('/auth/me', { avatarUrl: '' });
      toast.success('Avatar removed');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      if (refreshUser) await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (isLoading) return <Spinner full />;

  const enrollments = Array.isArray(enrollmentsRes) ? enrollmentsRes : [];
  const inProgress = enrollments.filter((e) => (e.progressPercent || 0) < 100).length;
  const completed = enrollments.filter((e) => (e.progressPercent || 0) === 100).length;
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <div className="space-y-8">
      {/* DARK HERO */}
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-10 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-display font-extrabold text-4xl flex-shrink-0 overflow-hidden">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.name}
                className="w-full h-full object-cover"
              />
            ) : (
              form.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
              My profile
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight truncate">
              {form.name || 'Your name'}
            </h1>
            <p className="text-white/70 text-sm mt-2">
              {profile?.email} · joined {joined}
            </p>
            <span className="inline-block mt-3 text-xs font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full">
              {profile?.role}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 mt-8">
          <div>
            <div className="text-3xl font-extrabold">{enrollments.length}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form
            onSubmit={onSubmit}
            className="bg-white border border-black-200 rounded-2xl p-6 md:p-8 shadow-card space-y-6"
          >
            <div>
              <h2 className="font-display font-bold text-xl text-black-900 mb-1">
                Edit your details
              </h2>
              <p className="text-black-500 text-sm">
                Update your name, bio, and profile picture.
              </p>
            </div>

            {/* AVATAR UPLOAD */}
            <div>
              <label className="block text-sm font-semibold text-black-800 mb-3">
                Profile picture
              </label>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-20 h-20 rounded-full bg-black-100 border border-black-200 flex items-center justify-center font-display font-extrabold text-2xl text-black-700 overflow-hidden flex-shrink-0">
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    form.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files[0] && uploadAvatarFile(e.target.files[0])
                    }
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-4 py-2 rounded-xl bg-black-900 hover:bg-black-800 text-white font-medium text-sm disabled:opacity-50 transition"
                    >
                      {uploadingAvatar
                        ? 'Uploading...'
                        : form.avatarUrl
                        ? 'Change picture'
                        : 'Upload picture'}
                    </button>
                    {form.avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="px-4 py-2 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-sm text-black-700 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-black-400">
                    JPG, PNG, or WEBP. Max 5 MB. Square images work best.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black-800 mb-1.5">
                Full name
              </label>
              <input
                required
                className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black-800 mb-1.5">
                Bio
              </label>
              <textarea
                rows={4}
                maxLength={300}
                className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                placeholder="Tell the LearnHub community a little about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <div className="text-xs text-black-400 mt-1.5">
                {form.bio.length}/300 characters
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          {/* ACCOUNT */}
          <div className="bg-white border border-black-200 rounded-2xl p-6 md:p-8 shadow-card mt-6">
            <h2 className="font-display font-bold text-xl text-black-900 mb-5">
              Account
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-black-100">
                <span className="text-black-500">Email</span>
                <span className="font-medium text-black-900">{profile?.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black-100">
                <span className="text-black-500">Role</span>
                <span className="font-medium text-black-900 capitalize">
                  {profile?.role}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black-100">
                <span className="text-black-500">Email verified</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    profile?.isEmailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {profile?.isEmailVerified ? 'Verified' : 'Not verified'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-black-500">Member since</span>
                <span className="font-medium text-black-900">{joined}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-black-200 rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-bold text-base text-black-900 mb-4">
              Quick links
            </h3>
            <div className="space-y-2">
              <Link
                to="/my-learning"
                className="block px-4 py-3 rounded-xl border border-black-200 hover:bg-black-50 font-medium text-black-800 text-sm transition"
              >
                📚 My Learning
              </Link>
              <Link
                to="/courses"
                className="block px-4 py-3 rounded-xl border border-black-200 hover:bg-black-50 font-medium text-black-800 text-sm transition"
              >
                🔍 Browse courses
              </Link>
              {(user?.role === 'instructor' || user?.role === 'admin') && (
                <>
                  <Link
                    to="/instructor"
                    className="block px-4 py-3 rounded-xl border border-black-200 hover:bg-black-50 font-medium text-black-800 text-sm transition"
                  >
                    🎓 Instructor dashboard
                  </Link>
                  <Link
                    to={`/instructors/${user._id}`}
                    className="block px-4 py-3 rounded-xl border border-black-200 hover:bg-black-50 font-medium text-black-800 text-sm transition"
                  >
                    👁️ View public profile
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="bg-black-50 border border-black-100 rounded-2xl p-5">
            <h3 className="font-display font-bold text-base text-black-900 mb-3">
              Tips
            </h3>
            <ul className="space-y-3 text-sm text-black-600">
              <li className="flex gap-3">
                <span className="text-black-900">💡</span>
                <span>A complete profile helps instructors and peers recognize you.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-black-900">🎯</span>
                <span>Your progress and certificates are linked to your account.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-black-900">🔒</span>
                <span>Your email is never shown publicly.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}