import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createProjectRequest } from "@/lib/api-schemas";
import { ProjectService } from "@/slices/projects/service";

export async function GET() {
  try {
    const userId = await requireUserId();
    return Response.json(await new ProjectService().list({ ownerId: userId }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(request, createProjectRequest);
    return Response.json(
      await new ProjectService().create({
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
