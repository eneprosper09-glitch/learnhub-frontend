import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const values = [
  { icon: '🎯', title: 'Learn by doing', text: 'Every course is project-based. You finish with something you can show, not just something you watched.' },
  { icon: '🌍', title: 'Accessible to all', text: 'Affordable pricing, free courses, and lifetime access. Education should not be gated by where you were born.' },
  { icon: '🤝', title: 'Built with instructors', text: 'We partner with practitioners who are still working in their fields. You learn what is used today.' },
  { icon: '🏆', title: 'Results that matter', text: 'Certificates, portfolios, and real skills. We measure success by what our students do after the course.' },
];

const team = [
  { name: 'Prosper E.', role: 'Founder & CEO', initial: 'P', image: '/prosper.jpg' },
  { name: 'Amaka O.', role: 'Head of Learning', initial: 'A' },
  { name: 'Daniel K.', role: 'Lead Engineer', initial: 'D' },
  { name: 'Priya S.', role: 'Head of Design', initial: 'P' },
];

export default function About() {
  return (
    <div className="bg-white">
      <Navbar variant="marketing" />

      <section className="bg-black-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-widest text-white/60 uppercase mb-4">
              About LearnHub
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.02] mb-6">
              We build the learning platform we wish we had.
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              LearnHub exists to make high-quality, practical education accessible to anyone with
              a connection and the will to learn.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-20">
        <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
          Our story
        </div>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900 mb-6">
          From a class project to a real product.
        </h2>
        <div className="space-y-5 text-black-700 leading-relaxed">
          <p>
            LearnHub started as a small side project by a group of learners frustrated with how
            much online education costs and how little of it translates into real skills. We
            wanted a platform that felt clean, fast, and honest.
          </p>
          <p>
            Today, LearnHub hosts hundreds of courses across programming, design, business, data
            science, marketing, and photography. Thousands of students enroll each month.
          </p>
          <p>
            We believe that good education should be project-based, taught by practitioners, and
            priced so that anyone can access it.
          </p>
        </div>
      </section>

      <section className="bg-black-50 border-y border-black-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
              Our values
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
              What guides everything we do
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white border border-black-200 rounded-2xl p-6 hover:shadow-soft transition"
              >
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-display font-bold text-lg text-black-900 mb-2">
                  {v.title}
                </h3>
                <p className="text-black-600 text-sm leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Courses' },
            { value: '120K+', label: 'Students' },
            { value: '60+', label: 'Instructors' },
            { value: '4.8', label: 'Average rating' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display font-extrabold text-4xl md:text-5xl text-black-900">
                {s.value}
              </div>
              <div className="text-sm text-black-500 uppercase tracking-widest mt-2 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black-50 border-y border-black-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
              The team
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
              People behind LearnHub
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((m) => (
              <div key={m.name} className="text-center">
                {m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-white shadow-card mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-full bg-black-900 text-white flex items-center justify-center font-display font-extrabold text-3xl mb-4">
                    {m.initial}
                  </div>
                )}
                <div className="font-semibold text-black-900">{m.name}</div>
                <div className="text-sm text-black-500 mt-1">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="careers" className="max-w-4xl mx-auto px-4 md:px-6 py-20">
        <div className="bg-white border border-black-200 rounded-3xl p-8 md:p-12 text-center">
          <div className="text-4xl mb-4">💼</div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-3">
            Careers at LearnHub
          </h2>
          <p className="text-black-500 max-w-xl mx-auto mb-6">
            We are a small team and we hire carefully. There are no open positions right now, but
            we are always happy to hear from people who love teaching and building products.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Say hello
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="bg-black-900 rounded-3xl px-6 md:px-12 py-14 text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-4">
            Ready to start learning?
          </h2>
          <p className="text-black-300 max-w-xl mx-auto mb-8">
            Join over 120,000 learners on LearnHub. It is free to sign up.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 bg-white text-black-900 font-semibold rounded-xl hover:bg-black-100 transition"
          >
            Create free account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}