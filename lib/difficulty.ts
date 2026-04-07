export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  promptModifier: string;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "easy",
    label: "Easy",
    description: "Opponent is willing to compromise.",
    promptModifier:
      "You are open to compromise. If the user makes a reasonable proposal backed by logic, you're willing to meet them partway. You make small concessions to keep the conversation moving. You don't withhold information — if asked directly, you answer honestly.",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced — the opponent plays their strategy straight.",
    promptModifier: "",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Opponent is aggressive and resistant.",
    promptModifier:
      "You are a tough negotiator. You resist concessions aggressively — never give ground without extracting something of equal or greater value. Deflect direct questions about your constraints or bottom line. Create time pressure: mention deadlines, competing offers, or expiring windows. If the user's argument is weak, exploit it. If their argument is strong, acknowledge it minimally and pivot to a different concern. You are not hostile — you are strategically difficult.",
  },
];

export function getDifficultyById(id: string): DifficultyConfig | undefined {
  return DIFFICULTIES.find((d) => d.id === id);
}
