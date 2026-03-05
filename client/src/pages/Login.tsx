import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || email.split("@")[0] } },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          // Auto-confirmed — set cookie and redirect
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          window.location.href = "/feed";
        } else {
          // Email confirmation required
          setConfirmationSent(true);
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (data.session) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          window.location.href = "/feed";
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--ff-bg-primary)" }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <h1 className="font-primary text-2xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}>
            CHECK YOUR EMAIL
          </h1>
          <p className="font-secondary text-sm" style={{ color: "var(--ff-text-secondary)" }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <Button variant="outline" className="w-full" onClick={() => {
            setConfirmationSent(false);
            setIsSignUp(false);
          }}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--ff-bg-primary)" }}>
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Frequency Factory" className="h-16 mx-auto" />
          <h1 className="font-primary text-3xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}>
            FREQUENCY FACTORY
          </h1>
          <p className="font-secondary text-sm" style={{ color: "var(--ff-text-secondary)" }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="font-secondary text-sm"
                style={{ color: "var(--ff-text-secondary)" }}>
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-[var(--ff-bg-tertiary)] border-[var(--ff-gray-600)] text-white placeholder:text-[var(--ff-gray-500)]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-secondary text-sm"
              style={{ color: "var(--ff-text-secondary)" }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-[var(--ff-bg-tertiary)] border-[var(--ff-gray-600)] text-white placeholder:text-[var(--ff-gray-500)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-secondary text-sm"
              style={{ color: "var(--ff-text-secondary)" }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isSignUp ? "Min 6 characters" : "Your password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-[var(--ff-bg-tertiary)] border-[var(--ff-gray-600)] text-white placeholder:text-[var(--ff-gray-500)]"
            />
          </div>

          {error && (
            <p className="text-sm font-secondary" style={{ color: "var(--ff-token-red)" }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-primary text-lg tracking-wider text-black"
            style={{ background: loading ? "var(--ff-gray-600)" : "var(--ff-gradient-primary)" }}
          >
            {loading ? "..." : isSignUp ? "SIGN UP" : "SIGN IN"}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center font-secondary text-sm"
          style={{ color: "var(--ff-text-secondary)" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="font-semibold underline"
            style={{ color: "var(--ff-primary)" }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
