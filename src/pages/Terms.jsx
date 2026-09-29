import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="bg-white">
      <Navbar variant="marketing" />

      <section className="bg-black-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Legal</span>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.02] mb-6">
              Terms and Privacy
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              The rules that govern your use of LearnHub and how we handle your data.
            </p>
            <p className="text-sm text-white/50 mt-4">Last updated: September 29, 2026</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 pt-16">
        <div className="bg-black-50 border border-black-100 rounded-2xl p-6">
          <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">On this page</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#terms" className="text-black-900 hover:underline font-medium">Terms of Service</a></li>
            <li><a href="#privacy" className="text-black-900 hover:underline font-medium">Privacy Policy</a></li>
            <li><a href="#contact" className="text-black-900 hover:underline font-medium">Contact</a></li>
          </ul>
        </div>
      </section>

      <section id="terms" className="max-w-4xl mx-auto px-4 md:px-6 py-16 scroll-mt-24">
        <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">Section 1</div>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900 mb-8">Terms of Service</h2>
        <div className="space-y-6 text-black-700 leading-relaxed">
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.1 Acceptance of terms</h3><p>By creating an account on LearnHub, you agree to these terms. If you do not agree, do not use the platform.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.2 Your account</h3><p>You are responsible for keeping your password safe and for any activity that happens under your account. Notify us immediately if you suspect unauthorized access.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.3 Courses and content</h3><p>When you enroll in a paid course you receive a personal, non-transferable, lifetime license to access the lessons. You may not download, redistribute, or resell course content without written permission from the instructor.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.4 Payments and refunds</h3><p>Paid courses require a one-time payment. Refunds are available within 30 days of purchase if you have not completed more than 25 percent of the course.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.5 Acceptable use</h3><p>Do not use LearnHub to upload illegal content, harass other users, attempt to breach the platform, or scrape data. Accounts found in violation may be suspended without notice.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.6 Termination</h3><p>You may delete your account at any time. We may suspend or terminate your access if you violate these terms or attempt to harm the platform.</p></div>
          <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">1.7 Changes to these terms</h3><p>We may update these terms from time to time. If the changes are significant we will notify you by email or through the platform.</p></div>
        </div>
      </section>

      <section id="privacy" className="bg-black-50 border-y border-black-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16">
          <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">Section 2</div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900 mb-8">Privacy Policy</h2>
          <div className="space-y-6 text-black-700 leading-relaxed">
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.1 What we collect</h3><p>We collect your name, email, hashed password, and information you provide when using the platform. We never store your password in plain text.</p></div>
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.2 How we use your data</h3><p>Your data is used to run the platform, send transactional emails, and improve the learning experience. We do not sell your data to third parties.</p></div>
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.3 Security</h3><p>Passwords are hashed with bcrypt. Sessions use JWT with refresh tokens stored in httpOnly cookies. Authentication endpoints are rate-limited. All traffic to the production app uses HTTPS.</p></div>
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.4 Cookies</h3><p>We use a single httpOnly refresh-token cookie to keep you signed in. We do not use tracking or advertising cookies.</p></div>
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.5 Your rights</h3><p>You can request a copy of your data or ask us to delete your account at any time by contacting support. We will respond within 30 days.</p></div>
            <div><h3 className="font-display font-bold text-xl text-black-900 mb-2">2.6 Third parties</h3><p>We use Cloudinary for video and image hosting, MongoDB Atlas for data storage, and Brevo for transactional email. Each handles only the data needed for their specific function.</p></div>
          </div>
        </div>
      </section>

      <section id="contact" className="max-w-4xl mx-auto px-4 md:px-6 py-16 scroll-mt-24">
        <div className="text-xs font-bold tracking-widest text-black-500 uppercase mb-3">Section 3</div>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-black-900 mb-6">Questions about these terms?</h2>
        <p className="text-black-700 leading-relaxed mb-8">Reach out any time. We respond to legal and privacy questions within a few business days.</p>
        <Link to="/contact" className="inline-block bg-black-900 hover:bg-black-800 text-white font-semibold px-6 py-3 rounded-xl transition">
          Contact support
        </Link>
      </section>

      <Footer />
    </div>
  );
}