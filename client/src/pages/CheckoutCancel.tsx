import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CheckoutCancel() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--ff-bg-primary)" }}
    >
      <div className="text-center space-y-6 max-w-sm">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: "var(--ff-bg-tertiary)",
            border: "2px solid var(--ff-gray-600)",
          }}
        >
          <X className="w-10 h-10" style={{ color: "var(--ff-text-secondary)" }} />
        </div>

        <div>
          <h1
            className="font-primary text-2xl tracking-wider text-white"
          >
            CHECKOUT CANCELLED
          </h1>
          <p
            className="font-secondary text-sm mt-2"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            No charges were made. You can try again anytime.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/shop" className="flex-1">
            <Button
              variant="outline"
              className="w-full font-primary tracking-wider"
            >
              TRY AGAIN
            </Button>
          </Link>
          <Link href="/feed" className="flex-1">
            <Button
              className="w-full font-primary tracking-wider text-black"
              style={{ background: "var(--ff-gradient-primary)" }}
            >
              BACK TO FACTORY
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
