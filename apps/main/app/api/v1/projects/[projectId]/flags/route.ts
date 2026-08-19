import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createFlagRequest } from "@/lib/api-schemas";
import { FlagService, serializeFlag } from "@/slices/flags/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? "25");
    const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 25;
    const page = await new FlagService().list({
      projectId,
      ownerId: await requireUserId(),
      search: url.searchParams.get("search")?.trim() ?? "",
      limit,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    return Response.json({ ...page, items: page.items.map(serializeFlag) });
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
    const body = await parseJsonBody(request, createFlagRequest);
    const flag = await new FlagService().create({
      projectId,
      ownerId: await requireUserId(),
      values: body,
    });
    return Response.json(serializeFlag(flag), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
