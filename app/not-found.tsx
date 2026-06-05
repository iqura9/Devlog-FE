import Link from "next/link";
import { FileX2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Links } from "@/routes/paths";

export default function NotFound() {
  return (
    <div className="w-full">
      <Header />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileX2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            $ devlog --find entry
          </p>
          <h2 className="mt-1 text-7xl font-extrabold tracking-tight text-foreground">
            404
          </h2>
          <p className="mt-1 text-lg font-semibold text-foreground">
            Log entry not found
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This entry doesn&apos;t exist in the log.
          </p>
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={Links.tasks.index}>← Back to DevLog</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
