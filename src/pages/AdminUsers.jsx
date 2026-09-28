import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

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

  if (isLoading) return <Spinner full />;

  const users = data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-slate-500 text-sm">{users.length} users</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg"
        >
          + Invite Admin
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-slate-300 rounded-lg px-3 py-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Name</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Email</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Role</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Status</th>
              <th className="bg-slate-50 text-right px-4 py-3 font-semibold text-slate-600 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 border-b border-slate-100 font-medium">{u.name}</td>
                <td className="px-4 py-3 border-b border-slate-100">{u.email}</td>
                <td className="px-4 py-3 border-b border-slate-100">
                  <select
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    disabled={u._id === user._id}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin" disabled={u._id !== user._id}>Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 border-b border-slate-100">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {u.role === 'instructor' && !u.isInstructorApproved && (
                    <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 border-b border-slate-100 text-right space-x-2">
                  {u.role === 'instructor' && !u.isInstructorApproved && (
                    <button
                      onClick={() => approveInstructor(u._id)}
                      className="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(u._id)}
                    disabled={u._id === user._id}
                    className="text-xs px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite New Admin" size="sm">
        <form onSubmit={sendInvite} className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter the email of an existing user. They will receive an email to accept the admin role.
          </p>
          <input
            type="email"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}