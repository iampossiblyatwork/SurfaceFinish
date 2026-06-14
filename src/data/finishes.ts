// TypeScript types for the finish catalog served from /api/finishes.
// The data now lives in backend/engine/finishes.py.

export interface Finish {
  id: string;
  process: string;
  family: string;
  description: string;
  applications: string;
  raMin: number;
  raMax: number;
  defaultRa: number;
}
