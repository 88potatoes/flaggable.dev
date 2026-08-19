import { handleApiError, parseJsonBody } from "@/lib/api";
import { evaluateRequest } from "@/lib/api-schemas";
import { EvaluationService } from "@/slices/evaluation/service";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, evaluateRequest);
    const response = await new EvaluationService().evaluate(body);
    return Response.json(response, { headers: corsHeaders });
  } catch (error) {
    const response = handleApiError(error);
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
}
