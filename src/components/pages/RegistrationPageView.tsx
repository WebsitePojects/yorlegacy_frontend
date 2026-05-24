import { motion } from 'framer-motion';
import { pageAssets } from '../../config/pagePresets';
import type { PageContent } from '../../types/content';

const benefits = [
  { title: 'Exclusive Discounts', body: 'Unlock preferred rates at curated luxury partners across travel, dining, and fine assets.' },
  { title: 'Unlimited Support', body: 'A dedicated legacy manager helps guide growth, activation, and strategic movement.' },
  { title: 'Global Network Access', body: 'Connect with a vetted circle of ambitious builders across multiple countries.' }
];

export function RegistrationPageView({ content }: { content: PageContent }) {
  return (
    <section className="registration-page">
      <div className="registration-background">
        <img alt="" src={pageAssets.registrationBackdrop} />
        <div className="registration-overlay" />
      </div>
      <div className="page-container registration-grid">
        <motion.aside animate={{ opacity: 1, x: 0 }} className="registration-benefits" initial={{ opacity: 0, x: -24 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <h2>{content.title}</h2>
          <p>{content.summary}</p>
          {benefits.map((benefit) => (
            <article key={benefit.title} className="registration-benefit">
              <div className="registration-benefit-icon" />
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.body}</p>
              </div>
            </article>
          ))}
        </motion.aside>
        <motion.form animate={{ opacity: 1, x: 0 }} className="glass-panel registration-form" initial={{ opacity: 0, x: 24 }} transition={{ delay: 0.1, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow">Registration</span>
          <h1 className="display-heading">{content.ctaLabel ?? 'Start Your Legacy'}</h1>
          <div className="field-grid">
            <label><span>Legal Full Name</span><input placeholder="e.g. Alexander Sterling" type="text" /></label>
            <label><span>Email Address</span><input placeholder="alex@heritage.com" type="email" /></label>
            <label className="field-span"><span>Contact Phone</span><input placeholder="+63 900 000 0000" type="tel" /></label>
            <label className="field-span"><span>Sponsor Details</span><input placeholder="Enter Sponsor ID or Name" type="text" /></label>
            <label className="field-span"><span>Selected Package</span><select defaultValue="standard"><option value="basic">Basic</option><option value="classic">Classic</option><option value="standard">Standard</option><option value="business">Business</option><option value="vip">VIP</option></select></label>
          </div>
          <button className="site-cta registration-submit" type="button">Complete Registration</button>
        </motion.form>
      </div>
    </section>
  );
}
