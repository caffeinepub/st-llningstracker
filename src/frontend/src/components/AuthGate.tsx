import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Truck } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSaveProfile } from "../hooks/useQueries";

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.13_0.015_240)] to-[oklch(0.18_0.012_240)] flex items-center justify-center">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Ställningstracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Hantering av ställningstrailers
            </p>
          </div>
        </div>
        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" /> Loggar in...
            </>
          ) : (
            "Logga in"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Säker inloggning via Internet Identity
        </p>
      </div>
    </div>
  );
}

function ProfileSetupScreen() {
  const [name, setName] = useState("");
  const { mutate, isPending } = useSaveProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) mutate({ name: name.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Välkommen!</h2>
          <p className="text-muted-foreground mt-1">
            Ange ditt namn för att fortsätta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Ditt namn</Label>
            <Input
              data-ocid="profile.input"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Erik Svensson"
              className="mt-1 h-12"
              autoFocus
            />
          </div>
          <Button
            data-ocid="profile.submit_button"
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Spara och fortsätt
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && isFetched && profile === null) {
    return <ProfileSetupScreen />;
  }

  return <>{children}</>;
}
