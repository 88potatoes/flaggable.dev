import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { z } from "zod";
import { OnboardingService } from "@/slices/onboarding/service";

const acknowledgeRequest = z.object({
  sdkSetupAcknowledged: z.literal(true),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    return Response.json(await new OnboardingService().getOrCreate({ userId }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    await parseJsonBody(request, acknowledgeRequest);
    return Response.json(await new OnboardingService().acknowledgeSdkSetup({ userId }));
  } catch (error) {
    return handleApiError(error);
  }
}
