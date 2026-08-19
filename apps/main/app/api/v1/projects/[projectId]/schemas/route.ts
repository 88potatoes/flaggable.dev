import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import { createValueSchemaRequest, updateValueSchemaRequest } from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { ValueSchemaService, serializeSchema } from "@/slices/value-schemas/service";
import { DrizzleValueSchemaRepository } from "@/slices/value-schemas/repo";
import { DrizzleProjectRepository } from "@/slices/projects/repo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const schemas = await new ValueSchemaService(
      new DrizzleValueSchemaRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
    ).list({ projectId, ownerId: await requireUserId() });
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
    const schema = await new ValueSchemaService(
      new DrizzleValueSchemaRepository(getDb()),
      new DrizzleProjectRepository(getDb()),
    ).create({
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
