import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function Certificate() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/certificates/course/${courseId}`)
      .then((r) => setData(r.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Not available'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <Spinner full />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-display font-extrabold text-2xl text-black-900 mb-3">
          Certificate not available
        </h1>
        <p className="text-black-500 mb-6">{error}</p>
        <Link
          to={`/courses/${courseId}`}
          className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Back to course
        </Link>
      </div>
    );
  }

  const issued = new Date(data.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to={`/courses/${courseId}`}
          className="text-sm text-black-500 hover:text-black-800"
        >
          ← Back to course
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-black-900 hover:bg-black-800 text-white font-semibold px-5 py-2.5 rounded-xl transition"
          >
            🖨️ Print or Save as PDF
          </button>
        </div>
      </div>

      {/* CERTIFICATE */}
      <div
        id="certificate"
        className="bg-white border-[16px] border-double border-black-900 rounded-lg p-8 md:p-16 relative"
      >
        <div className="text-center">
          <div className="text-5xl mb-6">🎓</div>

          <div className="text-xs font-bold tracking-[0.4em] text-black-500 uppercase mb-8">
            Certificate of Completion
          </div>

          <div className="text-sm text-black-600 mb-6">This is to certify that</div>

          <div className="font-display font-extrabold text-4xl md:text-5xl text-black-900 mb-8">
            {data.student.name}
          </div>

          <div className="text-sm text-black-600 mb-3">
            has successfully completed the course
          </div>

          <div className="font-display font-bold text-2xl md:text-3xl text-black-900 mb-6">
            {data.course.title}
          </div>

          <div className="text-sm text-black-600 mb-12">
            {data.course.totalLessons} lessons · {data.course.level} level
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12 text-left">
            <div>
              <div className="border-t border-black-300 pt-2">
                <div className="text-xs text-black-500">Instructor</div>
                <div className="font-semibold text-black-900">
                  {data.course.instructor}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl text-black-900">
                LearnHub
              </div>
              <div className="text-xs text-black-500">learnhub.com</div>
            </div>
            <div>
              <div className="border-t border-black-300 pt-2">
                <div className="text-xs text-black-500">Issued</div>
                <div className="font-semibold text-black-900">{issued}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-black-400 border-t border-black-100 pt-4">
            Certificate ID: <span className="font-mono">{data.certificateId}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-center text-black-500">
        Tip: use Print or Save as PDF to download this certificate.
      </p>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}