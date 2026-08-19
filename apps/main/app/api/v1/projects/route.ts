import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createProjectRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { ProjectService } from "@/slices/projects/service";
import { DrizzleProjectRepository } from "@/slices/projects/repo";

export async function GET() {
  try {
    const userId = await requireUserId();
    return Response.json(
      await new ProjectService(new DrizzleProjectRepository(getDb())).list({ ownerId: userId }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(request, createProjectRequest);
    return Response.json(
      await new ProjectService(new DrizzleProjectRepository(getDb())).create({
        ownerId: userId,
        name: body.name,
      }),
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
