"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquarePlusIcon,
  MessageSquareIcon,
  Trash2Icon,
  SettingsIcon,
  Loader2Icon,
  ChevronUpIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Thread {
  _id: string;
  _creationTime: number;
  title?: string;
  summary?: string;
  userId?: string;
}

function groupThreadsByDate(threads: Thread[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { label: string; threads: Thread[] }[] = [
    { label: "Today", threads: [] },
    { label: "Yesterday", threads: [] },
    { label: "Previous 7 Days", threads: [] },
    { label: "Previous 30 Days", threads: [] },
    { label: "Older", threads: [] },
  ];

  for (const thread of threads) {
    const threadDate = new Date(thread._creationTime);

    if (threadDate >= today) {
      groups[0].threads.push(thread);
    } else if (threadDate >= yesterday) {
      groups[1].threads.push(thread);
    } else if (threadDate >= lastWeek) {
      groups[2].threads.push(thread);
    } else if (threadDate >= lastMonth) {
      groups[3].threads.push(thread);
    } else {
      groups[4].threads.push(thread);
    }
  }

  return groups.filter((group) => group.threads.length > 0);
}

function ThreadListSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

interface ThreadListProps {
  userId: string;
}

function ThreadList({ userId }: ThreadListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const deleteThread = useMutation(api.agent.deleteThread);

  const threadsResult = useQuery(api.agent.listUserThreads, {
    userId,
    paginationOpts: { cursor: null, numItems: 50 },
  });

  if (threadsResult === undefined) {
    return <ThreadListSkeleton />;
  }

  const threads = threadsResult.page as Thread[];

  if (threads.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground text-sm">
        <MessageSquareIcon className="mx-auto mb-2 size-8 opacity-50" />
        <p>No conversations yet</p>
        <p className="text-xs">Start a new chat to begin</p>
      </div>
    );
  }

  const groupedThreads = groupThreadsByDate(threads);

  const handleDelete = async (
    e: React.MouseEvent,
    threadId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteThread({ threadId });
      // If we're on the deleted thread, redirect to /chat
      if (pathname === `/chat/${threadId}`) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  return (
    <>
      {groupedThreads.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.threads.map((thread) => {
                const isActive = pathname === `/chat/${thread._id}`;
                const title = thread.title ?? "New Chat";

                return (
                  <SidebarMenuItem key={thread._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="group-has-data-[state=open]/menu-item:bg-sidebar-accent"
                    >
                      <Link href={`/chat/${thread._id}`}>
                        <MessageSquareIcon className="size-4" />
                        <span className="truncate">{title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <Trash2Icon className="size-4" />
                          <span className="sr-only">Delete</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(e, thread._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon className="mr-2 size-4" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

interface AppSidebarProps {
  userId: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export function AppSidebar({ userId, userName, userEmail }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">mirpr-ppi</span>
                  <span className="text-muted-foreground text-xs">
                    AI Assistant
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <Link href="/chat">
                <MessageSquarePlusIcon className="size-4" />
                <span>New Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {userId ? (
          <ThreadList userId={userId} />
        ) : (
          <div className="flex items-center justify-center p-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {userName ? userName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="flex flex-col items-start gap-0.5 leading-none">
                    <span className="font-medium">
                      {userName ?? "Guest"}
                    </span>
                    {userEmail && (
                      <span className="text-muted-foreground text-xs">
                        {userEmail}
                      </span>
                    )}
                  </div>
                  <ChevronUpIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <SettingsIcon className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
