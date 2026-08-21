"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";
import { onboardingQueryKeys } from "./queryKeys";

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

export type OnboardingState = {
  userId: string;
  version: number;
  status: OnboardingStatus;
  currentStep: "project" | "flag" | "sdk" | null;
  sdkSetupAcknowledgedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useQueryOnboarding() {
  return useQuery({
    queryKey: onboardingQueryKeys.current,
    queryFn: () => api.get("onboarding").json<OnboardingState>(),
  });
}

export function useMutateAcknowledgeSdkSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.patch("onboarding", { json: { sdkSetupAcknowledged: true } }).json<OnboardingState>(),
    onSuccess: (onboarding) => {
      queryClient.setQueryData(onboardingQueryKeys.current, onboarding);
    },
  });
}
