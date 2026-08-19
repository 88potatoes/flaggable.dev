import { handleApiError, requireUserId } from "@/lib/api";
import { PublicKeyService } from "@/slices/public-keys/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(
      await new PublicKeyService().list({ projectId, ownerId: await requireUserId() }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    return Response.json(
      await new PublicKeyService().create({ projectId, ownerId: await requireUserId() }),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
