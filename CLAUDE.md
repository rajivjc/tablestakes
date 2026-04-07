# TableStakes — Claude Code Project Context

## What is this
Multi-turn negotiation simulator + targeted drill trainer. User practices negotiations against an AI opponent playing a hidden (or chosen) strategy. 6 fixed turns, momentum tracking, full debrief with score and annotations. Quick Drills offer 1-turn focused exercises on specific skills (anchoring, countering, walking away, reframing).

## Stack
- Next.js 15.5.14, React 19, TypeScript
- Anthropic API (Claude Haiku) — 13 calls per full negotiation session, 1 call per drill
- Tailwind CSS (inline, no separate CSS files beyond globals.css)
- Vercel deployment at tablestakes-sage.vercel.app
- No database, no auth, no cookies
- localStorage for session history (negotiations + drills, separate keys)

## Architecture
Single-page app with 7 state-driven screens (Setup → Prep (optional) → Negotiation → Debrief → History, plus Drill Picker → Drill Active). One API route at `/api/negotiate` handles all AI calls via `type` field: `"turn"`, `"debrief"`, `"drill"`. Difficulty tiers (Easy/Medium/Hard) modify opponent behavior independently of strategy. Pre-negotiation prep mode lets users define BATNA, walk-away point, and opening strategy before negotiating; the debrief grades plan adherence if prep was provided.

**Per negotiation turn (2 parallel calls):**
1. Negotiator — plays the opponent in character
2. Momentum — independent evaluator, returns score 0-100

**After turn 6 (1 call):**
3. Debrief — scores 0-100, 6 turn annotations, key takeaway, tactics, missed opportunities, language flags

**Per drill (1 call):**
4. Drill grader — scores 0-100, verdict, what worked, what to improve. Scenario content looked up server-side by scenarioId.

## Key files
- `lib/prompts.ts` — all system prompts (negotiator, momentum, debrief, drill)
- `lib/difficulty.ts` — 3 difficulty tiers (Easy/Medium/Hard) with prompt modifiers
- `lib/strategies.ts` — 4 strategy definitions with behavioral prompt fragments
- `lib/scenarios.ts` — 3 preset negotiation scenarios
- `lib/drillScenarios.ts` — 16 drill scenarios (4 types × 4 each), types, random selection helper
- `lib/storage.ts` — localStorage helpers for negotiation sessions + drill results (separate keys)
- `lib/patterns.ts` — 8 pattern detection checks for negotiation history
- `lib/parseResponse.ts` — JSON parsers with safe fallbacks (negotiator, debrief, drill)
- `lib/security.ts` — injection detection, PII redaction, input validation
- `lib/rateLimit.ts` — IP (15/day) + global (500/day) rate limiting
- `app/api/negotiate/route.ts` — single POST endpoint (turn, debrief, drill handlers)
- `app/page.tsx` — main SPA (all 6 screens)
- `components/PrepScreen.tsx` — pre-negotiation prep plan input (BATNA, walk-away, opening strategy)
- `components/` — MomentumMeter, ScoreDial, ChatBubble, TurnTimeline, HistoryScreen (tabbed: Negotiations/Drills), ScoreTrend, StatsRow, PatternInsights, SessionCard, DrillPicker, DrillActive, DrillHistory

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
- Drill scenarios resolved server-side by scenarioId (no client-supplied prompt content)

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
