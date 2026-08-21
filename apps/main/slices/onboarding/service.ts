import type { NewUserOnboardingRecord } from "@/lib/db/schema";
import { DrizzleUserOnboardingRepository, type UserOnboardingRepository } from "./repo";

export type OnboardingStep = "project" | "flag" | "sdk";

export class OnboardingService {
  constructor(
    private readonly repository: UserOnboardingRepository = new DrizzleUserOnboardingRepository(),
  ) {}

  getOrCreate = async ({ userId }: { userId: string }) => {
    const existing = await this.repository.findByUserId({ userId });
    if (existing) return existing;

    const timestamp = new Date();
    const record: NewUserOnboardingRecord = {
      userId,
      version: 1,
      status: "not_started",
      currentStep: "project",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.create({ record });
  };

  acknowledgeSdkSetup = async ({ userId }: { userId: string }) => {
    const onboarding = await this.getOrCreate({ userId });
    const timestamp = new Date();

    return this.repository.update({
      userId,
      values: {
        status: "completed",
        currentStep: "sdk",
        sdkSetupAcknowledgedAt: timestamp,
        completedAt: timestamp,
        startedAt: onboarding.startedAt ?? timestamp,
        updatedAt: timestamp,
      },
    });
  };

  syncProgress = async ({
    userId,
    hasProject,
    hasFlag,
  }: {
    userId: string;
    hasProject: boolean;
    hasFlag: boolean;
  }) => {
    const onboarding = await this.getOrCreate({ userId });
    if (onboarding.status === "completed") return onboarding;

    const timestamp = new Date();
    const currentStep: OnboardingStep = hasFlag ? "sdk" : hasProject ? "flag" : "project";
    return this.repository.update({
      userId,
      values: {
        status: hasProject ? "in_progress" : "not_started",
        currentStep,
        startedAt: hasProject ? (onboarding.startedAt ?? timestamp) : onboarding.startedAt,
        updatedAt: timestamp,
      },
    });
  };
}
