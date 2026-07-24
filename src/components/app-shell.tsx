"use client";

import { useState } from "react";
import { Menu, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <Smartphone className="h-5 w-5" />
          WebiPhone
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>
        <div className="flex items-center justify-between border-t p-3">
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">WebiPhone</span>
        </header>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="flex h-14 items-center border-b px-4 text-left font-semibold">
              WebiPhone
            </SheetTitle>
            <div className="py-3">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
            <div className="flex items-center justify-between border-t p-3">
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
              <SignOutButton />
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
