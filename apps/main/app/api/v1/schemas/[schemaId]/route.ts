import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateValueSchemaRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createValueSchemaService, serializeSchema } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schemaId: string }> },
) {
  try {
    const { schemaId } = await params;
    const schema = await createValueSchemaService(getDb()).get(schemaId, await requireUserId());
    return Response.json(serializeSchema(schema));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schemaId: string }> },
) {
  try {
    const { schemaId } = await params;
    const body = await parseJsonBody(request, updateValueSchemaRequest);
    const schema = await createValueSchemaService(getDb()).update(
      schemaId,
      await requireUserId(),
      body,
    );
    return Response.json(serializeSchema(schema));
  } catch (error) {
    return handleApiError(error);
  }
}
