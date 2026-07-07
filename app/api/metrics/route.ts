import { resolveClinicScope } from "~/lib/clinic-scope";
import { getDashboardMetrics } from "~/lib/metrics-queries";

// GET /api/metrics?clinicId → MetricsDTO (scoped/authorized for the caller)
export async function GET(req: Request) {
  const scope = await resolveClinicScope(
    new URL(req.url).searchParams.get("clinicId"),
  );
  if (!scope.ok) return new Response(scope.message, { status: scope.status });

  const metrics = await getDashboardMetrics(scope.clinicId);
  return Response.json(metrics);
}
