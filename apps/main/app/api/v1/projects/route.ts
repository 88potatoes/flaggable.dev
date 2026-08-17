import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createProjectRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createProjectService } from "@/lib/services";

export async function GET() {
  try {
    const userId = await requireUserId();
    return Response.json(await createProjectService(getDb()).list(userId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(request, createProjectRequest);
    return Response.json(await createProjectService(getDb()).create(userId, body.name), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
