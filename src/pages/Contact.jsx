import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SUPPORT_EMAIL = 'eneprosper450@gmail.com';
const SUPPORT_WHATSAPP_DISPLAY = '+234 811 268 6128';
const SUPPORT_WHATSAPP_LINK = '2348112686128';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const whatsappLink = `https://wa.me/${SUPPORT_WHATSAPP_LINK}?text=${encodeURIComponent(
    'Hi LearnHub, I have a question about your courses.'
  )}`;

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = form.subject || `Message from ${form.name}`;
    const body = `From: ${form.name} <${form.email}>\n\n${form.message}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div className="bg-white">
      <Navbar variant="marketing" />

      <section className="bg-black-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Contact us</span>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.02] mb-6">We are here to help.</h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              Questions about a course, billing, or your account? Reach out and we will get back
              to you within a few hours.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">Send us a message</div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-black-900 mb-6">Tell us what you need</h2>

            <form onSubmit={onSubmit} className="bg-white border border-black-200 rounded-2xl p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">Your name</label>
                  <input required className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black-800 mb-1.5">Your email</label>
                  <input type="email" required className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black-800 mb-1.5">Subject</label>
                <input className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900" placeholder="What is this about?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black-800 mb-1.5">Message</label>
                <textarea rows={6} required className="w-full border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900" placeholder="Write your message here..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition">
                  Send message
                </button>
              </div>

              <p className="text-xs text-black-400">
                Clicking Send opens your email app with the message pre-filled. Review it before sending.
              </p>
            </form>
          </div>

          <aside className="lg:col-span-2 space-y-4">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="group block bg-white border border-black-200 rounded-2xl p-6 hover:border-black-900 hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-xl bg-black-900 text-white flex items-center justify-center text-xl mb-4">✉</div>
              <h3 className="font-display font-bold text-lg text-black-900 mb-1">Email support</h3>
              <p className="text-black-500 text-sm mb-4">Best for detailed questions and account issues.</p>
              <div className="flex items-center justify-between pt-4 border-t border-black-100">
                <span className="font-semibold text-black-900 text-sm truncate">{SUPPORT_EMAIL}</span>
                <span className="text-black-400 group-hover:text-black-900 group-hover:translate-x-1 transition">→</span>
              </div>
            </a>

            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="group block bg-white border border-black-200 rounded-2xl p-6 hover:border-black-900 hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center text-xl mb-4">💬</div>
              <h3 className="font-display font-bold text-lg text-black-900 mb-1">WhatsApp</h3>
              <p className="text-black-500 text-sm mb-4">Fastest option for quick questions.</p>
              <div className="flex items-center justify-between pt-4 border-t border-black-100">
                <span className="font-semibold text-black-900 text-sm">{SUPPORT_WHATSAPP_DISPLAY}</span>
                <span className="text-black-400 group-hover:text-black-900 group-hover:translate-x-1 transition">→</span>
              </div>
            </a>

            <div className="bg-black-50 border border-black-100 rounded-2xl p-6">
              <h3 className="font-display font-bold text-base text-black-900 mb-3">Support hours</h3>
              <ul className="space-y-2 text-sm text-black-600">
                <li className="flex justify-between"><span>Monday – Friday</span><span className="font-medium text-black-900">9:00 – 18:00</span></li>
                <li className="flex justify-between"><span>Saturday</span><span className="font-medium text-black-900">10:00 – 14:00</span></li>
                <li className="flex justify-between"><span>Sunday</span><span className="font-medium text-black-900">Closed</span></li>
              </ul>
              <p className="text-xs text-black-400 mt-4">All times are in West Africa Time (WAT).</p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}