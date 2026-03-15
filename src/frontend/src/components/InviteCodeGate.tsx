import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useRegisterWithInviteCode } from "../hooks/useQueries";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function InviteCodeGate() {
  const [code, setCode] = useState("");
  const { mutate, isPending, isError, error } = useRegisterWithInviteCode();
  const currentYear = new Date().getFullYear();

  const errorMessage =
    isError && error
      ? error instanceof Error
        ? error.message
        : "Invalid or already used invite code. Please try again."
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    mutate(trimmed);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Bauhaus geometric background */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-0 left-0 w-48 h-48 bg-accent opacity-20" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary opacity-10" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-primary opacity-15" />
      </div>

      {/* Header branding */}
      <header className="border-b-2 border-foreground bg-background relative z-10">
        <div className="container flex h-16 items-center gap-3">
          <div className="w-8 h-8 bg-primary border-2 border-foreground" />
          <h1 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
            PHOTOSHARE
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="border-2 border-foreground bg-card p-8">
            <div className="mb-6">
              <div className="w-8 h-1 bg-accent mb-4" />
              <h2 className="text-xl font-display font-black uppercase tracking-wide text-foreground">
                ENTER INVITE CODE
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This app is invite-only. Enter your invite code to create an
              account and join the community.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  data-ocid="invite_gate.input"
                  type="text"
                  placeholder="PASTE INVITE CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isPending}
                  className="border-2 border-foreground font-mono uppercase tracking-widest text-sm h-12 bg-background placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {errorMessage && (
                <div
                  data-ocid="invite_gate.error_state"
                  className="border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                data-ocid="invite_gate.submit_button"
                type="submit"
                disabled={isPending || !code.trim()}
                className="w-full font-display font-black uppercase tracking-wider text-sm h-12 border-2 border-foreground"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    VERIFYING...
                  </>
                ) : (
                  "JOIN PHOTOSHARE"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Need an invite? Ask an existing member to generate one for you.
          </p>
        </motion.div>
      </main>

      <footer className="border-t-2 border-foreground py-4 text-center text-xs text-muted-foreground relative z-10">
        © {currentYear} PhotoShare
      </footer>
    </div>
  );
}
