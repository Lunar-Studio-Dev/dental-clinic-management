import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { prisma } from "~/lib/prisma";
import { staffActionFromEvent } from "~/lib/staff-sync";

// Clerk → DB Staff mirror. Public route (no auth) but signature-verified with
// CLERK_WEBHOOK_SIGNING_SECRET. Configure in Clerk Dashboard → Webhooks for
// user.created / user.updated / user.deleted.
export async function POST(req: NextRequest) {
  let evt: { type: string; data: { id?: string } & Record<string, unknown> };
  try {
    evt = (await verifyWebhook(req)) as unknown as typeof evt;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const action = staffActionFromEvent(evt.type, evt.data);

  if (action.kind === "upsert") {
    await prisma.staff.upsert({
      where: { id: action.id },
      create: {
        id: action.id,
        email: action.email,
        name: action.name,
        role: action.role,
      },
      update: { email: action.email, name: action.name, role: action.role },
    });
  } else if (action.kind === "delete") {
    await prisma.staff.deleteMany({ where: { id: action.id } });
  }

  return new Response("ok", { status: 200 });
}
