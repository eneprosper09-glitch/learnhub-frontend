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

  const students = data || [];

  return (
    <div className="space-y-5">
      <Link to="/instructor" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Enrolled Students</h1>
        <p className="text-slate-500 text-sm">{students.length} students</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Student</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Email</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Progress</th>
              <th className="bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 border-b">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No students enrolled yet.
                </td>
              </tr>
            )}
            {students.map((s, i) => (
              <tr key={i}>
                <td className="px-4 py-3 border-b border-slate-100">{s.student?.name}</td>
                <td className="px-4 py-3 border-b border-slate-100">{s.student?.email}</td>
                <td className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${s.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {s.completedCount}/{s.totalLessons} ({s.progressPercent}%)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-slate-100 text-slate-500 text-xs">
                  {new Date(s.enrolledAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}