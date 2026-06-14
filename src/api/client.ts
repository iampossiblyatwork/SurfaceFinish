// Typed API client — thin wrappers around fetch that call the FastAPI backend.
// All values are in µm internally; display conversion happens at render time.

export interface FinishSummary {
  id: string;
  process: string;
  family: string;
  description: string;
  applications: string;
  raMin: number;
  raMax: number;
  defaultRa: number;
}

export interface FinishesResponse {
  finishes: FinishSummary[];
  families: string[];
}

export interface ParameterDef {
  symbol: string;
  name: string;
  category: "amplitude" | "spacing" | "hybrid" | "material-ratio";
  dimension: "2D" | "3D";
  unitType: "height" | "lateral" | "unitless" | "angle";
  key: string | null;
  summary: string;
  meaning: string;
  formula: string;
}

export interface ParametersResponse {
  parameters: ParameterDef[];
}

export interface Profile {
  z: number[];
  dx: number;
}

export interface RoughnessParameters {
  Ra: number;
  Rq: number;
  Rp: number;
  Rv: number;
  Rz: number;
  Rt: number;
  Rsk: number;
  Rku: number;
  Rc: number;
  RSm: number;
  RDq: number;
}

export interface TraceResponse {
  profile: Profile;
  params: RoughnessParameters;
  grade: string;
}

const BASE = "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  finishes: (): Promise<FinishesResponse> => get("/finishes"),

  parameters: (): Promise<ParametersResponse> => get("/parameters"),

  generateTrace: (
    finishId: string,
    targetRa: number,
    seed: number,
  ): Promise<TraceResponse> =>
    post("/trace/generate", { finishId, targetRa, seed }),

  batchTraces: (
    traces: { finishId: string; targetRa: number; seed: number }[],
  ): Promise<{ traces: TraceResponse[] }> =>
    post("/trace/batch", { traces }),
};
