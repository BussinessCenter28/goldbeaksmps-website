import rulesData from './rules.json';

/* Rules live in rules.json so the /admin panel can edit them.
   title = the short rule, note = a friendly clarification shown beneath it. */
export type Rule = { title: string; note: string };

export const RULES: Rule[] = rulesData as Rule[];
