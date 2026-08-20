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

export type GetFlagOptions<T> = {
  flagName: string;
  fallbackValue: T;
  context?: EvaluationContext;
};

export type EvaluateOptions = {
  context?: EvaluationContext;
};

export type SetEvaluationContextOptions = {
  context: EvaluationContext;
};

export type FlaggableEvents = {
  change: { response: EvaluationResponse };
  contextChange: { context: EvaluationContext };
  error: { error: Error };
};

export type FlaggableEventType = keyof FlaggableEvents;

export type FlaggableEventListener<E extends FlaggableEventType = FlaggableEventType> = (
  payload: FlaggableEvents[E],
) => void;

export type OnEventOptions<E extends FlaggableEventType = FlaggableEventType> = {
  event: E;
  listener: FlaggableEventListener<E>;
};

export type EvaluationChangePayload = FlaggableEvents["change"];
export type EvaluationChange = (payload: EvaluationChangePayload) => void;

export type ContextChangePayload = FlaggableEvents["contextChange"];
export type ContextChange = (payload: ContextChangePayload) => void;

export type SubscribeOptions = {
  listener: EvaluationChange;
};

export type OnContextChangeOptions = {
  listener: ContextChange;
};

export class Flaggable {
  readonly publicKey: string;
  readonly baseUrl: string;
  private readonly pollInterval: number;
  private context: EvaluationContext;
  private cached: EvaluationResponse | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly listeners = new Map<
    FlaggableEventType,
    Set<FlaggableEventListener<FlaggableEventType>>
  >();
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

  async evaluate(options?: EvaluateOptions): Promise<EvaluationResponse> {
    const context = options?.context;
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
        if (changed) {
          this.emit("change", { response: body });
        }
        return body;
      })
      .catch((error: unknown) => {
        const sdkError =
          error instanceof SdkError
            ? error
            : new SdkNetworkError(
                error instanceof Error ? error.message : "Evaluation request failed.",
                { cause: error },
              );
        this.emit("error", { error: sdkError });
        throw sdkError;
      })
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  async get<T>(options: GetFlagOptions<T>): Promise<T> {
    const response = await this.evaluate({ context: options.context });
    const evaluation = response.evaluations.find((item) => item.name === options.flagName);
    return evaluation?.value === null || evaluation?.value === undefined
      ? options.fallbackValue
      : (evaluation.value as T);
  }

  async refresh(): Promise<EvaluationResponse> {
    return this.evaluate();
  }

  setEvaluationContext(options: SetEvaluationContextOptions): void {
    this.context = { ...getAnonymousContext(), ...options.context };
    setAnonymousContext({ context: this.context });
    this.emit("contextChange", { context: this.currentContext });
  }

  on<E extends FlaggableEventType>(options: OnEventOptions<E>): () => void {
    const { event, listener } = options;
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as FlaggableEventListener<FlaggableEventType>);

    if (event === "change") {
      this.startPolling();
    }

    return () => {
      set.delete(listener as FlaggableEventListener<FlaggableEventType>);
      if (event === "change") {
        const changeSet = this.listeners.get("change");
        if (!changeSet || !changeSet.size) {
          this.stopPolling();
        }
      }
    };
  }

  subscribe(options: SubscribeOptions): () => void {
    return this.on({ event: "change", listener: options.listener });
  }

  onContextChange(options: OnContextChangeOptions): () => void {
    return this.on({ event: "contextChange", listener: options.listener });
  }

  private emit<E extends FlaggableEventType>(event: E, payload: FlaggableEvents[E]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // Prevent uncaught listener exception from halting emit chain
      }
    });
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
    this.listeners.clear();
  }
}

const ANONYMOUS_COOKIE = "flaggable_anonymous_id";

export function getAnonymousContext(options?: { cookieName?: string }): EvaluationContext {
  const cookieName = options?.cookieName ?? ANONYMOUS_COOKIE;
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

export function setAnonymousContext(options: {
  context: EvaluationContext;
  cookieName?: string;
}): void {
  const { context, cookieName = ANONYMOUS_COOKIE } = options;
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
