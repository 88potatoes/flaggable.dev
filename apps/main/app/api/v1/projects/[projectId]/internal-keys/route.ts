import { handleApiError, requireUserId } from "@/lib/api";
import { InternalKeyService } from "@/slices/internal-keys/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(
      await new InternalKeyService().list({ projectId, ownerId: await requireUserId() }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    let name = "Internal API Key";
    try {
      const body = (await request.json()) as { name?: string };
      if (body?.name && typeof body.name === "string") name = body.name;
    } catch {
      // Body is optional
    }
    return Response.json(
      await new InternalKeyService().create({ projectId, ownerId: await requireUserId(), name }),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
