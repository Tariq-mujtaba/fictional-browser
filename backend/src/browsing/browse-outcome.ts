export const BROWSE_OUTCOMES = ['found', 'not_found'] as const;

export type BrowseOutcome = (typeof BROWSE_OUTCOMES)[number];
