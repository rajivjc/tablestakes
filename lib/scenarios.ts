export interface Scenario {
  id: string;
  label: string;
  briefing: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "salary",
    label: "Salary Negotiation",
    briefing:
      "You're a senior engineer asking for a 20% raise. Your manager values your work but is under budget pressure. You speak first.",
  },
  {
    id: "vendor",
    label: "Vendor Pricing",
    briefing:
      "You're renegotiating a software license that's up for renewal. The vendor wants to increase pricing 30%. Your company needs the tool but has alternatives. You speak first.",
  },
  {
    id: "client",
    label: "Client Pushback",
    briefing:
      "Your client is unhappy with a delayed deliverable and is threatening to withhold payment. The delay was partly due to their late requirements. You speak first.",
  },
];
