import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CheckoutSuccess() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--ff-bg-primary)" }}
    >
      <div className="text-center space-y-6 max-w-sm">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: "var(--ff-gradient-primary)",
            boxShadow: "0 0 40px rgba(255, 109, 0, 0.5)",
          }}
        >
          <Check className="w-10 h-10 text-black" />
        </div>

        <div>
          <h1
            className="font-primary text-2xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            PAYMENT SUCCESSFUL
          </h1>
          <p
            className="font-secondary text-sm mt-2"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            Your purchase has been processed. Tokens and perks will appear in your account shortly.
          </p>
        </div>

        <Link href="/feed">
          <Button
            className="w-full font-primary tracking-wider text-black"
            style={{ background: "var(--ff-gradient-primary)" }}
          >
            BACK TO FACTORY
          </Button>
        </Link>
      </div>
    </div>
  );
}
