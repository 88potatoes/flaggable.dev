import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createValueSchemaRequest } from "@/lib/api-schemas";
import { ValueSchemaService, serializeSchema } from "@/slices/value-schemas/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const schemas = await new ValueSchemaService().list({
      projectId,
      ownerId: await requireUserId(),
    });
    return Response.json(schemas.map(serializeSchema));
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
    const body = await parseJsonBody(request, createValueSchemaRequest);
    const schema = await new ValueSchemaService().create({
      projectId,
      ownerId: await requireUserId(),
      name: body.name,
      schemaJson: body.schemaJson,
    });
    return Response.json(serializeSchema(schema), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
