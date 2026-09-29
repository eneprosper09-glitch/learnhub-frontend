import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PasswordChecklist from '../components/PasswordChecklist';
import { isStrongPassword } from '../utils/password';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get('role') === 'instructor' ? 'instructor' : 'student';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) {
      return toast.error('Password does not meet the requirements');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created. Check your email to verify.');
      nav('/login');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-black-200 rounded-2xl overflow-hidden shadow-card">
        <div className="hidden lg:flex flex-col justify-between bg-black-900 text-white p-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-display font-extrabold text-lg">LearnHub</span>
          </Link>

          <div>
            <h2 className="font-display font-extrabold text-3xl leading-tight mb-4">
              Learn without limits.
            </h2>
            <ul className="space-y-4 text-white/80">
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Access thousands of courses from top instructors</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Earn certificates that employers recognize</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Learn at your own pace, on any device</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Track your progress and grow your skills</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-white/50">Join over 120,000 learners on LearnHub.</p>
        </div>

        <div className="p-8 md:p-10">
          <div className="lg:hidden mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="font-display font-extrabold text-lg text-black-900">
                LearnHub
              </span>
            </Link>
          </div>

          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-2">
            Create your account
          </h1>
          <p className="text-black-500 text-sm mb-6">
            It's free and takes less than a minute.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black-700 mb-1.5">
                Full name
              </label>
              <input
                required
                className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <PasswordChecklist password={form.password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-black-700 mb-1.5">
                I want to
              </label>
              <select
                className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Learn new skills (Student)</option>
                <option value="instructor">Teach on LearnHub (Instructor)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !isStrongPassword(form.password)}
              className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-xs text-black-400 text-center leading-relaxed">
              By creating an account, you agree to LearnHub's Terms of Service and Privacy
              Policy.
            </p>
          </form>

          <p className="text-sm text-center text-black-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-black-900 hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}