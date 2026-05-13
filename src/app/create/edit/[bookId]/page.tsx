"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { EditPageContent } from "./EditPageContent";

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <EditPageContent />
    </Suspense>
  );
}
