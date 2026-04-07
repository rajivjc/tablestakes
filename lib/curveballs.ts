export interface Curveball {
  id: string;
  label: string;
  promptInstruction: string;
}

export const CURVEBALLS: Curveball[] = [
  {
    id: "budget-cut",
    label: "Budget Cut",
    promptInstruction: "CURVEBALL: In this response, naturally reveal that your budget has just been cut by 20%. This is new information — you just found out. Work it into your response as a real constraint, not an excuse. This changes what you can offer.",
  },
  {
    id: "competing-offer",
    label: "Competing Offer",
    promptInstruction: "CURVEBALL: In this response, naturally mention that you've received a competing offer from another party that's quite attractive. Don't bluff — this is real. Use it as leverage but don't be heavy-handed about it.",
  },
  {
    id: "deadline-change",
    label: "Deadline Moved Up",
    promptInstruction: "CURVEBALL: In this response, naturally reveal that the timeline has been accelerated — a decision is now needed by end of week instead of end of month. This creates genuine urgency. Express this as a real constraint.",
  },
  {
    id: "scope-change",
    label: "Scope Change",
    promptInstruction: "CURVEBALL: In this response, naturally introduce a change in scope or requirements. Something new has come up — additional deliverables, expanded responsibilities, or changed specifications. Present this matter-of-factly as something that just emerged.",
  },
  {
    id: "stakeholder-objection",
    label: "Stakeholder Objection",
    promptInstruction: "CURVEBALL: In this response, naturally reveal that a key decision-maker (your boss, the board, a partner) has raised concerns about the current direction of this negotiation. You now have less flexibility than before. Present this as a real internal constraint you're navigating.",
  },
  {
    id: "market-shift",
    label: "Market Shift",
    promptInstruction: "CURVEBALL: In this response, naturally reference a recent market change that affects this negotiation — new data, a competitor's move, an industry shift, or economic news. This changes the context for both parties. Present it as something that just came to your attention.",
  },
];

/**
 * Select a random curveball.
 */
export function getRandomCurveball(): Curveball {
  return CURVEBALLS[Math.floor(Math.random() * CURVEBALLS.length)];
}

/**
 * Randomly pick turn 3 or 4 for the curveball.
 */
export function getCurveballTurn(): number {
  return Math.random() < 0.5 ? 3 : 4;
}
