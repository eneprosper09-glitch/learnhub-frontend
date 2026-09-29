import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=2000&q=80';

const categories = [
  {
    name: 'Programming',
    query: 'Programming',
    image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80',
  },
  {
    name: 'Design',
    query: 'Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  },
  {
    name: 'Business',
    query: 'Business',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
  },
  {
    name: 'Data Science',
    query: 'Data Science',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  {
    name: 'Marketing',
    query: 'Marketing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    name: 'Photography',
    query: 'Photography',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
  },
];

const stats = [
  { label: 'Courses', value: '500+' },
  { label: 'Students', value: '120K+' },
  { label: 'Avg rating', value: '4.8' },
  { label: 'Instructors', value: '60+' },
];

const plans = [
  {
    name: 'Individual Courses',
    tagline: 'Learn a single topic or skill and earn a credential',
    price: '$20',
    per: '/month',
    sub: 'Visit a course to purchase',
    cta: 'Explore courses',
    to: '/courses',
    features: [
      'Choose from thousands of courses in tech, business, design, and more',
      'Earn a certificate upon completion',
      'Pay once for a single course or subscribe to a bundled specialization',
    ],
    highlight: false,
  },
  {
    name: 'LearnHub Plus',
    tagline: 'Master multiple topics and earn unlimited credentials',
    price: '$24',
    per: '/month',
    sub: 'Cancel anytime',
    cta: 'Start 7-day free trial',
    to: '/courses',
    badge: 'Best value',
    billing: true,
    features: [
      'Access thousands of courses with one subscription',
      'Earn unlimited certificates after your trial ends',
      'Learn job-relevant skills with hands-on labs and projects',
    ],
    highlight: true,
  },
  {
    name: 'LearnHub for Teams',
    tagline: 'Upskill up to 125 employees',
    price: '$259',
    per: '/year',
    sub: 'Per user for 12 months',
    cta: 'Get started',
    to: '/courses',
    features: [
      'Access to everything included in LearnHub Plus',
      'Analytics and custom benchmark reporting',
      'Flexible payment options like quarterly billing and invoicing',
    ],
    highlight: false,
  },
];

const testimonials = [
  {
    name: 'Amaka O.',
    role: 'Frontend Developer',
    text: 'The React course took me from zero to a paid internship in three months. Best investment I have made.',
  },
  {
    name: 'Daniel K.',
    role: 'Data Analyst',
    text: 'Clear lessons, real projects, and mentors who respond. I finally understand data science.',
  },
  {
    name: 'Priya S.',
    role: 'UX Designer',
    text: 'The design track is world class. I shipped a portfolio that got me hired at a top studio.',
  },
];

const faqs = [
  {
    q: 'Is LearnHub free to use?',
    a: 'Creating an account is completely free. You can browse the full catalog, preview selected lessons, and enroll in any free course without paying. Paid courses require a one-time payment.',
  },
  {
    q: 'Do I get a certificate after completing a course?',
    a: 'Yes. Every course offers a certificate of completion. Once you finish all lessons in a course, your certificate becomes available on your profile and can be shared on LinkedIn.',
  },
  {
    q: 'How long do I have access to a course I bought?',
    a: 'Forever. Once you enroll in a paid course, you have lifetime access to every lesson, including any new lessons or updates the instructor adds later.',
  },
  {
    q: 'Can I preview a course before buying it?',
    a: 'Yes. Courses with a free preview lesson let you watch one full lesson before you decide. Look for the "Free preview" tag on the curriculum list.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We currently support simulated payment in this build. Credit card and PayPal options will be added when Stripe integration goes live.',
  },
  {
    q: 'What if I want to unenroll from a course?',
    a: 'You can unenroll at any time from your My Learning page. If you paid for the course, you can re-enroll later at no extra cost.',
  },
  {
    q: 'How do I become an instructor?',
    a: 'Sign up with the "Teach on LearnHub" option and verify your email. Once an admin approves your account, you can create and publish courses from your Instructor Dashboard.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. We use industry-standard security: hashed passwords with bcrypt, JWT authentication with refresh tokens, and rate limiting on all authentication endpoints.',
  },
];

const SUPPORT_EMAIL = 'eneprosper450@gmail.com';
const SUPPORT_WHATSAPP_DISPLAY = '+234 811 268 6128';
const SUPPORT_WHATSAPP_LINK = '2348112686128';

export default function Landing() {
  const { user } = useAuth();

  const { data: featuredRes, isLoading: loadingFeatured } = useQuery({
    queryKey: ['landing-featured'],
    queryFn: () =>
      api
        .get('/courses', { params: { limit: 6, sort: '-createdAt' } })
        .then((r) => r.data),
  });

  const featured = Array.isArray(featuredRes?.data) ? featuredRes.data : [];

  const whatsappLink = `https://wa.me/${SUPPORT_WHATSAPP_LINK}?text=${encodeURIComponent(
    "Hi LearnHub, I have a question about your courses."
  )}`;

  return (
    <div className="bg-white">
      <Navbar variant="marketing" />

      {/* HERO */}
      <section className="relative min-h-[580px] md:min-h-[680px] overflow-hidden bg-black-900">
        <img
          src={HERO_IMAGE}
          alt="Learners working together"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)' }}
        />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-12 md:py-24 flex items-start md:items-center min-h-[580px] md:min-h-[680px]">
          <div className="max-w-3xl text-white">
            <span className="inline-block text-xs font-bold tracking-widest text-white/75 uppercase mb-5">
              Skills for what's next
            </span>
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.98] mb-5">
              LearnHub
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl">
              Learn practical skills from people who've done the work. Build your next opportunity,
              one course at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                to={user ? '/courses' : '/register'}
                className="px-7 py-3.5 bg-white text-black-900 font-semibold rounded-lg hover:bg-black-100 transition text-center text-base"
              >
                Get started
              </Link>
              <Link
                to="/courses"
                className="px-7 py-3.5 border border-white/70 text-white font-semibold rounded-lg hover:bg-white hover:text-black-900 transition text-center text-base"
              >
                Browse courses
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/85">
              <span className="text-white" aria-label="Rated 4.8 out of 5">
                ★★★★★
              </span>
              <span>4.8 average rating · 120,000+ learners</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="relative overflow-hidden" style={{ background: '#0a0a0a' }}>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, idx) => (
              <div
                key={s.label}
                className={`relative flex flex-col items-center text-center px-4 py-6 ${
                  idx !== stats.length - 1 ? 'md:border-r md:border-white/10' : ''
                }`}
              >
                <div className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">
                  {s.value}
                </div>
                <div className="text-sm md:text-base text-white/60 mt-2 uppercase tracking-widest font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900">
              Browse by category
            </h2>
            <p className="text-black-500 mt-2">Find the right path for where you are.</p>
          </div>
          <Link
            to="/courses"
            className="text-sm font-semibold text-black-700 hover:text-black-900"
          >
            View all courses →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((c, idx) => (
            <Link
              key={c.name}
              to={`/courses?search=${encodeURIComponent(c.query)}`}
              className={`group relative overflow-hidden rounded-2xl ${
                idx === 0 || idx === 3 ? 'md:row-span-2 md:h-full' : ''
              } h-48 md:h-56`}
            >
              <img
                src={c.image}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black-900 via-black-900/40 to-transparent" />
              <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                <span className="text-xs font-bold tracking-widest text-white/70 uppercase mb-1">
                  Category
                </span>
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white">
                  {c.name}
                </h3>
                <span className="text-white/80 text-sm mt-1 group-hover:translate-x-1 transition">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* OFFER BANNER */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-white text-center md:text-left">
            <div className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-2">
              Limited time
            </div>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl">
              Save 30% on any course
            </h3>
            <p className="text-black-300 mt-1 text-sm">
              Use code <span className="text-white font-semibold">LEARN30</span> at checkout.
            </p>
          </div>
          <Link
            to="/courses"
            className="px-6 py-3 bg-white text-black-900 font-semibold rounded-xl hover:bg-black-100 transition whitespace-nowrap"
          >
            Explore courses
          </Link>
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900">
              Trending now
            </h2>
            <p className="text-black-500 mt-2">The most popular courses on LearnHub this week.</p>
          </div>
          <Link
            to="/courses"
            className="text-sm font-semibold text-black-700 hover:text-black-900"
          >
            See all →
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-black-200 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-black-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-black-100 rounded w-3/4" />
                  <div className="h-3 bg-black-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="group bg-white border border-black-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-black-900 transition"
              >
                <div className="aspect-video bg-black-100 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-black-300">
                      🎓
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-black-900 line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-black-500">
                    {course.instructor?.name || 'Instructor'}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-black-400 capitalize">{course.level}</span>
                    <span className="font-bold text-black-900">
                      {course.price > 0 ? `$${course.price}` : 'Free'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* PLANS */}
      <section className="bg-black-50 border-y border-black-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
              Find the right plan for your goals
            </h2>
            <p className="text-black-500 mt-3 max-w-2xl mx-auto">
              Start free. Upgrade only if you want more. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative bg-white border rounded-2xl overflow-hidden flex flex-col ${
                  p.highlight ? 'border-black-900 shadow-lift' : 'border-black-200 shadow-card'
                }`}
              >
                {p.badge && (
                  <div className="bg-black-900 text-white text-xs font-bold tracking-widest uppercase text-center py-2.5">
                    {p.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <h3 className="font-display font-extrabold text-2xl text-black-900">
                    {p.name}
                  </h3>
                  <p className="text-black-500 text-sm mt-2 leading-relaxed">{p.tagline}</p>

                  <div className="mt-8">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-extrabold text-5xl text-black-900">
                        {p.price}
                      </span>
                      <span className="text-black-500 text-lg">{p.per}</span>
                    </div>
                    <p className="text-black-500 text-sm mt-1">{p.sub}</p>
                  </div>

                  {p.billing && (
                    <div className="mt-6 space-y-2 text-sm">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`billing-${p.name}`}
                          defaultChecked
                          className="accent-black-900"
                        />
                        <span className="text-black-900 font-medium">Billed Monthly</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`billing-${p.name}`}
                          className="accent-black-900"
                        />
                        <span className="text-black-700">Billed Annually</span>
                        <span className="ml-1 inline-block bg-black-100 text-black-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Save 40%
                        </span>
                      </label>
                    </div>
                  )}

                  <Link
                    to={p.to}
                    className={`mt-8 block text-center px-6 py-3 rounded-lg font-semibold transition ${
                      p.highlight
                        ? 'bg-black-900 text-white hover:bg-black-800'
                        : 'bg-white text-black-900 border border-black-900 hover:bg-black-50'
                    }`}
                  >
                    {p.cta}
                  </Link>

                  <div className="mt-8 pt-6 border-t border-black-100">
                    <p className="text-sm font-semibold text-black-900 mb-4">Key features:</p>
                    <ul className="space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3 text-sm text-black-600">
                          <span className="text-black-900 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY LEARNHUB */}
      <section className="bg-black-50 border-y border-black-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 text-center mb-12">
            Why learners choose LearnHub
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '01',
                title: 'Learn by doing',
                text: 'Hands-on projects in every course. Build a portfolio while you learn.',
              },
              {
                icon: '02',
                title: 'Learn on your terms',
                text: 'Lifetime access to every course. Watch anywhere, anytime, at your own pace.',
              },
              {
                icon: '03',
                title: 'Certificates that matter',
                text: 'Earn certificates employers recognize. Share them on LinkedIn in one click.',
              },
            ].map((f) => (
              <div key={f.title} className="text-center md:text-left">
                <div className="font-mono text-xl font-semibold text-black-500 mb-3">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-black-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-black-500 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 text-center mb-12">
          Loved by learners
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-black-200 rounded-2xl p-6 hover:shadow-soft transition"
            >
              <div className="text-black-900 text-lg mb-4">★★★★★</div>
              <p className="text-black-700 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black-900 text-white flex items-center justify-center font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm text-black-900">{t.name}</div>
                  <div className="text-xs text-black-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black-50 border-y border-black-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
              FAQ
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
              Frequently asked questions
            </h2>
            <p className="text-black-500 mt-3 max-w-2xl mx-auto">
              Everything you need to know about LearnHub. Can't find an answer? Reach out to our
              team.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group bg-white border border-black-200 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-black-50 transition">
                  <span className="font-semibold text-black-900 text-base md:text-lg pr-4">
                    {item.q}
                  </span>
                  <span className="text-black-500 flex-shrink-0 transition-transform group-open:rotate-45 text-xl">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-black-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">
            Contact us
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900">
            Still have questions?
          </h2>
          <p className="text-black-500 mt-3 max-w-2xl mx-auto">
            Reach out on email or WhatsApp. Our support team responds within a few hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* EMAIL CARD */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group bg-white border border-black-200 rounded-2xl p-8 hover:border-black-900 hover:shadow-soft transition flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-black-900 text-white flex items-center justify-center text-2xl mb-6">
              ✉
            </div>
            <h3 className="font-display font-extrabold text-xl text-black-900 mb-2">
              Email support
            </h3>
            <p className="text-black-500 text-sm leading-relaxed mb-6">
              Best for detailed questions about courses, billing, or your account.
            </p>
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-black-100">
              <span className="font-semibold text-black-900 text-sm truncate">
                {SUPPORT_EMAIL}
              </span>
              <span className="text-black-400 group-hover:text-black-900 group-hover:translate-x-1 transition">
                →
              </span>
            </div>
          </a>

          {/* WHATSAPP CARD */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-black-200 rounded-2xl p-8 hover:border-black-900 hover:shadow-soft transition flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl mb-6">
              💬
            </div>
            <h3 className="font-display font-extrabold text-xl text-black-900 mb-2">
              Chat on WhatsApp
            </h3>
            <p className="text-black-500 text-sm leading-relaxed mb-6">
              Fastest option. Chat with our team for quick questions and support.
            </p>
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-black-100">
              <span className="font-semibold text-black-900 text-sm">
                {SUPPORT_WHATSAPP_DISPLAY}
              </span>
              <span className="text-black-400 group-hover:text-black-900 group-hover:translate-x-1 transition">
                →
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="bg-black-900 rounded-3xl px-6 md:px-12 py-14 text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-4">
            Start learning today
          </h2>
          <p className="text-black-300 max-w-xl mx-auto mb-8">
            Join over 120,000 learners mastering new skills on LearnHub. It is free to sign up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={user ? '/courses' : '/register'}
              className="px-6 py-3 bg-white text-black-900 font-semibold rounded-xl hover:bg-black-100 transition"
            >
              {user ? 'Browse courses' : 'Create free account'}
            </Link>
            <Link
              to="/courses"
              className="px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Explore catalog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}