/**
 * Drill scenarios for targeted negotiation practice.
 * 4 types × 4 scenarios = 16 total.
 */

export type DrillType = "anchoring" | "countering" | "walking-away" | "reframing";

export interface DrillScenario {
  id: string;
  type: DrillType;
  title: string;
  context: string;
  opponentStatement: string;
  batna?: string;
  gradingFocus: string[];
}

export const DRILL_TYPES: { type: DrillType; label: string; description: string; icon: string }[] = [
  { type: "anchoring", label: "Anchoring", description: "Set the opening frame", icon: "🎯" },
  { type: "countering", label: "Countering", description: "Push back on a tough offer", icon: "🛡️" },
  { type: "walking-away", label: "Walking Away", description: "Know when to leave", icon: "🚪" },
  { type: "reframing", label: "Reframing", description: "Shift the conversation", icon: "🔄" },
];

export const DRILL_SCENARIOS: DrillScenario[] = [
  // ── ANCHORING (4) ──
  {
    id: "anchoring-1",
    type: "anchoring",
    title: "Salary Negotiation Opening",
    context: "You've been offered a senior product manager role at a mid-size tech company. The recruiter asked what compensation you're looking for. Market rate for this role is $160K–$195K. You have 8 years of experience.",
    opponentStatement: "We're really excited to move forward. What kind of compensation are you targeting?",
    gradingFocus: [
      "Did they anchor with a specific number or range?",
      "Is the anchor confident and justified with reasoning?",
      "Did they anchor first rather than deferring?",
    ],
  },
  {
    id: "anchoring-2",
    type: "anchoring",
    title: "Freelance Project Pricing",
    context: "A startup wants you to redesign their entire e-commerce platform. The project will take roughly 3 months. You typically charge $120–$150/hour for this type of work. They haven't mentioned budget yet.",
    opponentStatement: "We love your portfolio. What would a project like this cost us?",
    gradingFocus: [
      "Did they anchor with a specific number or range?",
      "Is the anchor justified with scope or value reasoning?",
      "Did they anchor first rather than asking for the client's budget?",
    ],
  },
  {
    id: "anchoring-3",
    type: "anchoring",
    title: "Used Car Purchase",
    context: "You're buying a 3-year-old sedan listed at $28,500. Similar models in the area sell for $24K–$27K. The car has minor cosmetic wear and slightly above-average mileage. The seller seems motivated.",
    opponentStatement: "So, what are you thinking? Make me an offer.",
    gradingFocus: [
      "Did they anchor with a specific number?",
      "Is the anchor backed by market data or vehicle condition?",
      "Did they set the frame confidently without hedging?",
    ],
  },
  {
    id: "anchoring-4",
    type: "anchoring",
    title: "Vendor Partnership Terms",
    context: "Your company wants to license a data analytics tool for 200 seats. The vendor's list price is $80/seat/month. You know competitors charge $50–$65 for comparable features. This is a first conversation about pricing.",
    opponentStatement: "We'd love to work with your team. What kind of pricing structure works for you?",
    gradingFocus: [
      "Did they anchor with a specific price point?",
      "Did they justify the anchor with competitive alternatives or volume?",
      "Did they frame the anchor as reasonable rather than aggressive?",
    ],
  },

  // ── COUNTERING (4) ──
  {
    id: "countering-1",
    type: "countering",
    title: "Lowball Salary Offer",
    context: "You're negotiating a software engineering offer. You asked for $180K. The market range is $165K–$190K. The hiring manager just came back with a number well below your ask.",
    opponentStatement: "We can offer $148K. That's at the top of our approved band for this level, and we think the equity package makes up the difference.",
    gradingFocus: [
      "Did they hold firm and not accept the offer?",
      "Did they provide a counter-rationale using data or value?",
      "Did they offer creative alternatives (signing bonus, review timeline)?",
    ],
  },
  {
    id: "countering-2",
    type: "countering",
    title: "Client Cutting Scope and Budget",
    context: "You quoted $45K for a 3-month branding project. The client loved the proposal but is now trying to slash the budget while keeping most deliverables.",
    opponentStatement: "We can only do $28K. But we still need the brand identity, website copy, and social templates. Can you make it work?",
    gradingFocus: [
      "Did they hold firm on pricing or adjust scope proportionally?",
      "Did they explain the value of what's being cut?",
      "Did they offer alternatives rather than simply refusing?",
    ],
  },
  {
    id: "countering-3",
    type: "countering",
    title: "Lease Renewal Pressure",
    context: "Your office lease is up for renewal. You currently pay $42/sqft. The landlord is pushing a steep increase, citing market conditions. Comparable spaces nearby are $40–$46/sqft.",
    opponentStatement: "Given current market rates, we need to move to $52 per square foot. This is non-negotiable — we have other tenants interested in the space.",
    gradingFocus: [
      "Did they push back on the stated 'non-negotiable' position?",
      "Did they use market data or alternatives as leverage?",
      "Did they remain professional while standing firm?",
    ],
  },
  {
    id: "countering-4",
    type: "countering",
    title: "Supplier Price Hike",
    context: "Your main packaging supplier just announced a 25% price increase effective next quarter. You've been a customer for 4 years and order $200K+ annually. Switching suppliers would take 2–3 months.",
    opponentStatement: "Raw material costs are up across the board. The new pricing is $3.80 per unit, up from $3.05. This applies to all customers — no exceptions.",
    gradingFocus: [
      "Did they challenge the blanket increase rather than accepting it?",
      "Did they leverage their customer history or volume?",
      "Did they propose a creative middle ground?",
    ],
  },

  // ── WALKING AWAY (4) ──
  {
    id: "walking-away-1",
    type: "walking-away",
    title: "Below-Market Job Offer",
    context: "You've been interviewing for a marketing director role. After three rounds, they finally made an offer. You have another offer in hand that's significantly better.",
    opponentStatement: "We'd like to offer you $105K with standard benefits. We think you'd be a great fit and hope you can start in two weeks.",
    batna: "You have a competing offer at $135K with better benefits and a signing bonus.",
    gradingFocus: [
      "Did they recognize the offer is below their BATNA?",
      "Did they clearly walk away or credibly threaten to?",
      "Was the exit professional and clear in reasoning?",
    ],
  },
  {
    id: "walking-away-2",
    type: "walking-away",
    title: "Bad Real Estate Deal",
    context: "You're buying a condo and have been negotiating for two weeks. The seller keeps adding conditions — no inspection contingency, accelerated closing, covering their transfer taxes.",
    opponentStatement: "Final offer: $415K, as-is, no inspection, you cover closing costs. We need an answer by tomorrow or we go with the other buyer.",
    batna: "You have two other properties you like at $390K–$400K that come with standard contingencies and no pressure tactics.",
    gradingFocus: [
      "Did they recognize the deal terms are worse than their alternatives?",
      "Did they walk away rather than caving to the pressure?",
      "Was the reasoning clear and professional?",
    ],
  },
  {
    id: "walking-away-3",
    type: "walking-away",
    title: "Exploitative Client Contract",
    context: "A new client wants to hire you for ongoing consulting. The retainer terms they proposed include unlimited revisions, IP assignment of all work, and a 90-day payment term.",
    opponentStatement: "We love your work. Here's our standard contract — $4,000/month retainer, all deliverables become our IP, unlimited revisions, net-90 payment. Everyone signs this version.",
    batna: "You have two other clients offering $5K–$6K/month retainers with standard 30-day payment and reasonable revision limits.",
    gradingFocus: [
      "Did they identify the unfavorable terms?",
      "Did they walk away or firmly decline the terms as presented?",
      "Was the exit professional and did they explain their reasoning?",
    ],
  },
  {
    id: "walking-away-4",
    type: "walking-away",
    title: "Partnership Deal Gone Sideways",
    context: "You've been negotiating a revenue-share partnership with a larger company. Over three meetings, they've steadily reduced your share and added exclusivity requirements that would block you from other deals.",
    opponentStatement: "Here's where we've landed: 12% revenue share, exclusive partnership for 24 months, and we retain the right to sublicense your content. This is our final position.",
    batna: "You can launch independently with your existing audience and keep 100% of revenue. A smaller partner has offered 30% share with no exclusivity.",
    gradingFocus: [
      "Did they recognize the terms are far below their BATNA?",
      "Did they actually walk away or threaten to credibly?",
      "Did they clearly articulate why the deal doesn't work?",
    ],
  },

  // ── REFRAMING (4) ──
  {
    id: "reframing-1",
    type: "reframing",
    title: "Price-Fixated Client",
    context: "You run a web development agency. A potential client keeps comparing your $35K quote to a $12K quote from an offshore team. Your track record includes 40% average conversion lift for similar projects.",
    opponentStatement: "I've got another team that can do this for $12K. Why should I pay almost triple for the same website?",
    gradingFocus: [
      "Did they shift the conversation away from price alone?",
      "How many new value dimensions did they introduce?",
      "Were the reframing points relevant and persuasive?",
    ],
  },
  {
    id: "reframing-2",
    type: "reframing",
    title: "Salary Stuck on Numbers",
    context: "You're negotiating a job offer. The hiring manager won't budge on base salary ($140K, you wanted $155K). There may be flexibility in other areas — title, equity, remote work, PTO, learning budget.",
    opponentStatement: "Look, $140K is the absolute ceiling for this band. I've already pushed finance as far as they'll go on base. Take it or leave it.",
    gradingFocus: [
      "Did they move the conversation beyond base salary?",
      "How many alternative value dimensions did they introduce?",
      "Were the proposed alternatives realistic and relevant?",
    ],
  },
  {
    id: "reframing-3",
    type: "reframing",
    title: "Vendor Focused Only on Unit Price",
    context: "You're a procurement manager negotiating with a software vendor. They keep quoting per-seat pricing. Your real concerns are implementation support, data migration, and contract flexibility.",
    opponentStatement: "We're already at $62 per seat, which is 15% below our standard rate. I really can't go lower than that. The per-seat cost is extremely competitive.",
    gradingFocus: [
      "Did they shift from per-seat cost to total value of the deal?",
      "Did they introduce dimensions like implementation, support, or terms?",
      "Were the new dimensions relevant to their actual concerns?",
    ],
  },
  {
    id: "reframing-4",
    type: "reframing",
    title: "Landlord Only Talks Rent",
    context: "You're negotiating a commercial lease renewal. The landlord only wants to discuss monthly rent, but you care about lease length flexibility, build-out allowance, and signage rights that could drive foot traffic.",
    opponentStatement: "The rent is $4,200 per month, and that's already a fair deal for this neighborhood. I don't see why we're still talking about this.",
    gradingFocus: [
      "Did they redirect the conversation to non-rent terms?",
      "How many new dimensions did they raise (lease term, build-out, signage, etc.)?",
      "Were the reframing points persuasive and well-connected to their needs?",
    ],
  },
];

/**
 * Get a random scenario for a given drill type, optionally excluding a scenario ID.
 */
export function getRandomDrillScenario(type: DrillType, excludeId?: string): DrillScenario {
  const candidates = DRILL_SCENARIOS.filter(
    (s) => s.type === type && s.id !== excludeId
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}
