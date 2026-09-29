import { Link } from 'react-router-dom';

const Stars = ({ value }) => {
  const v = Math.round(value || 0);
  return (
    <span className="text-yellow-500 text-sm">
      {'★'.repeat(v)}
      <span className="text-black-200">{'★'.repeat(5 - v)}</span>
    </span>
  );
};

export default function CourseCard({ course, query }) {
  const hasDiscount = (course.discountPercent || 0) > 0;
  const finalPrice = hasDiscount
    ? Math.round((course.price - (course.price * course.discountPercent) / 100) * 100) / 100
    : course.price;

  const title = query
    ? (() => {
        const idx = course.title.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return course.title;
        return (
          <>
            {course.title.slice(0, idx)}
            <mark className="bg-yellow-200 text-black-900 px-0.5 rounded">
              {course.title.slice(idx, idx + query.length)}
            </mark>
            {course.title.slice(idx + query.length)}
          </>
        );
      })()
    : course.title;

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group bg-white border border-black-200 rounded-2xl overflow-hidden hover:shadow-soft transition flex flex-col"
    >
      <div className="relative aspect-video bg-black-100 overflow-hidden">
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
            {course.discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-black-500 uppercase tracking-wider mb-2">
          {course.instructor?.name || 'LearnHub'}
        </div>
        <h3 className="font-display font-bold text-lg text-black-900 line-clamp-2 leading-snug">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <span className="font-semibold text-black-900">
            {course.averageRating?.toFixed(1) || '0.0'}
          </span>
          <Stars value={course.averageRating || 0} />
          <span className="text-black-500">({course.totalReviews || 0})</span>
        </div>
        <div className="text-sm text-black-500 mt-2 capitalize">
          {course.level} · Self-paced
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between">
          {course.price === 0 ? (
            <span className="text-lg font-bold text-black-900">Free</span>
          ) : hasDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-black-400 line-through text-sm">
                ${course.price}
              </span>
              <span className="text-lg font-bold text-black-900">${finalPrice}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-black-900">${course.price}</span>
          )}
          <span className="text-xs text-black-400 group-hover:text-black-900 transition">
            View course →
          </span>
        </div>
      </div>
    </Link>
  );
}