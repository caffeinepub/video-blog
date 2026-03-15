import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "./ui/button";

export default function LoginGate() {
  const { login, isLoggingIn } = useInternetIdentity();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Bauhaus geometric background */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary opacity-10" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent opacity-20" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-primary border-2 border-foreground" />
            <h1 className="text-3xl font-display font-black uppercase tracking-wider text-foreground">
              PHOTOSHARE
            </h1>
          </div>

          {/* Card */}
          <div className="border-2 border-foreground bg-card p-8">
            <div className="mb-2">
              <div className="w-8 h-1 bg-primary mb-4" />
              <h2 className="text-xl font-display font-black uppercase tracking-wide text-foreground">
                MEMBERS ONLY
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              PhotoShare is a private community. Log in to access your gallery
              and feed.
            </p>

            <Button
              data-ocid="login_gate.login_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full font-display font-black uppercase tracking-wider text-sm h-12 border-2 border-foreground"
            >
              {isLoggingIn ? "CONNECTING..." : "LOG IN"}
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Don't have an account? Ask a member for an invite.
          </p>
        </motion.div>
      </main>

      <footer className="border-t-2 border-foreground py-4 text-center text-xs text-muted-foreground relative z-10">
        © {currentYear} PhotoShare
      </footer>
    </div>
  );
}
