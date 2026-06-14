// Indicative surface roughness comparison data (Ra in µm), grouped by process
// family. Ranges are approximate / typical — sourced from the classic
// "indicative surface roughness comparisons" reference chart. Used by the
// ProcessComparison chart, which is explicitly framed as indicative, not spec.

export interface ProcessRange {
  name: string;
  raMin: number;
  raMax: number;
}

export interface ProcessFamily {
  family: string;
  processes: ProcessRange[];
}

export const PROCESS_COMPARISON: ProcessFamily[] = [
  {
    family: "Tube finishing",
    processes: [
      { name: "Hot extruded", raMin: 25, raMax: 37.5 },
      { name: "Cold drawn", raMin: 1.6, raMax: 3.2 },
      { name: "Smooth bore", raMin: 0.4, raMax: 0.8 },
      { name: "Electropolished", raMin: 0.1, raMax: 0.4 },
    ],
  },
  {
    family: "Metal cutting",
    processes: [
      { name: "Sawing", raMin: 3.2, raMax: 25 },
      { name: "Planing, shaping", raMin: 1.6, raMax: 12.5 },
      { name: "Drilling", raMin: 1.6, raMax: 6.3 },
      { name: "Milling", raMin: 0.8, raMax: 6.3 },
      { name: "Boring, turning", raMin: 0.4, raMax: 6.3 },
      { name: "Broaching", raMin: 0.8, raMax: 3.2 },
      { name: "Reaming", raMin: 0.8, raMax: 3.2 },
    ],
  },
  {
    family: "Abrasive",
    processes: [
      { name: "Grinding", raMin: 0.1, raMax: 1.6 },
      { name: "Barrel finishing", raMin: 0.2, raMax: 0.8 },
      { name: "Honing", raMin: 0.1, raMax: 0.8 },
      { name: "Electro-polishing", raMin: 0.1, raMax: 0.8 },
      { name: "Electrolytic grinding", raMin: 0.2, raMax: 0.8 },
      { name: "Polishing", raMin: 0.05, raMax: 0.4 },
      { name: "Lapping", raMin: 0.025, raMax: 0.4 },
      { name: "Superfinishing", raMin: 0.012, raMax: 0.2 },
    ],
  },
  {
    family: "Forming",
    processes: [
      { name: "Hot rolling", raMin: 12.5, raMax: 25 },
      { name: "Forging", raMin: 3.2, raMax: 12.5 },
      { name: "Extruding", raMin: 0.8, raMax: 3.2 },
      { name: "Cold rolling, drawing", raMin: 0.8, raMax: 3.2 },
      { name: "Roller burnishing", raMin: 0.1, raMax: 0.4 },
    ],
  },
  {
    family: "Other",
    processes: [
      { name: "Flame cutting", raMin: 12.5, raMax: 25 },
      { name: "Chemical milling", raMin: 0.8, raMax: 6.3 },
      { name: "Electron beam cutting", raMin: 0.8, raMax: 6.3 },
      { name: "Laser cutting", raMin: 0.8, raMax: 6.3 },
      { name: "EDM", raMin: 0.8, raMax: 6.3 },
    ],
  },
];

/** Tick values (µm) along the Ra axis, rough → fine. */
export const RA_TICKS = [50, 25, 12.5, 6.3, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1, 0.05, 0.025, 0.012];

export const RA_DOMAIN_MIN = 0.012;
export const RA_DOMAIN_MAX = 50;
