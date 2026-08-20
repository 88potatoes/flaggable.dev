import { FLAGGABLE_SDK_DOCS_MARKDOWN } from "@/lib/agent-docs";

export function GET() {
  return new Response(FLAGGABLE_SDK_DOCS_MARKDOWN, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
