import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing token');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now log in and enroll in courses.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token]);

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
              One step away.
            </h2>
            <p className="text-white/80 leading-relaxed">
              Verifying your email unlocks enrollment, progress tracking, and your certificate on
              completion.
            </p>

            <ul className="space-y-4 text-white/80 mt-8">
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Enroll in free and paid courses</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Track your progress across devices</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white">✓</span>
                <span>Unlock certificates and invoices</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-white/50">
            Join over 120,000 learners on LearnHub.
          </p>
        </div>

        {/* RIGHT: STATUS */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:hidden mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="font-display font-extrabold text-lg text-black-900">
                LearnHub
              </span>
            </Link>
          </div>

          {status === 'loading' && (
            <div className="text-center py-8">
              <Spinner />
              <p className="text-black-500 mt-4 text-sm">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl mb-5">
                ✓
              </div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-3">
                Email verified
              </h1>
              <p className="text-black-500 mb-8">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
              >
                Continue to login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-700 flex items-center justify-center text-3xl mb-5">
                ✕
              </div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-3">
                Verification failed
              </h1>
              <p className="text-black-500 mb-8">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3 rounded-xl transition"
              >
                Back to login
              </Link>
              <Link
                to="/contact"
                className="inline-block w-full text-center text-black-500 hover:text-black-900 text-sm mt-4"
              >
                Need help? Contact support
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}