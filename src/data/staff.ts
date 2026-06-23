import staffData from './staff.json';

/* Staff roster lives in staff.json so the /admin panel can edit it.
   `accent` maps to a CSS color token used for the role badge. */
export type StaffAccent = 'gold' | 'red' | 'purple' | 'blue' | 'green' | 'gray';
export type StaffRole = {
  role: string;
  accent: StaffAccent;
  members: string[];
};

export const STAFF: StaffRole[] = staffData as unknown as StaffRole[];

// Minecraft head avatar for a username (free, no key required).
export const headUrl = (name: string, size = 80) =>
  `https://minotar.net/helm/${encodeURIComponent(name)}/${size}.png`;
