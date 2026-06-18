'use client'

import { FormEvent, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Plan        = 'Solo' | 'Studio' | 'Enterprise'
type SubmitState = 'idle' | 'loading' | 'success'

interface FormFields {
  name:     string
  email:    string
  phone:    string
  company:  string
  role:     string
  teamSize: string
  city:     string
}

// ── Constants ──────────────────────────────────────────────────────────────────
const YEAR = new Date().getFullYear()

const PLANS: { id: Plan; price: string; sub: string; popular?: true }[] = [
  { id: 'Solo',       price: '₹4,999/mo', sub: '1 user · Up to 10 projects'   },
  { id: 'Studio',     price: '₹9,999/mo', sub: '5 users · Unlimited projects', popular: true },
  { id: 'Enterprise', price: 'Custom',    sub: 'Unlimited · Custom onboarding' },
]

const ROLES = [
  'Principal Architect',
  'Project Manager',
  'Civil Engineer',
  'Interior Designer',
  'Contractor',
  'Accountant / Admin',
  'Site Engineer',
  'Owner / Director',
  'Other',
]

const TEAM_SIZES = ['Just me', '2–5 people', '6–20 people', '20+ people']

const PROOF_ITEMS = [
  { icon: '🏗️', text: '30+ firms already on board'      },
  { icon: '⚡',  text: 'Set up in under 15 minutes'     },
  { icon: '🔒', text: '100% offline · data stays local' },
]

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EMPTY_FIELDS: FormFields = {
  name: '', email: '', phone: '', company: '', role: '', teamSize: '', city: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim()
}

function validate(f: FormFields): string {
  if (!f.name.trim())               return 'Full name is required.'
  if (!f.email.trim())              return 'Email address is required.'
  if (!EMAIL_RE.test(f.email.trim())) return 'Enter a valid email (e.g. you@company.com).'
  return ''
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Logo() {
  return (
    <a href="/" className="logo" aria-label="ARC PEM home">
      <div className="logo-mark" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
          {/* Arch — the core architectural motif */}
          <path
            d="M10 44 L10 26 Q10 8 28 8 Q46 8 46 26 L46 44"
            stroke="white" strokeWidth="5.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Base line */}
          <line x1="4" y1="44" x2="52" y2="44"
            stroke="white" strokeWidth="4.5" strokeLinecap="round" />
          {/* Centre column */}
          <line x1="28" y1="22" x2="28" y2="44"
            stroke="rgba(255,255,255,.55)" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="logo-text-arc">ARC</span>
      <span className="logo-text-pem">PEM</span>
    </a>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <span>&copy; {YEAR} HashX Labs Pvt. Ltd.</span>
      <span className="dot" aria-hidden="true" />
      <a href="/privacy-policy">Privacy Policy</a>
      <span className="dot" aria-hidden="true" />
      <a href="/terms">Terms of Service</a>
      <span className="dot" aria-hidden="true" />
      <a href="mailto:hashxlabs@gmail.com">Contact</a>
    </footer>
  )
}

function SuccessCard({ name, email, plan }: { name: string; email: string; plan: Plan }) {
  return (
    <div className="card">
      <div className="success-wrap" role="status" aria-live="polite">
        <div className="success-icon" aria-hidden="true">✓</div>
        <div className="success-title">You&rsquo;re on the list, {name.split(' ')[0]}!</div>
        <p className="success-sub">
          Your <strong>{plan}</strong> early access request has been received.<br />
          We&rsquo;ll reach out to <strong>{email}</strong> within 24&nbsp;hours.
        </p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function EarlyAccessPage() {
  const [plan,   setPlan]   = useState<Plan>('Studio')
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS)
  const [error,  setError]  = useState('')
  const [state,  setState]  = useState<SubmitState>('idle')

  function setField(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const honeypot = (e.currentTarget.elements.namedItem('_gotcha') as HTMLInputElement).value
    if (honeypot) return

    const clean: FormFields = {
      name:     sanitize(fields.name),
      email:    sanitize(fields.email),
      phone:    sanitize(fields.phone),
      company:  sanitize(fields.company),
      role:     sanitize(fields.role),
      teamSize: sanitize(fields.teamSize),
      city:     sanitize(fields.city),
    }

    const err = validate(clean)
    if (err) { setError(err); return }

    setState('loading')
    setError('')

    try {
      const res = await fetch('/api/early-access', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          name:     clean.name,
          email:    clean.email,
          phone:    clean.phone    || undefined,
          company:  clean.company  || undefined,
          role:     clean.role     || undefined,
          teamSize: clean.teamSize || undefined,
          city:     clean.city     || undefined,
        }),
      })

      if (res.ok) {
        setState('success')
      } else {
        const { error: msg } = await res.json().catch(() => ({}))
        setError(msg ?? 'Something went wrong. Please try again.')
        setState('idle')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      setState('idle')
    }
  }

  if (state === 'success') {
    return (
      <>
        <div className="grid-bg" aria-hidden="true" />
        <div className="page">
          <nav className="nav">
            <div className="nav-center"><Logo /></div>
            <span className="nav-badge">Early Access</span>
          </nav>
          <main className="hero">
            <SuccessCard name={fields.name} email={fields.email} plan={plan} />
            <div className="proof-row">
              {PROOF_ITEMS.map(({ icon, text }) => (
                <div key={text} className="proof-item">
                  <span className="proof-icon" aria-hidden="true">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="grid-bg" aria-hidden="true" />

      <div className="page">

        <nav className="nav" aria-label="Site navigation">
          <div className="nav-center"><Logo /></div>
          <span className="nav-badge">Early Access</span>
        </nav>

        <main className="hero">

          <div className="badge" role="note">
            <span className="badge-dot" aria-hidden="true" />
            Early Access &mdash; Limited Spots Available
          </div>

          <h1 className="headline">
            Take Control of Your<br />
            <span className="headline-accent">Construction Finances</span>
          </h1>

          <p className="sub">
            ARC PEM is India&rsquo;s all-in-one <strong>offline</strong> platform for architects
            and builders &mdash; BOQ, vendor bills, labour tracking, GST, and Tally export
            unified in one place.
          </p>

          {/* ── Card ── */}
          <div className="card">

            {/* Card header */}
            <div className="card-header">
              <div className="card-header-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="card-title">Join the Early Access Waitlist</div>
                <div className="card-subtitle">
                  Select a plan and fill in your details — we&rsquo;ll reach out within 24 hours.
                </div>
              </div>
            </div>

            <div className="plan-divider" aria-hidden="true" />

            <form onSubmit={handleSubmit} noValidate aria-label="Early access sign-up">

              {/* Honeypot — invisible to real users */}
              <input
                name="_gotcha" tabIndex={-1}
                autoComplete="off" aria-hidden="true"
                className="honeypot"
              />

              {/* Step 1 — Details */}
              <span className="plan-section-label" style={{ display: 'block', marginBottom: 14 }}>
                <span className="step-num">1</span> Your details
              </span>

              <div className="form-grid">

                <div className="form-field">
                  <label htmlFor="f-name">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="f-name" type="text" name="name"
                    className={`text-input${error && !fields.name ? ' invalid' : ''}`}
                    placeholder="Rahul Vashisth"
                    value={fields.name}
                    onChange={e => setField('name', e.target.value)}
                    autoComplete="name" required aria-required="true"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="f-email">
                    Work Email <span className="req">*</span>
                  </label>
                  <input
                    id="f-email" type="email" name="email"
                    className={`text-input${error && !fields.email ? ' invalid' : ''}`}
                    placeholder="you@company.com"
                    value={fields.email}
                    onChange={e => setField('email', e.target.value)}
                    autoComplete="email" inputMode="email"
                    required aria-required="true"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="f-phone">WhatsApp Number</label>
                  <input
                    id="f-phone" type="tel" name="phone"
                    className="text-input"
                    placeholder="+91 98765 43210"
                    value={fields.phone}
                    onChange={e => setField('phone', e.target.value)}
                    autoComplete="tel" inputMode="tel"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="f-company">Firm / Company Name</label>
                  <input
                    id="f-company" type="text" name="company"
                    className="text-input"
                    placeholder="Skyline Architects"
                    value={fields.company}
                    onChange={e => setField('company', e.target.value)}
                    autoComplete="organization"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="f-role">Your Role</label>
                  <select
                    id="f-role" name="role"
                    className={`form-select${!fields.role ? ' placeholder' : ''}`}
                    value={fields.role}
                    onChange={e => setField('role', e.target.value)}
                  >
                    <option value="">Select role…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="f-team">Team Size</label>
                  <select
                    id="f-team" name="teamSize"
                    className={`form-select${!fields.teamSize ? ' placeholder' : ''}`}
                    value={fields.teamSize}
                    onChange={e => setField('teamSize', e.target.value)}
                  >
                    <option value="">Select size…</option>
                    {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* City spans both columns */}
                <div className="form-field full-width">
                  <label htmlFor="f-city">City</label>
                  <input
                    id="f-city" type="text" name="city"
                    className="text-input"
                    placeholder="Delhi, Mumbai, Pune…"
                    value={fields.city}
                    onChange={e => setField('city', e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>

              </div>

              <div className="plan-divider" aria-hidden="true" />

              {/* Step 2 — Plan */}
              <div className="plan-section">
                <span className="plan-section-label">
                  <span className="step-num">2</span> Choose your plan
                </span>
                <div className="plan-cards" role="radiogroup" aria-label="Plan selection">
                  {PLANS.map(p => (
                    <div
                      key={p.id}
                      className={`plan-card${plan === p.id ? ' selected' : ''}`}
                      onClick={() => setPlan(p.id)}
                      role="radio"
                      aria-checked={plan === p.id}
                      tabIndex={0}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPlan(p.id)}
                    >
                      <div className="plan-card-top">
                        <span className="plan-card-name">{p.id}</span>
                        {p.popular && <span className="plan-card-badge">Popular</span>}
                      </div>
                      <div className="plan-card-price">{p.price}</div>
                      <div className="plan-card-sub">{p.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="error-text" role="alert" aria-live="assertive">
                  <span aria-hidden="true">⚠</span> {error}
                </p>
              )}

              <button
                type="submit"
                className="cta-btn"
                style={{ width: '100%', marginTop: '16px' }}
                disabled={state === 'loading'}
                aria-label={`Request ${plan} early access`}
              >
                {state === 'loading' ? (
                  <><span className="spinner" aria-hidden="true" />Sending&hellip;</>
                ) : (
                  `Request ${plan} Early Access →`
                )}
              </button>

              <div className="trust-strip" aria-label="Privacy assurance">
                <span>🔒</span>
                <strong>No spam, ever.</strong>
                <span className="dot" aria-hidden="true" />
                <span>We respect your privacy.</span>
                <span className="dot" aria-hidden="true" />
                <span>14-day free trial · No credit card.</span>
              </div>

            </form>
          </div>

          {/* Social proof */}
          <div className="proof-row" aria-label="Key product benefits">
            {PROOF_ITEMS.map(({ icon, text }) => (
              <div key={text} className="proof-item">
                <span className="proof-icon" aria-hidden="true">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

        </main>

        <Footer />
      </div>
    </>
  )
}
