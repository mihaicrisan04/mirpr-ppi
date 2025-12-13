"use client";

import { useQuery } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/app-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);

  // Redirect to dashboard if not logged in
  useEffect(() => {
    // user is undefined while loading, null if not logged in
    if (user === null) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Show loading while checking auth
  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not logged in, show nothing (will redirect)
  if (user === null) {
    return null;
  }

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar
        userId={user._id}
        userName={user.name}
        userEmail={user.email}
      />
      <SidebarInset className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
