import { auth } from "@clerk/nextjs/server";
import { getDashboardMetrics } from "~/lib/metrics-queries";

// GET /api/metrics?clinicId → MetricsDTO (full KPI bundle for both dashboards)
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const clinicId = new URL(req.url).searchParams.get("clinicId");
  if (!clinicId) return new Response("clinicId is required", { status: 400 });

  const metrics = await getDashboardMetrics(clinicId);
  return Response.json(metrics);
}
