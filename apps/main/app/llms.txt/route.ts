import { FLAGGABLE_SDK_DOCS_MARKDOWN } from "@/lib/agent-docs";

export function GET() {
  const content = `# Flaggable
> Modern, lightweight, and reactive feature flag platform.

## Docs
- Flaggable SDK Integration Guide: /docs/sdk.md

## Full Documentation
${FLAGGABLE_SDK_DOCS_MARKDOWN}
`;

  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
