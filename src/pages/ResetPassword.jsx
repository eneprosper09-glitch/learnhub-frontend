import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import PasswordChecklist from '../components/PasswordChecklist';
import { isStrongPassword } from '../utils/password';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Missing reset token');
    if (!isStrongPassword(password)) {
      return toast.error('Password does not meet the requirements');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset. Please log in.');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-black-200 rounded-2xl overflow-hidden shadow-card">
        {/* LEFT: BENEFITS PANEL */}
        <div className="hidden lg:flex flex-col justify-between bg-black-900 text-white p-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-display font-extrabold text-lg">LearnHub</span>
          </Link>

          <div>
            <h2 className="font-display font-extrabold text-3xl leading-tight mb-4">
              Choose a strong password.
            </h2>
            <p className="text-white/80 leading-relaxed">
              Your new password must meet the following requirements. A strong password keeps
              your account and progress safe.
            </p>

            <ul className="space-y-4 text-white/80 mt-8">
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>At least 8 characters</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>An uppercase and a lowercase letter</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>At least one number</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>At least one special character</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-white/50">
            We will never ask for your password by email.
          </p>
        </div>

        {/* RIGHT: FORM */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:hidden mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="font-display font-extrabold text-lg text-black-900">
                LearnHub
              </span>
            </Link>
          </div>

          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-2">
            Set a new password
          </h1>
          <p className="text-black-500 text-sm mb-6">
            Choose a password you have not used before.
          </p>

          {!token ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800">
              <div className="font-semibold mb-1">Missing reset token</div>
              <p>
                This link is invalid. Request a new reset email from the{' '}
                <Link to="/forgot-password" className="font-semibold underline">
                  forgot password
                </Link>{' '}
                page.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  required
                  className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordChecklist password={password} />
              </div>

              <button
                type="submit"
                disabled={loading || !isStrongPassword(password)}
                className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          <p className="text-sm mt-6 text-center text-black-600">
            Remembered it?{' '}
            <Link to="/login" className="text-black-900 hover:underline font-semibold">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}