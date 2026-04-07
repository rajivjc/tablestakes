import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildNegotiatorPrompt,
  buildMomentumPrompt,
  buildDebriefPrompt,
  getDrillSystemPrompt,
} from "@/lib/prompts";
import { parseResponse, parseDebriefResponse, parseDrillResponse } from "@/lib/parseResponse";
import { checkRateLimit, incrementRateLimit, checkRequestRateLimit, incrementRequestRateLimit } from "@/lib/rateLimit";
import { validateInput, redactPII } from "@/lib/security";
import { getStrategyById } from "@/lib/strategies";
import { getDifficultyById } from "@/lib/difficulty";
import { DRILL_SCENARIOS } from "@/lib/drillScenarios";

const client = new Anthropic();

type MessageRole = "user" | "assistant";

interface Message {
  role: MessageRole;
  content: string;
}

interface TurnRequest {
  type: "turn";
  scenario: string;
  strategyId: string;
  difficulty: string;
  turnNumber: number;
  totalTurns: number;
  messages: Message[];
}

interface DebriefRequest {
  type: "debrief";
  scenario: string;
  strategyId: string;
  strategyLabel: string;
  strategyDescription: string;
  isCustomScenario: boolean;
  difficulty: string;
  difficultyLabel: string;
  messages: Message[];
}

interface DrillRequest {
  type: "drill";
  scenarioId: string;
  userResponse: string;
}

type NegotiateRequest = TurnRequest | DebriefRequest | DrillRequest;

// Validate origin
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (process.env.NODE_ENV === "development") return true;
  if (!origin) return false;
  const allowedOrigins = [
    `https://${host}`,
    "https://tablestakes-sage.vercel.app",
  ];
  return allowedOrigins.includes(origin);
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    // Origin validation
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Size limit (50KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 50_000) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

    const ip = getClientIP(request);

    const body: NegotiateRequest = await request.json();

    // Validate scenario input (turn and debrief only — drills validate userResponse instead)
    if (body.type === "turn" || body.type === "debrief") {
      const scenarioCheck = validateInput(body.scenario);
      if (!scenarioCheck.valid) {
        return NextResponse.json(
          { error: scenarioCheck.reason },
          { status: 400 }
        );
      }
    }

    if (body.type === "turn") {
      return handleTurn(body, ip);
    } else if (body.type === "debrief") {
      return handleDebrief(body, ip);
    } else if (body.type === "drill") {
      return handleDrill(body, ip);
    } else {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}

async function handleTurn(body: TurnRequest, ip: string) {
  // Per-IP request rate limit (checked on every request)
  const requestRateCheck = checkRequestRateLimit(ip);
  if (!requestRateCheck.allowed) {
    return NextResponse.json(
      { error: requestRateCheck.reason },
      { status: 429 }
    );
  }

  // Session rate limit on first turn only
  if (body.turnNumber === 1) {
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        { status: 429 }
      );
    }
    incrementRateLimit(ip);
  }

  // Resolve strategy server-side
  const strategy = getStrategyById(body.strategyId);
  if (!strategy) {
    return NextResponse.json(
      { error: "Invalid strategy" },
      { status: 400 }
    );
  }

  // Resolve difficulty (default to medium if not found)
  const difficulty = getDifficultyById(body.difficulty) ?? getDifficultyById("medium")!;

  // Validate conversation history length
  const expectedLength = (body.turnNumber - 1) * 2 + 1;
  if (body.messages.length !== expectedLength) {
    return NextResponse.json(
      { error: "Invalid conversation history" },
      { status: 400 }
    );
  }

  // Validate message roles alternate correctly (user, assistant, user, assistant, ...)
  for (let i = 0; i < body.messages.length; i++) {
    const expectedRole = i % 2 === 0 ? "user" : "assistant";
    if (body.messages[i].role !== expectedRole) {
      return NextResponse.json(
        { error: "Invalid conversation history" },
        { status: 400 }
      );
    }
  }

  // Validate the latest user message
  const lastUserMsg = body.messages[body.messages.length - 1];
  if (lastUserMsg?.role === "user") {
    const msgCheck = validateInput(lastUserMsg.content);
    if (!msgCheck.valid) {
      return NextResponse.json({ error: msgCheck.reason }, { status: 400 });
    }
  }

  // Increment request count after all validation passes
  incrementRequestRateLimit(ip);

  // Build conversation history with input wrapping
  const wrappedMessages = body.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content:
      m.role === "user"
        ? `<user_message>${m.content}</user_message>`
        : m.content,
  }));

  // Call negotiator and momentum in parallel
  const [negotiatorResult, momentumResult] = await Promise.all([
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: buildNegotiatorPrompt(
        body.scenario,
        strategy.promptFragment,
        body.turnNumber,
        body.totalTurns,
        difficulty.promptModifier
      ),
      messages: wrappedMessages,
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      system: buildMomentumPrompt(body.scenario),
      messages: wrappedMessages,
    }),
  ]);

  // Parse negotiator response
  const negotiatorText =
    negotiatorResult.content[0].type === "text"
      ? negotiatorResult.content[0].text
      : "";
  const negotiatorParsed = parseResponse<{ message: string }>(negotiatorText);
  const aiMessage = redactPII(
    negotiatorParsed?.message || negotiatorText.slice(0, 300)
  );

  // Parse momentum response
  const momentumText =
    momentumResult.content[0].type === "text"
      ? momentumResult.content[0].text
      : "";
  const momentumParsed = parseResponse<{ score: number }>(momentumText);
  const score = Math.max(
    0,
    Math.min(100, momentumParsed?.score ?? 50)
  );

  return NextResponse.json({
    message: aiMessage,
    momentum: score,
  });
}

async function handleDebrief(body: DebriefRequest, ip: string) {
  // Per-IP request rate limit (checked on every request)
  const requestRateCheck = checkRequestRateLimit(ip);
  if (!requestRateCheck.allowed) {
    return NextResponse.json(
      { error: requestRateCheck.reason },
      { status: 429 }
    );
  }
  incrementRequestRateLimit(ip);
  // Build conversation for debrief
  const conversationText = body.messages
    .map(
      (m, i) =>
        `${m.role === "user" ? "User" : "Opponent"} (Turn ${Math.floor(i / 2) + 1}): ${m.content}`
    )
    .join("\n\n");

  const debriefResult = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: buildDebriefPrompt(
      body.scenario,
      body.strategyLabel,
      body.strategyDescription,
      body.isCustomScenario,
      body.difficultyLabel
    ),
    messages: [
      {
        role: "user",
        content: `<negotiation_transcript>\n${conversationText}\n</negotiation_transcript>\n\nProvide your analysis as a JSON object.`,
      },
    ],
  });

  const debriefText =
    debriefResult.content[0].type === "text"
      ? debriefResult.content[0].text
      : "";
  const debriefParsed = parseDebriefResponse(debriefText);

  if (!debriefParsed) {
    return NextResponse.json(
      { error: "Failed to analyze negotiation. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    overallScore: Math.max(0, Math.min(100, debriefParsed.overallScore)),
    strategy: body.strategyId,
    strategyLabel: body.strategyLabel,
    annotations: debriefParsed.annotations,
    keyTakeaway: debriefParsed.keyTakeaway,
    tacticsUsed: debriefParsed.tacticsUsed,
    missedOpportunities: debriefParsed.missedOpportunities,
    languageFlags: debriefParsed.languageFlags,
  });
}

async function handleDrill(body: DrillRequest, ip: string) {
  // Per-IP request rate limit
  const requestRateCheck = checkRequestRateLimit(ip);
  if (!requestRateCheck.allowed) {
    return NextResponse.json(
      { error: requestRateCheck.reason },
      { status: 429 }
    );
  }

  // Look up scenario server-side
  const scenario = DRILL_SCENARIOS.find((s) => s.id === body.scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { error: "Invalid scenario" },
      { status: 400 }
    );
  }

  // Validate user response
  const responseCheck = validateInput(body.userResponse);
  if (!responseCheck.valid) {
    return NextResponse.json({ error: responseCheck.reason }, { status: 400 });
  }

  incrementRequestRateLimit(ip);

  const systemPrompt = getDrillSystemPrompt(
    scenario.type,
    scenario.context,
    scenario.opponentStatement,
    body.userResponse,
    scenario.gradingFocus,
    scenario.batna
  );

  const result = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Grade this drill response. Return only the JSON object.",
      },
    ],
  });

  const text = result.content[0].type === "text" ? result.content[0].text : "";
  const parsed = parseDrillResponse(text);

  if (!parsed) {
    return NextResponse.json(
      { error: "Failed to grade drill response. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed);
}
