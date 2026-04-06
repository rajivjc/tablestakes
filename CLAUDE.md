# TableStakes — Claude Code Project Context

## What is this
Multi-turn negotiation simulator. User practices negotiations against an AI opponent playing a hidden (or chosen) strategy. 6 fixed turns, momentum tracking, full debrief with score and annotations.

## Stack
- Next.js 15.5.14, React 19, TypeScript
- Anthropic API (Claude Haiku) — 13 calls per session
- Tailwind CSS (inline, no separate CSS files beyond globals.css)
- Vercel deployment at tablestakes-sage.vercel.app
- No database, no auth, no cookies

## Architecture
Single-page app with 3 state-driven screens (Setup → Negotiation → Debrief). One API route at `/api/negotiate` handles all AI calls.

**Per turn (2 parallel calls):**
1. Negotiator — plays the opponent in character
2. Momentum — independent evaluator, returns score 0-100

**After turn 6 (1 call):**
3. Debrief — scores 0-100, 6 turn annotations, key takeaway

## Key files
- `lib/prompts.ts` — all system prompts (negotiator, momentum, debrief)
- `lib/strategies.ts` — 4 strategy definitions with behavioral prompt fragments
- `lib/scenarios.ts` — 3 preset scenarios
- `lib/security.ts` — injection detection, PII redaction, input validation
- `lib/rateLimit.ts` — IP (15/day) + global (500/day) rate limiting
- `app/api/negotiate/route.ts` — single POST endpoint
- `app/page.tsx` — main SPA (all 3 screens)
- `components/` — MomentumMeter, ScoreDial, ChatBubble, TurnTimeline

## Design DNA
- Dark surface (#0a0a0c), amber/gold accent (#d4a843)
- Instrument Serif (display), DM Sans (body), JetBrains Mono (labels)
- Mobile-first, iOS PWA test environment
- Noise texture overlay, animated transitions
- Deadpan copy, no emojis, no sycophancy

## Security (applied from commit 1)
- Origin validation on API route
- Regex injection detection on all user inputs
- Input wrapping (XML tags in prompts)
- Rate limiting (IP + global)
- Request size limit (50KB)
- PII redaction on AI outputs
- Error sanitization (no stack traces)
- CSP headers in next.config.ts

## Commands
```bash
npm run dev    # local development
npm run build  # production build
npm run lint   # linting
```

## Coding preferences
- No separate CSS files — Tailwind inline only, globals.css for animations
- Single-file components where possible
- All AI outputs ≤80 words (enforced in prompts)
- Honest error messages, no sugar-coating
- Test on iOS Safari as primary mobile target
