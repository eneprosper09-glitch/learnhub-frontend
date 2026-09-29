import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
              Forgot your password?
            </h2>
            <p className="text-white/80 leading-relaxed">
              It happens to everyone. Enter the email address on your account and we will send
              you a secure link to set a new password.
            </p>

            <ul className="space-y-4 text-white/80 mt-8">
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>The link expires in 1 hour</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>We will never email your password</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Your existing sessions stay signed in</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-white/50">
            Need a new account? Register instead.
          </p>
        </div>

        {/* RIGHT: FORM */}
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
            Reset your password
          </h1>
          <p className="text-black-500 text-sm mb-6">
            Enter your email and we will send a reset link.
          </p>

          {!sent ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-black-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800">
              <div className="font-semibold mb-1">Check your inbox</div>
              <p>
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
                It may take a minute to arrive. Check your spam folder if you do not see it.
              </p>
            </div>
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