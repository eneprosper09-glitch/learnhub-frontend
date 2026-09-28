import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function Checkout() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data.data),
  });

  const payMutation = useMutation({
    mutationFn: () =>
      api
        .post(`/enrollments/${courseId}/enroll`, {
          paid: true,
          amount: course?.price || 0,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Payment successful. You are now enrolled.');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      nav(`/courses/${courseId}`);
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        toast.error(data.message || 'Please verify your email first.');
      } else {
        toast.error(data?.message || 'Payment failed');
      }
    },
    onSettled: () => setProcessing(false),
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post('/auth/resend-verification', { email: course?.user?.email }).then((r) => r.data),
    onSuccess: () => toast.success('Verification email sent. Check your inbox.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend'),
  });

  if (isLoading) return <Spinner full />;
  if (!course) return <p className="text-slate-500">Course not found</p>;

  const price = Number(course.price) || 0;
  const firstFree = course.lessons?.find((l) => l.isFree);

  const handlePay = () => {
    setProcessing(true);
    payMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to={`/courses/${courseId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to course
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-slate-500 text-sm">Review your order before paying</p>
      </div>

      {needsVerification && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <div className="font-semibold mb-1">Email verification required</div>
          <p className="mb-3">
            You must verify your email address before enrolling. Check your inbox for a
            verification link, or click the button below to receive a new one.
          </p>
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex gap-4 p-5">
          <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl">
                🎓
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 line-clamp-2">{course.title}</div>
            <div className="text-xs text-slate-500 mt-1">By {course.instructor?.name}</div>
            <div className="text-xs text-slate-500">{course.totalLessons} lessons</div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 flex items-center justify-between">
          <span className="text-slate-600 text-sm">Course price</span>
          <span className="text-lg font-bold text-indigo-600">${price}</span>
        </div>
        <div className="border-t border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-indigo-600">${price}</span>
        </div>
      </div>

      {firstFree && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          Not ready to pay? You can{' '}
          <Link
            to={`/courses/${courseId}/lessons/${firstFree._id}`}
            className="font-medium underline"
          >
            watch the free preview
          </Link>{' '}
          first.
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        This is a simulated checkout. No money will be charged. Stripe will be integrated later without changing this page.
      </div>

      <div className="flex justify-end gap-2">
        <Link
          to={`/courses/${courseId}`}
          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          onClick={handlePay}
          disabled={processing}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
        >
          {processing ? 'Processing...' : `Pay $${price}`}
        </button>
      </div>
    </div>
  );
}