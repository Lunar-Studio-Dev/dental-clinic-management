import { format } from "date-fns";

export function visitTypeLabel(type: string): string {
  if (type === "NEW") return "New";
  if (type === "FOLLOW_UP") return "Follow-up";
  return type;
}

export function formatVisitTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function formatVisitDate(iso: string): string {
  return format(new Date(iso), "dd MMM yyyy");
}
