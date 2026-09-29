import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black-900 text-black-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="font-display font-extrabold text-lg text-white">LearnHub</span>
            </Link>
            <p className="text-sm text-black-400 leading-relaxed mb-5">
              Master the skills you need to shape your future.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/learnhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-black-800 hover:bg-black-700 flex items-center justify-center text-sm font-semibold transition"
                aria-label="Twitter"
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com/company/learnhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-black-800 hover:bg-black-700 flex items-center justify-center text-sm font-semibold transition"
                aria-label="LinkedIn"
              >
                in
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Learn</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  All courses
                </Link>
              </li>
              <li>
                <Link to="/courses?level=beginner" className="hover:text-white transition">
                  Beginner
                </Link>
              </li>
              <li>
                <Link to="/courses?level=intermediate" className="hover:text-white transition">
                  Intermediate
                </Link>
              </li>
              <li>
                <Link to="/courses?level=advanced" className="hover:text-white transition">
                  Advanced
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <span className="text-black-500 cursor-not-allowed" title="Coming soon">
                  Careers
                </span>
              </li>
              <li>
                <span className="text-black-500 cursor-not-allowed" title="Coming soon">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-black-500 cursor-not-allowed" title="Coming soon">
                  Press
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Help center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="/terms#privacy" className="hover:text-white transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms#terms" className="hover:text-white transition">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Teach</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register?role=instructor" className="hover:text-white transition">
                  Become an instructor
                </Link>
              </li>
              <li>
                <Link to="/instructor" className="hover:text-white transition">
                  Instructor dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black-500">
            © {new Date().getFullYear()} LearnHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-black-400 text-xs">
            <span>🌐 English</span>
            <Link to="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link to="/terms#privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}