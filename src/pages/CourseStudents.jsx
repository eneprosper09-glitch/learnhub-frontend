import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function CourseStudents() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['course-students', id],
    queryFn: () => api.get(`/courses/${id}/students`).then((r) => r.data.data),
  });

  if (isLoading) return <Spinner full />;

  const students = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <Link to="/instructor" className="text-sm text-black-500 hover:text-black-800">
        ← Back to dashboard
      </Link>

      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white">
        <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
          Students
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">
          Enrolled students
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {students.length} student{students.length === 1 ? '' : 's'} enrolled
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Student
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Email
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Progress
              </th>
              <th className="bg-black-50 text-left px-4 py-3 font-semibold text-black-600 border-b border-black-200">
                Enrolled
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-black-500">
                  No students enrolled yet.
                </td>
              </tr>
            )}
            {students.map((s, i) => (
              <tr key={i} className="hover:bg-black-50/60">
                <td className="px-4 py-3 border-b border-black-100 font-medium text-black-900">
                  {s.student?.name || '—'}
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-black-600">
                  {s.student?.email || '—'}
                </td>
                <td className="px-4 py-3 border-b border-black-100">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-black-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black-900 transition-all"
                        style={{ width: `${s.progressPercent || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-black-500 font-medium">
                      {s.completedCount}/{s.totalLessons} ({s.progressPercent}%)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-black-100 text-black-500 text-xs">
                  {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}