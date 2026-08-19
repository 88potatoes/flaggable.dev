import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { updateValueSchemaRequest } from "@/lib/api-schemas";
import { ValueSchemaService, serializeSchema } from "@/slices/value-schemas/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schemaId: string }> },
) {
  try {
    const { schemaId } = await params;
    const schema = await new ValueSchemaService().get({
      schemaId,
      ownerId: await requireUserId(),
    });
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
    const schema = await new ValueSchemaService().update({
      schemaId,
      ownerId: await requireUserId(),
      values: body,
    });
    return Response.json(serializeSchema(schema));
  } catch (error) {
    return handleApiError(error);
  }
}
