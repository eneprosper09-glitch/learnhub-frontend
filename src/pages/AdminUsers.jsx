import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, roleFilter }],
    queryFn: () =>
      api
        .get('/admin/users', { params: { search, role: roleFilter, limit: 50 } })
        .then((r) => r.data.data),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success('Role updated');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      toast.success('Status updated');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const approveInstructor = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve-instructor`);
      toast.success('Instructor approved');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/admin/invite', { email: inviteEmail });
      toast.success('Invitation sent');
      setInviteOpen(false);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setInviting(false);
    }
  };

  const handleImportFile = async (file) => {
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/admin/import/users', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data.data);
      toast.success(`Imported ${data.data.created} of ${data.data.total}`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadImportedPasswords = () => {
    if (!importResult?.createdUsers) return;
    const rows = importResult.createdUsers.filter((u) => u.generated);
    if (rows.length === 0) {
      toast.error('No generated passwords to download');
      return;
    }
    const header = 'Name,Email,Role,Password';
    const body = rows
      .map(
        (u) =>
          `"${u.name}","${u.email}","${u.role}","${u.password}"`
      )
      .join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnhub-imported-passwords-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExport = async (type) => {
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnhub-${type}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${type}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  };

  if (isLoading) return <Spinner full />;

  const users = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
            Admin
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Users</h1>
          <p className="text-white/70 text-sm mt-1">
            {users.length} user{users.length === 1 ? '' : 's'} in the platform
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            ⬆ Import CSV
          </button>
          <button
            onClick={() => downloadExport('users')}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            ⬇ Export users
          </button>
          <button
            onClick={() => downloadExport('enrollments')}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
          >
            ⬇ Export enrollments
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="bg-white text-black-900 hover:bg-black-100 font-semibold px-4 py-2.5 rounded-xl transition text-sm whitespace-nowrap"
          >
            + Invite admin
          </button>
        </div>
      </div>

      <div className="bg-white border border-black-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-card">
        <input
          className="border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Name
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Email
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Role
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Status
              </th>
              <th className="bg-black-50 text-right px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-black-500">
                  No users match your filters.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-black-50/60">
                <td className="px-4 py-3 border-b border-black-100 font-medium text-black-900">
                  {u.name}
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-black-600">
                  {u.email}
                </td>
                <td className="px-4 py-3 border-b border-black-100">
                  <select
                    className="border border-black-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black-900"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    disabled={u._id === user._id}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin" disabled={u._id !== user._id}>
                      Admin
                    </option>
                  </select>
                </td>
                <td className="px-4 py-3 border-b border-black-100">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {u.role === 'instructor' && !u.isInstructorApproved && (
                    <span className="ml-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-right space-x-2 whitespace-nowrap">
                  {u.role === 'instructor' && !u.isInstructorApproved && (
                    <button
                      onClick={() => approveInstructor(u._id)}
                      className="text-xs px-3 py-1.5 rounded-md bg-black-900 hover:bg-black-800 text-white font-medium transition"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(u._id)}
                    disabled={u._id === user._id}
                    className="text-xs px-3 py-1.5 rounded-md border border-black-300 hover:bg-black-50 font-medium text-black-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a new admin"
        size="sm"
      >
        <form onSubmit={sendInvite} className="space-y-4">
          <p className="text-sm text-black-600">
            Enter the email of an existing user. They will receive an email to accept the admin
            role.
          </p>
          <input
            type="email"
            required
            className="w-full border border-black-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
            >
              {inviting ? 'Sending...' : 'Send invitation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportResult(null);
        }}
        title="Import users from CSV"
        size="lg"
      >
        <div className="space-y-5">
          <div className="bg-black-50 border border-black-100 rounded-xl p-4 text-sm text-black-700">
            <div className="font-semibold text-black-900 mb-2">CSV format</div>
            <p className="mb-2">
              Columns: <span className="font-mono">name</span>,{' '}
              <span className="font-mono">email</span>,{' '}
              <span className="font-mono">role</span> (optional),{' '}
              <span className="font-mono">password</span> (optional).
            </p>
            <p className="text-xs text-black-500">
              If password is missing, a strong one is generated and shown after import so you
              can share it with the user. Admin role cannot be created via import.
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleImportFile(e.target.files[0])}
            />
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
              >
                {importing ? 'Importing...' : 'Choose CSV file'}
              </button>
              {importResult?.createdUsers?.some((u) => u.generated) && (
                <button
                  type="button"
                  onClick={downloadImportedPasswords}
                  className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 transition"
                >
                  Download generated passwords
                </button>
              )}
            </div>
          </div>

          {importResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {importResult.created}
                  </div>
                  <div className="text-xs text-green-700 uppercase tracking-wider mt-1">
                    Created
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {importResult.failed}
                  </div>
                  <div className="text-xs text-red-700 uppercase tracking-wider mt-1">
                    Failed
                  </div>
                </div>
                <div className="bg-black-50 border border-black-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-black-900">
                    {importResult.total}
                  </div>
                  <div className="text-xs text-black-500 uppercase tracking-wider mt-1">
                    Total
                  </div>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-black-900 mb-2">
                    Errors
                  </div>
                  <div className="max-h-52 overflow-y-auto border border-red-100 rounded-xl divide-y divide-red-100 bg-red-50/30">
                    {importResult.errors.map((e, i) => (
                      <div key={i} className="p-3 text-xs flex gap-3">
                        <span className="font-mono text-black-500">
                          Line {e.line}
                        </span>
                        <span className="text-red-700 flex-1">{e.message}</span>
                        {e.email && (
                          <span className="text-black-500 truncate max-w-[150px]">
                            {e.email}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}