import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Pagination from '../components/Pagination';
import { CourseCardSkeleton } from '../components/Skeleton';

const levels = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { search, category, level, page }],
    queryFn: () =>
      api
        .get('/courses', {
          params: { search, category, level, page, limit: 9 },
        })
        .then((r) => r.data),
  });

  const categories = categoriesRes?.data || [];

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-2xl">
          Learn new skills. Teach what you love.
        </h1>
        <p className="mt-3 text-indigo-100 max-w-xl">
          Join thousands of students and instructors on LearnHub.
        </p>
        <div className="mt-6 max-w-xl">
          <input
            className="w-full rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setPage(1);
            setCategory('');
          }}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            category === ''
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => {
              setPage(1);
              setCategory(c._id);
            }}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              category === c._id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-300 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </section>

      <section className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">
          {search ? `Results for "${search}"` : 'Browse courses'}
        </h2>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={level}
          onChange={(e) => {
            setPage(1);
            setLevel(e.target.value);
          }}
        >
          {levels.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}

        {!isLoading &&
          (data?.data || []).map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
            >
              <div className="aspect-video bg-slate-100">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                    🎓
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {course.instructor?.name || 'Instructor'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500 capitalize">{course.level}</span>
                  <span className="font-bold text-indigo-600">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </span>
                </div>
              </div>
            </Link>
          ))}

        {!isLoading && data?.data?.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-500">No courses match your filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setLevel('');
                setPage(1);
              }}
              className="mt-4 text-indigo-600 hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />
    </div>
  );
}