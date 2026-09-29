import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Pagination from '../components/Pagination';
import { CourseCardSkeleton } from '../components/Skeleton';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../context/AuthContext';

const levels = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function Home() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(params.get('category') || '');
  const [level, setLevel] = useState(params.get('level') || '');
  const [hasDiscount, setHasDiscount] = useState(params.get('hasDiscount') === 'true');
  const [sort, setSort] = useState(params.get('sort') || '-createdAt');
  const [page, setPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSearch(params.get('search') || '');
    setCategory(params.get('category') || '');
    setLevel(params.get('level') || '');
    setHasDiscount(params.get('hasDiscount') === 'true');
    setSort(params.get('sort') || '-createdAt');
    setPage(1);
  }, [params]);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const { data: suggestionsRes } = useQuery({
    queryKey: ['course-suggestions', debouncedSearch],
    queryFn: () =>
      api
        .get('/courses', { params: { search: debouncedSearch, limit: 5 } })
        .then((r) => r.data.data),
    enabled: debouncedSearch.length >= 2,
  });

  const suggestions = Array.isArray(suggestionsRes) ? suggestionsRes : [];

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { debouncedSearch, category, level, page, hasDiscount, sort }],
    queryFn: () =>
      api
        .get('/courses', {
          params: {
            search: debouncedSearch,
            category,
            level,
            page,
            limit: 9,
            hasDiscount: hasDiscount ? 'true' : undefined,
            sort,
          },
        })
        .then((r) => r.data),
  });

  const { data: recommendedRes } = useQuery({
    queryKey: ['recommended', user?._id],
    queryFn: () => api.get('/courses/recommended').then((r) => r.data),
    enabled: !!user,
  });

  const courses = Array.isArray(data?.data) ? data.data : [];
  const recommended = Array.isArray(recommendedRes?.data) ? recommendedRes.data : [];
  const showRecommended = recommended.length > 0 && !debouncedSearch && !category && !level;

  const updateUrl = (next) => {
    const merged = { search, category, level, sort, hasDiscount, ...next };
    const nextParams = new URLSearchParams();
    if (merged.search) nextParams.set('search', merged.search);
    if (merged.category) nextParams.set('category', merged.category);
    if (merged.level) nextParams.set('level', merged.level);
    if (merged.sort && merged.sort !== '-createdAt') nextParams.set('sort', merged.sort);
    if (merged.hasDiscount) nextParams.set('hasDiscount', 'true');
    setParams(nextParams, { replace: true });
  };

  const onSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    setShowSuggestions(true);
    updateUrl({ search: value });
  };

  const onCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
    updateUrl({ category: value });
  };

  const onLevelChange = (value) => {
    setLevel(value);
    setPage(1);
    updateUrl({ level: value });
  };

  const onSortChange = (value) => {
    setSort(value);
    setPage(1);
    updateUrl({ sort: value });
  };

  const toggleDiscountFilter = () => {
    const next = !hasDiscount;
    setHasDiscount(next);
    setPage(1);
    updateUrl({ hasDiscount: next });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLevel('');
    setHasDiscount(false);
    setSort('-createdAt');
    setPage(1);
    setShowSuggestions(false);
    setParams({}, { replace: true });
  };

  return (
    <div className="space-y-8">
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-10 text-white">
        <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-3">
          Browse
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight mb-3">
          Explore our catalog
        </h1>
        <p className="text-white/70 max-w-xl text-sm md:text-base">
          Thousands of courses from expert instructors. Find the right one for you.
        </p>
      </div>

      <div className="max-w-2xl mx-auto -mt-14 md:-mt-16 px-4 relative z-10">
        <input
          className="w-full bg-white border border-black-200 rounded-2xl px-5 py-4 text-base shadow-soft focus:outline-none focus:ring-2 focus:ring-black-900"
          placeholder="What do you want to learn?"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && search.length >= 2 && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-white border border-black-200 rounded-2xl shadow-soft overflow-hidden">
            {suggestions.map((c) => (
              <Link
                key={c._id}
                to={`/courses/${c._id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black-50 transition border-b border-black-100 last:border-b-0"
              >
                <div className="w-12 h-12 rounded-lg bg-black-100 overflow-hidden flex-shrink-0">
                  {c.thumbnailUrl ? (
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black-300">
                      🎓
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-black-900 truncate">
                    {c.title}
                  </div>
                  <div className="text-xs text-black-500">
                    {c.instructor?.name || 'Instructor'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
            category === ''
              ? 'bg-black-900 text-white border-black-900'
              : 'bg-white border-black-200 text-black-700 hover:border-black-400'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => onCategoryChange(c._id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              category === c._id
                ? 'bg-black-900 text-white border-black-900'
                : 'bg-white border-black-200 text-black-700 hover:border-black-400'
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          onClick={toggleDiscountFilter}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
            hasDiscount
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white border-black-200 text-black-700 hover:border-black-400'
          }`}
        >
          On sale
        </button>
      </div>

      {showRecommended && (
        <section>
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-black-900">
                Recommended for you
              </h2>
              <p className="text-black-500 text-sm mt-1">
                Based on the courses you are enrolled in.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 border-t border-black-100 pt-6">
        <h2 className="text-lg font-semibold text-black-900">
          {search ? `Results for "${search}"` : 'All courses'}
        </h2>
        <div className="flex items-center gap-2">
          <select
            className="border border-black-300 rounded-lg px-3 py-2 text-sm"
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
          >
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            className="border border-black-300 rounded-lg px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="-createdAt">Newest</option>
            <option value="-averageRating">Highest rated</option>
            <option value="-totalStudents">Most popular</option>
            <option value="price">Price: low to high</option>
            <option value="-price">Price: high to low</option>
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}

        {!isLoading &&
          courses.map((course) => (
            <CourseCard key={course._id} course={course} query={search} />
          ))}

        {!isLoading && courses.length === 0 && (
          <div className="col-span-full bg-white border border-black-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-black-500">No courses match your filters.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-black-900 hover:underline text-sm font-medium"
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