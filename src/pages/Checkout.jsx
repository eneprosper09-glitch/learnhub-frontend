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
    mutationFn: (amount) =>
      api
        .post(`/enrollments/${courseId}/enroll`, {
          paid: true,
          amount,
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
    mutationFn: () =>
      api
        .post('/auth/resend-verification', { email: course?.user?.email })
        .then((r) => r.data),
    onSuccess: () => toast.success('Verification email sent. Check your inbox.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend'),
  });

  if (isLoading) return <Spinner full />;
  if (!course) return <p className="text-black-500">Course not found</p>;

  const price = Number(course.price) || 0;
  const discount = Number(course.discountPercent) || 0;
  const finalPrice =
    discount > 0 ? Math.round((price - (price * discount) / 100) * 100) / 100 : price;
  const hasDiscount = discount > 0;
  const firstFree = course.lessons?.find((l) => l.isFree);

  const handlePay = () => {
    setProcessing(true);
    payMutation.mutate(finalPrice);
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/courses/${courseId}`}
        className="text-sm text-black-500 hover:text-black-800 inline-block"
      >
        ← Back to course
      </Link>

      <div className="border-b border-black-200 pb-6">
        <div className="text-xs font-semibold tracking-widest text-black-500 uppercase mb-2">
          Checkout
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
          Complete your enrollment
        </h1>
        <p className="text-black-600 mt-2 max-w-2xl">
          You are one step away from unlocking lifetime access to this course.
        </p>
      </div>

      {needsVerification && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800 max-w-3xl">
          <div className="font-semibold mb-1">Email verification required</div>
          <p className="mb-3">
            You must verify your email address before enrolling. Check your inbox for a
            verification link, or click the button below to receive a new one.
          </p>
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition"
          >
            {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <section>
            <h2 className="font-display font-bold text-lg text-black-900 mb-4 pb-2 border-b border-black-100">
              1. Learner information
            </h2>
            <div className="bg-black-50 border border-black-100 rounded-xl p-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black-500">Name</span>
                <span className="font-medium text-black-900">
                  {course.user?.name || 'You'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black-500">Email</span>
                <span className="font-medium text-black-900">
                  {course.user?.email || 'your email on file'}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-black-900 mb-4 pb-2 border-b border-black-100">
              2. Payment method
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 border-2 border-black-900 rounded-xl p-4 cursor-pointer bg-black-50/50">
                <input
                  type="radio"
                  name="payment"
                  defaultChecked
                  className="mt-1 accent-black-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-black-900">Simulated payment</div>
                  <p className="text-xs text-black-500 mt-1">
                    This is a development build. Stripe will replace this option later without
                    changing the layout.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 border border-black-200 rounded-xl p-4 cursor-not-allowed opacity-60">
                <input type="radio" name="payment" disabled className="mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-black-700">Credit or debit card</div>
                  <p className="text-xs text-black-500 mt-1">Coming soon</p>
                </div>
              </label>

              <label className="flex items-start gap-3 border border-black-200 rounded-xl p-4 cursor-not-allowed opacity-60">
                <input type="radio" name="payment" disabled className="mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-black-700">PayPal</div>
                  <p className="text-xs text-black-500 mt-1">Coming soon</p>
                </div>
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-black-900 mb-4 pb-2 border-b border-black-100">
              3. Review and confirm
            </h2>
            <ul className="space-y-2 text-sm text-black-600 list-disc pl-5">
              <li>You will get lifetime access to this course and all future updates.</li>
              <li>You can unenroll and re-enroll for free at any time.</li>
              <li>By completing the purchase you agree to LearnHub's terms of service.</li>
            </ul>

            {firstFree && (
              <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                Not ready to pay? You can{' '}
                <Link
                  to={`/learn/${courseId}/${firstFree._id}`}
                  className="font-semibold underline"
                >
                  preview a free lesson
                </Link>{' '}
                first.
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 border border-black-200 rounded-2xl overflow-hidden">
            <div className="relative aspect-video bg-black-100">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black-300 text-3xl">
                  🎓
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-semibold text-black-500 uppercase tracking-wider mb-1">
                  {course.category?.name || 'Course'}
                </div>
                <div className="font-display font-bold text-lg text-black-900 leading-snug">
                  {course.title}
                </div>
                <div className="text-sm text-black-500 mt-1">
                  By {course.instructor?.name || 'Instructor'}
                </div>
              </div>

              <div className="pt-4 border-t border-black-100 space-y-2 text-sm">
                <div className="flex justify-between text-black-600">
                  <span>Original price</span>
                  <span
                    className={hasDiscount ? 'line-through text-black-400' : 'text-black-900'}
                  >
                    ${price}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-black-600">
                    <span>Discount ({discount}% off)</span>
                    <span className="text-red-600 font-medium">
                      -${(price - finalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-black-600">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className="pt-4 border-t border-black-200 flex justify-between items-baseline">
                <span className="font-display font-bold text-black-900">Total</span>
                <span className="font-display font-extrabold text-black-900 text-2xl">
                  ${finalPrice}
                </span>
              </div>

              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-black-900 hover:bg-black-800 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition"
              >
                {processing ? 'Processing...' : `Confirm purchase · $${finalPrice}`}
              </button>

              <p className="text-xs text-center text-black-400">
                Simulated checkout. No money will be charged.
              </p>

              <ul className="pt-4 border-t border-black-100 space-y-2.5 text-sm text-black-600">
                <li className="flex gap-3">
                  <span>♾️</span>
                  <span>Lifetime access</span>
                </li>
                <li className="flex gap-3">
                  <span>🏆</span>
                  <span>Certificate on completion</span>
                </li>
                <li className="flex gap-3">
                  <span>💳</span>
                  <span>30-day satisfaction guarantee</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}