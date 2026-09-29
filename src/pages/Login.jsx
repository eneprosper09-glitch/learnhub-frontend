import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/courses';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      nav(redirect, { replace: true });
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 423) {
        toast.error(d?.message || 'Account locked. Try again later.');
      } else {
        toast.error(d?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black-900 p-4">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="text-4xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-black-900">LearnHub</h1>
          </Link>
          <p className="text-black-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-black-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border border-black-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black-900"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Link to="/forgot-password" className="text-sm text-black-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-black-900 hover:bg-black-800 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-sm mt-4 text-center text-black-600">
          No account?{' '}
          <Link to="/register" className="text-black-900 hover:underline font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}