/** Stable application error codes emitted by flag operations. */
export type FlagErrorCode =
  | "flag_not_found"
  | "flag_archived"
  | "project_not_found"
  | "project_archived"
  | "flag_name_conflict"
  | "value_schema_not_found"
  | "value_schema_project_mismatch"
  | "invalid_pagination_cursor";

/** A predictable, transport-independent failure from the flag application service. */
export class FlagError extends Error {
  constructor(
    readonly code: FlagErrorCode,
    message: string,
    readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "FlagError";
  }
}

/** Signals that persistence rejected a flag name because it is already in use. */
export class FlagNameConflictError extends Error {
  constructor(
    readonly flagName?: string,
    options?: { cause?: unknown },
  ) {
    super("A flag name is already in use.", options);
    this.name = "FlagNameConflictError";
  }
}

export function flagNameConflict(name: string, cause?: unknown): FlagError {
  return new FlagError(
    "flag_name_conflict",
    `A flag named "${name}" already exists in this project.`,
    { field: "name", value: name },
    cause === undefined ? undefined : { cause },
  );
}
