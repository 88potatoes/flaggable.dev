export type EvaluationContext = Record<string, unknown>;

export type FlagEvaluation = {
  flagId: string;
  name: string;
  value: unknown;
  matchedConditionId: string | null;
};

export type EvaluationResponse = {
  projectId: string;
  evaluations: FlagEvaluation[];
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ErrorCause = { cause?: unknown };

export class SdkError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    options?: ErrorCause,
  ) {
    super(message);
    if (options?.cause !== undefined)
      Object.defineProperty(this, "cause", { value: options.cause });
    this.name = "SdkError";
  }
}

export class SdkConfigurationError extends SdkError {
  constructor(message: string) {
    super(message, "configuration_error");
    this.name = "SdkConfigurationError";
  }
}

export class SdkNetworkError extends SdkError {
  constructor(message: string, options?: ErrorCause) {
    super(message, "network_error", undefined, options);
    this.name = "SdkNetworkError";
  }
}

export class SdkApiError extends SdkError {
  constructor(
    message: string,
    status: number,
    readonly details?: unknown,
  ) {
    super(message, "api_error", status);
    this.name = "SdkApiError";
  }
}

export const DEFAULT_BASE_URL = "https://flaggable.dev";
export const DEFAULT_POLL_INTERVAL = 30_000;

export type FlaggableOptions = {
  publicKey: string;
  baseUrl?: string;
  pollInterval?: number;
};

export type ContextChange = (context: EvaluationContext) => void;
export type EvaluationChange = (response: EvaluationResponse) => void;

export class Flaggable {
  readonly publicKey: string;
  readonly baseUrl: string;
  private readonly pollInterval: number;
  private context: EvaluationContext;
  private cached: EvaluationResponse | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly contextListeners = new Set<ContextChange>();
  private readonly changeListeners = new Set<EvaluationChange>();
  private refreshPromise: Promise<EvaluationResponse> | null = null;

  constructor(options: FlaggableOptions) {
    if (!options.publicKey?.trim()) throw new SdkConfigurationError("publicKey is required.");
    this.publicKey = options.publicKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.context = getAnonymousContext();
    this.pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL;
  }

  get currentContext(): EvaluationContext {
    return { ...this.context };
  }

  getEvaluationContext(): EvaluationContext {
    return this.currentContext;
  }

  async evaluate(context?: EvaluationContext): Promise<EvaluationResponse> {
    const effectiveContext = context ? { ...this.context, ...context } : this.context;
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = fetch(`${this.baseUrl}/api/v1/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey: this.publicKey, context: effectiveContext }),
    })
      .then(async (response) => {
        const body = await readResponse(response);
        if (!response.ok) {
          throw new SdkApiError(
            typeof body === "object" && body && "error" in body && typeof body.error === "string"
              ? body.error
              : "Evaluation request failed.",
            response.status,
            body,
          );
        }
        if (!isEvaluationResponse(body))
          throw new SdkApiError("Invalid evaluation response.", 502, body);
        const changed = JSON.stringify(this.cached) !== JSON.stringify(body);
        this.cached = body;
        if (changed) this.changeListeners.forEach((listener) => listener(body));
        return body;
      })
      .catch((error: unknown) => {
        if (error instanceof SdkError) throw error;
        throw new SdkNetworkError(
          error instanceof Error ? error.message : "Evaluation request failed.",
          { cause: error },
        );
      })
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  async get<T>(flagName: string, fallbackValue: T, context?: EvaluationContext): Promise<T> {
    const response = await this.evaluate(context);
    const evaluation = response.evaluations.find((item) => item.name === flagName);
    return evaluation?.value === null || evaluation?.value === undefined
      ? fallbackValue
      : (evaluation.value as T);
  }

  async refresh(): Promise<EvaluationResponse> {
    return this.evaluate();
  }

  setEvaluationContext(context: EvaluationContext): void {
    this.context = { ...getAnonymousContext(), ...context };
    setAnonymousContext(this.context);
    this.contextListeners.forEach((listener) => listener(this.currentContext));
  }

  subscribe(listener: EvaluationChange): () => void {
    this.changeListeners.add(listener);
    this.startPolling();
    return () => {
      this.changeListeners.delete(listener);
      if (!this.changeListeners.size) this.stopPolling();
    };
  }

  onContextChange(listener: ContextChange): () => void {
    this.contextListeners.add(listener);
    return () => this.contextListeners.delete(listener);
  }

  startPolling(): void {
    if (this.timer || this.pollInterval <= 0) return;
    this.timer = setInterval(() => void this.refresh().catch(() => undefined), this.pollInterval);
  }

  stopPolling(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  destroy(): void {
    this.stopPolling();
    this.contextListeners.clear();
    this.changeListeners.clear();
  }
}

const ANONYMOUS_COOKIE = "flaggable_anonymous_id";

export function getAnonymousContext(cookieName = ANONYMOUS_COOKIE): EvaluationContext {
  if (typeof document === "undefined") return {};
  const encoded = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.split("=")[1];
  if (encoded) return { anonymousId: decodeURIComponent(encoded) };
  const id = makeAnonymousId();
  document.cookie = `${cookieName}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return { anonymousId: id };
}

export function setAnonymousContext(
  context: EvaluationContext,
  cookieName = ANONYMOUS_COOKIE,
): void {
  if (typeof document === "undefined") return;
  const value = context.anonymousId;
  if (typeof value === "string" && value) {
    document.cookie = `${cookieName}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

function makeAnonymousId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isEvaluationResponse(value: unknown): value is EvaluationResponse {
  return Boolean(
    value &&
    typeof value === "object" &&
    "projectId" in value &&
    Array.isArray((value as EvaluationResponse).evaluations),
  );
}

export const createFlaggable = (options: FlaggableOptions): Flaggable => new Flaggable(options);
