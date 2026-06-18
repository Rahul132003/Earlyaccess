import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const VALID_PLANS = ['Solo', 'Studio', 'Enterprise'] as const

/** Strip HTML tags and dangerous characters to prevent XSS before persistence. */
function sanitize(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim()
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot — silently accept so bots don't know they were blocked
  if (body._gotcha) {
    return NextResponse.json({ ok: true })
  }

  // ── Validate required fields ───────────────────────────────────────────────
  const plan  = sanitize(body.plan)
  const name  = sanitize(body.name)
  const email = sanitize(body.email)

  if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    return NextResponse.json({ error: 'Please select a plan.' }, { status: 422 })
  }
  if (!name) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 422 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 422 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 422 })
  }

  // ── Optional fields ────────────────────────────────────────────────────────
  const phone    = sanitize(body.phone)    || null
  const company  = sanitize(body.company)  || null
  const role     = sanitize(body.role)     || null
  const teamSize = sanitize(body.teamSize) || null
  const city     = sanitize(body.city)     || null

  try {
    await db.earlyAccessEntry.create({
      data: {
        plan,
        name,
        email,
        phone,
        company,
        role,
        teamSize,
        city,
        ipAddress:
          req.headers.get('x-forwarded-for') ??
          req.headers.get('x-real-ip') ??
          null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    // MongoDB duplicate key — email already registered
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: "You're already on the list! We'll be in touch soon." },
        { status: 409 }
      )
    }

    console.error('[POST /api/early-access]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Server error: ${String(err)}`
      : 'Server error. Please try again.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
