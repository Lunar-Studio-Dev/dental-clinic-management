"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "~/components/ui/sidebar";
import type { Role } from "~/utils/constant.schema";
import { ClinicSwitcherContainer } from "./clinic-switcher-container";
import { CommandSearch } from "./command-search";
import { ModeToggle } from "./mode-toggle";
import { RoleBadge } from "./role-badge";

export function TopBar({ role }: { role: Role | null }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex flex-col justify-between gap-2 border-b px-3 py-2 backdrop-blur sm:h-14 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-0 w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="hidden md:inline-flex" />
        <span className="font-semibold sm:hidden">ClinicOS</span>
        <div className="ml-auto flex items-center gap-2 sm:hidden">
          <RoleBadge role={role} />
          <ModeToggle />
          <UserButton />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 sm:max-w-md">
          <CommandSearch />
        </div>
        <ClinicSwitcherContainer />
        <div className="hidden items-center gap-3 sm:flex">
          <RoleBadge role={role} />
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
