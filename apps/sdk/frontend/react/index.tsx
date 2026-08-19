"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Flaggable,
  type EvaluationContext,
  type EvaluationResponse,
  type FlaggableOptions,
} from "../core/index";

const FlaggableContext = createContext<Flaggable | null>(null);

export type FlagProviderProps = {
  children: ReactNode;
  client?: Flaggable;
} & (FlaggableOptions | { client: Flaggable });

export function FlagProvider(props: FlagProviderProps) {
  const { children } = props;
  const client = useMemo(
    () =>
      props.client instanceof Flaggable
        ? props.client
        : new Flaggable({
            publicKey: "publicKey" in props ? props.publicKey : "",
            baseUrl: "baseUrl" in props ? props.baseUrl : "",
            fetch: "fetch" in props ? props.fetch : undefined,
            context: "context" in props ? props.context : undefined,
            pollInterval: "pollInterval" in props ? props.pollInterval : undefined,
          }),
    // Configuration is expected to be stable for the provider lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.client,
      "publicKey" in props ? props.publicKey : "",
      "baseUrl" in props ? props.baseUrl : "",
    ],
  );
  useEffect(() => () => client.destroy(), [client]);
  return <FlaggableContext.Provider value={client}>{children}</FlaggableContext.Provider>;
}

export function useFlagClient(): Flaggable {
  const client = useContext(FlaggableContext);
  if (!client) throw new Error("useFlagClient must be used inside FlagProvider.");
  return client;
}

export function useFlag<T>(flagName: string, fallbackValue: T, context?: EvaluationContext): T {
  const client = useFlagClient();
  const [value, setValue] = useState<T>(fallbackValue);
  useEffect(() => {
    let active = true;
    void client
      .get(flagName, fallbackValue, context)
      .then((next) => {
        if (active) setValue(next);
      })
      .catch(() => undefined);
    const unsubscribe = client.subscribe((response) => {
      const evaluation = response.evaluations.find((item) => item.name === flagName);
      if (active && evaluation && evaluation.value !== null) setValue(evaluation.value as T);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client, flagName, fallbackValue, context]);
  return value;
}

export function useEvaluate(context?: EvaluationContext) {
  const client = useFlagClient();
  const [state, setState] = useState<{
    data: EvaluationResponse | null;
    error: Error | null;
    isLoading: boolean;
  }>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, isLoading: true }));
    void client
      .evaluate(context)
      .then((data) => {
        if (active) setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Evaluation failed."),
            isLoading: false,
          });
      });
    const unsubscribe = client.subscribe((data) => {
      if (active) setState({ data, error: null, isLoading: false });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client, context]);

  return { ...state, refresh: () => client.refresh() };
}

export { Flaggable } from "../core/index";
export type { EvaluationContext, EvaluationResponse, FlaggableOptions } from "../core/index";
