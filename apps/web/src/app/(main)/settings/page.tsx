"use client";

import Link from "next/link";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <SettingsIcon className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Settings and preferences will be available here in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This page is a placeholder. In the future, you'll be able to:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground text-sm">
            <li>Update your profile information</li>
            <li>Manage notification preferences</li>
            <li>Configure AI assistant behavior</li>
            <li>View usage statistics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
