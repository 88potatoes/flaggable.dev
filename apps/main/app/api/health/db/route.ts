import { getDb } from "@/lib/db";
import { systemTable } from "@/lib/db/schema";

export async function GET() {
  try {
    await getDb().select({ key: systemTable.key }).from(systemTable).limit(1).all();

    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("D1 health check failed", error);

    return Response.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
