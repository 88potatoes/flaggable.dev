import { handleApiError, parseJsonBody, requireUserId } from "@/lib/api";
import {
  createValueSchemaRequest,
  updateValueSchemaRequest,
} from "@/lib/api-schemas";
import { getDb } from "@/lib/db";
import { createValueSchemaService, serializeSchema } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const schemas = await createValueSchemaService(getDb()).list(
      projectId,
      await requireUserId(),
    );
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
    const schema = await createValueSchemaService(getDb()).create(
      projectId,
      await requireUserId(),
      body.name,
      body.schemaJson,
    );
    return Response.json(serializeSchema(schema), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
