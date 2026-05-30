import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import type { PageContent } from '../../types/content';

type AccentTone = 'primary' | 'tertiary' | 'muted';

type MetricRow = {
  label: string;
  value: string;
  note?: string;
  accent?: AccentTone;
};

type InsightCard = {
  title: string;
  body: string;
  accent?: AccentTone;
};

export const bonusRouteContent: Record<
  string,
  {
    kicker: string;
    spotlight: string;
    metrics: MetricRow[];
    insights: InsightCard[];
  }
> = {
  'earn/direct-selling': {
    kicker: 'Retail Privilege',
    spotlight: '40% Lifetime Discount',
    metrics: [
      { label: 'Product Line', value: 'Yor Fragrance Collection', note: 'Men and women fragrance variants in the public deck.' },
      { label: 'Core Hook', value: 'Retail Margin', note: 'Starter income begins with direct product movement.' },
      { label: 'Member Posture', value: 'Lifetime Access', note: 'Presented as the first visible income stream.' }
    ],
    insights: [
      {
        title: 'Direct product movement comes first',
        body: 'The public deck opens the compensation story with immediate retail upside, grounding the brand in product-led earnings rather than abstract projections.'
      },
      {
        title: 'Package entry unlocks sales posture',
        body: 'Public package messaging pairs direct selling with premium product access so the member can begin with personal retail activity and repeat customer momentum.'
      }
    ]
  },
  'earn/direct-referral': {
    kicker: 'Reward Structure',
    spotlight: 'Personally Sponsor And Earn',
    metrics: [
      { label: 'Classic', value: 'PHP 200', accent: 'muted' },
      { label: 'Basic', value: 'PHP 1,000', accent: 'primary' },
      { label: 'Standard', value: 'PHP 5,000', accent: 'primary' },
      { label: 'Business', value: 'PHP 7,000', accent: 'primary' },
      { label: 'VIP', value: 'PHP 15,000', accent: 'tertiary' }
    ],
    insights: [
      {
        title: 'Instant reward',
        body: 'Public copy frames referral commissions as immediate recognition once a direct introduction activates on the chosen package.'
      },
      {
        title: 'Scalable earnings',
        body: 'The visual story emphasizes unlimited sponsorship, reinforcing that there is no small cap on how many direct builders a member can personally develop.'
      }
    ]
  },
  'earn/salesmatch': {
    kicker: 'Binary Momentum',
    spotlight: 'Strong Leg Retention',
    metrics: [
      { label: 'Left Leg', value: '24,000 pts', note: 'Sample points from the public illustration.' },
      { label: 'Right Leg', value: '18,000 pts', note: 'Matching against the weaker side drives the payout story.' },
      { label: 'Matching In Progress', value: 'PHP 15,000', accent: 'tertiary' }
    ],
    insights: [
      {
        title: 'No daily flush-out',
        body: 'The public narrative repeatedly highlights that strong-side volume remains available until it can be matched, which is a major trust signal on the page.'
      },
      {
        title: 'Weekly payout rhythm',
        body: 'Tuesday encashment and Friday payout language are part of the headline experience, so the screen needs to present timing as clearly as it presents the bonus itself.'
      }
    ]
  },
  'earn/binary-cycle': {
    kicker: 'Based On Generation',
    spotlight: 'Salesmatch Synergy Layer',
    metrics: [
      { label: 'Level 1', value: '3%', accent: 'primary' },
      { label: 'Level 2', value: '2%', accent: 'primary' },
      { label: 'Level 3', value: '1%', accent: 'tertiary' }
    ],
    insights: [
      {
        title: 'A second layer beyond direct matching',
        body: 'The page should feel like an elevated view of leadership depth, showing how additional generation-based percentages emerge after the primary matching mechanic.'
      },
      {
        title: 'Leadership growth is the visual metaphor',
        body: 'The export leans on hierarchy and network expansion rather than retail tables, so the page needs a deeper-tree illustration instead of another flat package card.'
      }
    ]
  },
  'earn/get-five': {
    kicker: 'Legacy Rewards',
    spotlight: 'Five Directs Unlock A Bonus',
    metrics: [
      { label: 'Classic', value: 'PHP 1,000', accent: 'primary' },
      { label: 'Standard', value: 'PHP 5,000', accent: 'primary' },
      { label: 'Business', value: 'PHP 10,000', accent: 'primary' },
      { label: 'VIP', value: 'PHP 30,000', accent: 'tertiary' }
    ],
    insights: [
      {
        title: 'Same-package duplication matters',
        body: 'The public rule is not simply about recruiting five people. It is specifically about building five direct signups on the same package tier.'
      },
      {
        title: 'The mechanic is repeatable',
        body: 'The page should present the bonus as a recurring milestone, which is why the export uses a visual equation instead of a single isolated reward card.'
      }
    ]
  },
  'earn/lifestyle-rewards': {
    kicker: 'Prestige Layer',
    spotlight: '3% Repeat Purchase Bonus',
    metrics: [
      { label: 'Repeat Purchase', value: '3%', accent: 'tertiary' },
      { label: 'Activation Rule', value: 'Account Maintained', note: 'Presented as a qualification gate in the public deck.' },
      { label: 'Reward Tone', value: 'Lifestyle Prestige', note: 'Positioned as aspirational rather than transactional.' }
    ],
    insights: [
      {
        title: 'Repeat consumption is the trigger',
        body: 'Lifestyle rewards are anchored to repeat purchase behavior, making this page feel closer to a prestige loyalty layer than a one-time recruitment payout.'
      },
      {
        title: 'Potential examples need atmosphere',
        body: 'The public design language treats this stream as a luxury progression moment, so the visual treatment should feel calm, backlit, and elevated.'
      }
    ]
  },
  'earn/unilevel-rank': {
    kicker: 'Compensation Plan',
    spotlight: 'Ten Public Levels',
    metrics: [
      { label: 'Level 1', value: '10%', accent: 'primary' },
      { label: 'Level 2', value: '8%', accent: 'primary' },
      { label: 'Level 3', value: '6%', accent: 'primary' },
      { label: 'Levels 4-10', value: '5% to 1%', accent: 'tertiary' }
    ],
    insights: [
      {
        title: 'Depth is the headline',
        body: 'This route is not a simple overview. It needs a structure chart, total potential framing, and a sense of rank-based ambition to mirror the exported screen.'
      },
      {
        title: 'Projection language needs context',
        body: 'The prototype pairs its larger public numbers with disclaimers and visual hierarchy, so the supporting cards should balance ambition with explanatory guardrails.'
      }
    ]
  },
  'earn/global': {
    kicker: 'Hall Of Fame Pool',
    spotlight: '2% Yearly Global Sales',
    metrics: [
      { label: 'Pool Size', value: '2%', accent: 'tertiary' },
      { label: 'Cadence', value: 'Yearly Distribution', note: 'Framed as top-tier participation.' },
      { label: 'Status', value: 'Hall Of Fame', note: 'Reserved for higher public qualifiers.' }
    ],
    insights: [
      {
        title: 'Reserved for top qualifiers',
        body: 'Global bonus is the most exclusive public page in the stack, so it should read as a prestige chamber rather than a general commission explainer.'
      },
      {
        title: 'Maintenance still matters',
        body: 'The deck ties eligibility to ongoing account status and repeat purchase behavior, so qualification conditions need to sit visibly beside the pool headline.'
      }
    ]
  }
};

function accentClass(accent: AccentTone = 'primary') {
  if (accent === 'tertiary') {
    return 'is-tertiary';
  }

  if (accent === 'muted') {
    return 'is-muted';
  }

  return 'is-primary';
}

function renderBonusVisual(content: PageContent) {
  switch (content.slug) {
    case 'earn/direct-selling':
      return (
        <div className="bonus-showcase bonus-showcase-direct-selling">
          <div className="bonus-orbital-badge">40%</div>
          <div className="bonus-bottle-stage">
            <div className="bonus-bottle bonus-bottle-light" />
            <div className="bonus-bottle bonus-bottle-main" />
            <div className="bonus-bottle bonus-bottle-tall" />
          </div>
          <div className="bonus-chip-row">
            <span className="bonus-chip">Retail Profit</span>
            <span className="bonus-chip">Premium Fragrance</span>
            <span className="bonus-chip bonus-chip-tertiary">Lifetime Discount</span>
          </div>
        </div>
      );
    case 'earn/direct-referral':
      return (
        <div className="bonus-showcase bonus-showcase-referral">
          <div className="bonus-avatar bonus-avatar-main">YOU</div>
          <div className="bonus-line bonus-line-vertical" />
          <div className="bonus-tier-row">
            {['Classic', 'Basic', 'Standard', 'Business', 'VIP'].map((tier) => (
              <div key={tier} className="bonus-tier-node">
                <div className="bonus-tier-dot" />
                <span>{tier}</span>
              </div>
            ))}
          </div>
          <div className="bonus-pill-banner">Unlimited Sponsorship</div>
          <div className="bonus-note-grid">
            <article>
              <h3>Instant Reward</h3>
              <p>Credited when a direct introduction activates on the chosen package.</p>
            </article>
            <article>
              <h3>Scalable Earnings</h3>
              <p>No small public ceiling on how many direct builders you can personally sponsor.</p>
            </article>
          </div>
        </div>
      );
    case 'earn/salesmatch':
      return (
        <div className="bonus-showcase bonus-showcase-salesmatch">
          <div className="bonus-avatar bonus-avatar-main">YOU</div>
          <div className="bonus-line bonus-line-vertical" />
          <div className="bonus-binary-bridge" />
          <div className="bonus-binary-row">
            <div className="bonus-avatar">LEFT LEG</div>
            <div className="bonus-avatar bonus-avatar-tertiary">RIGHT LEG</div>
          </div>
          <div className="bonus-pill-banner bonus-pill-banner-glow">Matching In Progress</div>
          <div className="bonus-chip-row">
            <span className="bonus-chip">No Maintenance</span>
            <span className="bonus-chip">No Daily Flush-Out</span>
            <span className="bonus-chip bonus-chip-tertiary">Strong Leg Retention</span>
          </div>
        </div>
      );
    case 'earn/binary-cycle':
      return (
        <div className="bonus-showcase bonus-showcase-cycle">
          <div className="bonus-avatar bonus-avatar-main">YOU</div>
          <div className="bonus-generation-stack">
            <div className="bonus-generation-card is-primary">LEVEL 1 · 3%</div>
            <div className="bonus-generation-row">
              <div className="bonus-generation-card">LEVEL 2 · 2%</div>
              <div className="bonus-generation-card">LEVEL 2 · 2%</div>
              <div className="bonus-generation-card">LEVEL 2 · 2%</div>
            </div>
            <div className="bonus-generation-row is-small">
              <div className="bonus-generation-card is-small">1%</div>
              <div className="bonus-generation-card is-small">1%</div>
              <div className="bonus-generation-card is-small is-active">1%</div>
              <div className="bonus-generation-card is-small">1%</div>
              <div className="bonus-generation-card is-small">1%</div>
            </div>
          </div>
        </div>
      );
    case 'earn/get-five':
      return (
        <div className="bonus-showcase bonus-showcase-get-five">
          <div className="bonus-five-row">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bonus-five-person" />
            ))}
          </div>
          <div className="bonus-equals">=</div>
          <div className="bonus-reward-core">BONUS</div>
          <div className="bonus-chip-row">
            <span className="bonus-chip">Same Tier</span>
            <span className="bonus-chip">Repeatable</span>
            <span className="bonus-chip bonus-chip-tertiary">5 Direct Signups</span>
          </div>
        </div>
      );
    case 'earn/lifestyle-rewards':
      return (
        <div className="bonus-showcase bonus-showcase-lifestyle">
          <div className="bonus-orbital-badge bonus-orbital-badge-tertiary">3%</div>
          <div className="bonus-lifestyle-lanes">
            <div className="bonus-lifestyle-lane">Repeat Purchase</div>
            <div className="bonus-lifestyle-lane">Active Account</div>
            <div className="bonus-lifestyle-lane">Prestige Reward</div>
          </div>
          <div className="bonus-chip-row">
            <span className="bonus-chip">Monthly Rhythm</span>
            <span className="bonus-chip">Product Loyalty</span>
            <span className="bonus-chip bonus-chip-tertiary">Lifestyle Layer</span>
          </div>
        </div>
      );
    case 'earn/unilevel-rank':
      return (
        <div className="bonus-showcase bonus-showcase-unilevel">
          <div className="bonus-rank-table">
            {[
              ['01', 'Foundation', '10%', '200 PV', 'PHP 10,000'],
              ['02', 'Rising', '8%', '200 PV', 'PHP 100,000'],
              ['03', 'Builder', '6%', '200 PV', 'PHP 1,000,000'],
              ['10', 'Legacy Royalty', '5%', '200 PV', 'PHP 10 Billion']
            ].map(([level, name, percent, pv, potential], index) => (
              <div key={`${level}-${name}`} className={`bonus-rank-row${index === 3 ? ' is-featured' : ''}`}>
                <span>{level}</span>
                <strong>{name}</strong>
                <span>{percent}</span>
                <span>{pv}</span>
                <span>{potential}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'earn/global':
      return (
        <div className="bonus-showcase bonus-showcase-global">
          <div className="bonus-globe-ring bonus-globe-ring-outer" />
          <div className="bonus-globe-ring bonus-globe-ring-inner" />
          <div className="bonus-globe-core">
            <span>2%</span>
            <small>Yearly Pool</small>
          </div>
          <div className="bonus-chip-row">
            <span className="bonus-chip">Hall Of Fame</span>
            <span className="bonus-chip">Global Sales</span>
            <span className="bonus-chip bonus-chip-tertiary">Top Qualifiers</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="bonus-showcase">
          <div className="bonus-avatar bonus-avatar-main">YOU</div>
        </div>
      );
  }
}

export function BonusDetailPageView({ content }: { content: PageContent }) {
  const routeContent = bonusRouteContent[content.slug];

  return (
    <section className="page-template">
      <div className="page-container bonus-grid">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="bonus-intro"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <NavLink className="ghost-link bonus-back" to="/earn">
            Back to Earnings
          </NavLink>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1 className="display-heading">{content.title}</h1>
          <p className="hero-summary">{content.summary}</p>
        </motion.div>

        <motion.article
          animate={{ opacity: 1, y: 0 }}
          className={`glass-panel bonus-visual-card bonus-visual-${content.slug.replace(/\//g, '-')}`}
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.08, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {routeContent ? (
            <>
              <div className="bonus-kicker-row">
                <span className="bonus-kicker">{routeContent.kicker}</span>
                <strong className="bonus-spotlight">{routeContent.spotlight}</strong>
              </div>
              {renderBonusVisual(content)}
            </>
          ) : null}
        </motion.article>

        <aside className="bonus-sections">
          {routeContent ? (
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel content-card bonus-metrics-card"
              initial={{ opacity: 0, y: 28 }}
              transition={{ delay: 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2>Key Details</h2>
              <div className="bonus-metric-list">
                {routeContent.metrics.map((metric) => (
                  <div key={`${metric.label}-${metric.value}`} className={`bonus-metric-row ${accentClass(metric.accent)}`}>
                    <div>
                      <span>{metric.label}</span>
                      {metric.note ? <p>{metric.note}</p> : null}
                    </div>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            </motion.article>
          ) : null}

          {routeContent?.insights.map((insight, index) => (
            <motion.article
              key={insight.title}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel content-card bonus-insight-card ${accentClass(insight.accent)}`}
              initial={{ opacity: 0, y: 28 }}
              transition={{ delay: 0.2 + index * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2>{insight.title}</h2>
              <p>{insight.body}</p>
            </motion.article>
          ))}
        </aside>

        <section className="bonus-story-grid">
          {content.sections.map((section, index) => (
            <motion.article
              key={section.key}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel content-card bonus-story-card"
              initial={{ opacity: 0, y: 28 }}
              transition={{ delay: 0.24 + index * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </motion.article>
          ))}
        </section>
      </div>
    </section>
  );
}
