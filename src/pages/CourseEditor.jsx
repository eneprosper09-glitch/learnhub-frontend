import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';

const steps = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Pricing' },
];

const finalPrice = (price, discountPercent) => {
  const p = Number(price) || 0;
  const d = Number(discountPercent) || 0;
  if (d <= 0) return p;
  return Math.round((p - (p * d) / 100) * 100) / 100;
};

export default function CourseEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    discountPercent: 0,
    level: 'beginner',
    language: 'English',
    thumbnailUrl: '',
    thumbnailPublicId: '',
  });
  const [uploading, setUploading] = useState(false);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const { data: existing, isLoading } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data.data),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing && typeof existing === 'object' && existing.title) {
      setForm({
        title: existing.title || '',
        description: existing.description || '',
        category: existing.category?._id || '',
        price: existing.price || 0,
        discountPercent: existing.discountPercent || 0,
        level: existing.level || 'beginner',
        language: existing.language || 'English',
        thumbnailUrl: existing.thumbnailUrl || '',
        thumbnailPublicId: existing.thumbnailPublicId || '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isNew
        ? api.post('/courses', payload).then((r) => r.data.data)
        : api.put(`/courses/${id}`, payload).then((r) => r.data.data),
    onSuccess: (data) => {
      toast.success(isNew ? 'Course created' : 'Course updated');
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      if (isNew && data?._id) {
        nav(`/instructor/courses/${data._id}/curriculum`);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const uploadThumbnail = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/thumbnail', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        thumbnailUrl: data.data.url,
        thumbnailPublicId: data.data.publicId,
      }));
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const canNext = useMemo(() => {
    if (step === 1) return form.title.trim() && form.category;
    return true;
  }, [step, form]);

  const onSubmit = () => {
    saveMutation.mutate(form);
  };

  const next = () => {
    if (!canNext) {
      if (step === 1) toast.error('Title and category are required');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  if (!isNew && isLoading) return <Spinner full />;

  const selectedCategory = categories.find((c) => c._id === form.category);
  const final = finalPrice(form.price, form.discountPercent);
  const hasDiscount = form.discountPercent > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-1">
            {isNew ? 'New course' : 'Edit course'}
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-black-900">
            {isNew ? 'Create a course' : 'Update your course'}
          </h1>
          <p className="text-black-500 text-sm mt-1">
            Follow the steps to publish a course that students will love.
          </p>
        </div>
        <button
          onClick={() => nav('/instructor')}
          className="text-sm font-medium text-black-500 hover:text-black-800"
        >
          ← Back to dashboard
        </button>
      </div>

      <div className="bg-white border border-black-200 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s.id ? 'bg-black-900 text-white' : 'bg-black-100 text-black-400'
                }`}
              >
                {s.id}
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= s.id ? 'text-black-900' : 'text-black-400'
                }`}
              >
                {s.label}
              </span>
              {s.id !== steps.length && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    step > s.id ? 'bg-black-900' : 'bg-black-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="bg-white border border-black-200 rounded-2xl p-6 md:p-8 shadow-card"
          >
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-black-900 mb-1">
                    Course basics
                  </h2>
                  <p className="text-black-500 text-sm mb-5">
                    Give your course a clear title and pick the right category.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">
                    Course title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    placeholder="e.g. Complete React Developer Bootcamp"
                    className="w-full border border-black-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <p className="text-xs text-black-400 mt-1.5">
                    Keep it short. What will students learn?
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-black-800 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full border border-black-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black-800 mb-1.5">
                      Level
                    </label>
                    <select
                      className="w-full border border-black-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-black-900 mb-1">
                    Course details
                  </h2>
                  <p className="text-black-500 text-sm mb-5">
                    Describe what students will learn and add a cover image.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    placeholder="What will students learn? What projects will they build?"
                    className="w-full border border-black-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">
                    Thumbnail
                  </label>
                  {form.thumbnailUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-black-200 mb-3">
                      <img
                        src={form.thumbnailUrl}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, thumbnailUrl: '', thumbnailPublicId: '' })
                        }
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-black-900 text-xs font-semibold px-2 py-1 rounded-md shadow"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full aspect-video border-2 border-dashed border-black-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-black-900 hover:bg-black-50 transition">
                      <div className="text-3xl mb-2">📸</div>
                      <div className="text-sm font-medium text-black-700">
                        Click to upload an image
                      </div>
                      <div className="text-xs text-black-400 mt-1">
                        JPG, PNG, WEBP, up to 5 MB
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files[0] && uploadThumbnail(e.target.files[0])
                        }
                      />
                    </label>
                  )}
                  {uploading && <p className="text-xs text-black-500 mt-2">Uploading...</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">
                    Language
                  </label>
                  <input
                    className="w-full border border-black-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-black-900 mb-1">
                    Pricing
                  </h2>
                  <p className="text-black-500 text-sm mb-5">
                    Set the price for your course. You can optionally run a discount.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-black-800 mb-1.5">
                      Original price in USD
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black-500 font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        className="w-full border border-black-300 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: Number(e.target.value) })
                        }
                      />
                    </div>
                    <p className="text-xs text-black-400 mt-1.5">
                      Set 0 to make the course free.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black-800 mb-1.5">
                      Discount percent
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={90}
                        step="1"
                        className="w-full border border-black-300 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-black-900"
                        value={form.discountPercent}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            discountPercent: Math.min(
                              90,
                              Math.max(0, Number(e.target.value))
                            ),
                          })
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black-500 font-semibold">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-black-400 mt-1.5">
                      Between 0 and 90. Set 0 for no discount.
                    </p>
                  </div>
                </div>

                {form.price > 0 && (
                  <div className="bg-black-50 border border-black-100 rounded-xl p-5">
                    <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
                      Preview
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      {hasDiscount ? (
                        <>
                          <span className="text-black-400 line-through text-lg">
                            ${form.price}
                          </span>
                          <span className="font-display font-extrabold text-3xl text-black-900">
                            ${final}
                          </span>
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {form.discountPercent}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="font-display font-extrabold text-3xl text-black-900">
                          ${form.price}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-black-500 mt-3">
                      Students will see this in the catalog and at checkout.
                    </p>
                  </div>
                )}

                <div className="bg-black-50 border border-black-100 rounded-xl p-5">
                  <div className="text-sm font-semibold text-black-900 mb-2">
                    Pricing tips
                  </div>
                  <ul className="space-y-2 text-sm text-black-600">
                    <li>💡 Free courses attract more students and reviews.</li>
                    <li>💡 Paid courses between $20 and $80 perform best.</li>
                    <li>💡 A 20 to 40 percent discount is usually the sweet spot.</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-black-100">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="px-5 py-2.5 rounded-xl border border-black-300 hover:bg-black-50 font-medium text-black-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Back
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canNext}
                  className="px-6 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                >
                  {saveMutation.isPending
                    ? 'Saving...'
                    : isNew
                    ? 'Create course'
                    : 'Save changes'}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="text-xs font-bold tracking-widest text-black-500 uppercase">
              Live preview
            </div>
            <div className="bg-white border border-black-200 rounded-2xl overflow-hidden shadow-card">
              <div className="relative aspect-video bg-black-100 overflow-hidden">
                {form.thumbnailUrl ? (
                  <img
                    src={form.thumbnailUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black-300 text-4xl">
                    🎓
                  </div>
                )}
                {hasDiscount && form.price > 0 && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {form.discountPercent}% OFF
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-black-500 uppercase tracking-wider font-semibold mb-1">
                  {selectedCategory?.name || 'Category'}
                </div>
                <h3 className="font-semibold text-black-900 line-clamp-2">
                  {form.title || 'Your course title'}
                </h3>
                <p className="text-sm text-black-500 mt-1 capitalize">{form.level}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-black-400">{form.language}</span>
                  {form.price > 0 ? (
                    hasDiscount ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-black-400 line-through text-sm">
                          ${form.price}
                        </span>
                        <span className="font-bold text-black-900">${final}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-black-900">${form.price}</span>
                    )
                  ) : (
                    <span className="font-bold text-black-900">Free</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-black-400 leading-relaxed">
              This is how your course will appear in the catalog. Changes update as you type.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}