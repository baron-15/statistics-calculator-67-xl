/** TI-30XS MultiView error messages (guidebook p.37–38). Thrown as CalcError; the apps layer shows the error screen. */
export type ErrorKind =
  | "ARGUMENT"
  | "DIVIDE BY 0"
  | "DOMAIN"
  | "EQUATION LENGTH ERROR"
  | "FRQ DOMAIN"
  | "OVERFLOW"
  | "STAT"
  | "DIM MISMATCH"
  | "FORMULA"
  | "SYNTAX"
  | "INVALID FUNCTION"
  | "MEMORY LIMIT";

export class CalcError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    detail?: string,
  ) {
    super(detail ? `${kind}: ${detail}` : kind);
    this.name = "CalcError";
  }
}

export const isCalcError = (e: unknown): e is CalcError => e instanceof CalcError;
