import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { ShoppingBag } from "lucide-react";

const MERCH_ITEMS = [
  {
    id: "tshirt-black",
    title: "Factory Floor Tee",
    description: "Classic black tee with Frequency Factory logo",
    price: "$25",
    image: "/assets/merch-tee.png",
    color: "#FF4500",
  },
  {
    id: "hoodie-black",
    title: "Engineer's Hoodie",
    description: "Premium hoodie for late-night sessions",
    price: "$45",
    image: "/assets/merch-hoodie.png",
    color: "#1E90FF",
  },
  {
    id: "hat-snapback",
    title: "Factory Snapback",
    description: "Embroidered logo snapback cap",
    price: "$20",
    image: "/assets/merch-hat.png",
    color: "#FFD700",
  },
  {
    id: "sticker-pack",
    title: "Sticker Pack",
    description: "5-pack of Factory die-cut stickers",
    price: "$8",
    image: "/assets/merch-stickers.png",
    color: "#22c55e",
  },
];

export default function MerchStore() {
  useAuth({ redirectOnUnauthenticated: true });

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--ff-bg-primary)" }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "var(--ff-bg-primary)",
          borderBottom: "1px solid var(--ff-gray-800)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <h1
            className="font-primary text-lg tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            FACTORY MERCH
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="text-center">
          <h2
            className="font-primary text-xl tracking-wider"
            style={{ color: "var(--ff-primary)" }}
          >
            REP THE FACTORY
          </h2>
          <p
            className="font-secondary text-sm mt-2"
            style={{ color: "var(--ff-text-secondary)" }}
          >
            Official Frequency Factory merchandise
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MERCH_ITEMS.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--ff-bg-tertiary)",
                border: `1px solid ${item.color}30`,
              }}
            >
              {/* Placeholder image area */}
              <div
                className="h-40 flex items-center justify-center"
                style={{ background: `${item.color}10` }}
              >
                <ShoppingBag className="w-12 h-12" style={{ color: `${item.color}60` }} />
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-primary text-white">{item.title}</h3>
                  <p
                    className="font-secondary text-sm"
                    style={{ color: "var(--ff-text-secondary)" }}
                  >
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-primary text-lg" style={{ color: item.color }}>
                    {item.price}
                  </span>
                  <Button
                    size="sm"
                    className="font-primary tracking-wider text-black"
                    style={{ background: item.color }}
                    onClick={() => {
                      // Placeholder — will integrate Stripe or external store
                      window.open("https://frequency-factory.com/merch", "_blank");
                    }}
                  >
                    COMING SOON
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="text-center font-secondary text-xs"
          style={{ color: "var(--ff-text-secondary)" }}
        >
          Merch store launching soon. Follow us for updates!
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
