import { Heart } from "lucide-react";
import type { ReactNode } from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "photo-blog",
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary" />
            <h1 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
              PHOTOSHARE
            </h1>
          </div>
          <Navigation />
        </div>
      </header>

      <main className="flex-1 container py-6 md:py-8">{children}</main>

      <footer className="border-t-2 border-foreground bg-background">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            Built with <Heart className="w-4 h-4 text-primary fill-primary" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p className="mt-1 text-xs">
            © {currentYear} PhotoShare. Share moments with friends.
          </p>
        </div>
      </footer>
    </div>
  );
}
