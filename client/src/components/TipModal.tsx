import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: number;
    artistName: string;
    trackTitle: string;
    userId?: number;
  };
}

const PRESET_AMOUNTS = [1, 5, 10, 25];

const colors = {
  primary: "#FF4500",
  primaryLight: "#FF6B35",
  gold: "#FFD700",
  gray800: "#1A1A1A",
  gray700: "#2A2A2A",
  white: "#FFFFFF",
};

export default function TipModal({ isOpen, onClose, track }: TipModalProps) {
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");

  const sendTip = trpc.tips.send.useMutation({
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success(`Tipped ${amount} FT to ${track.artistName}!`);
        onClose();
      } else if (data?.error) {
        if (data.error === "insufficient_balance") {
          toast.error("Not enough tokens! Visit the Token Shop.");
        } else {
          toast.error(data.error);
        }
      }
    },
    onError: () => toast.error("Failed to send tip"),
  });

  function handleSend() {
    if (!track.userId) {
      toast.error("Cannot tip this artist yet");
      return;
    }
    sendTip.mutate({
      toUserId: track.userId,
      amount,
      submissionId: track.id,
      message: message || undefined,
    });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.85)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-t-2xl overflow-hidden"
          style={{ background: colors.gray800 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold text-lg">Send Tip</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Artist info */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">Tipping</p>
              <p className="text-white font-bold">{track.artistName}</p>
              <p className="text-gray-500 text-xs">{track.trackTitle}</p>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="py-3 rounded-xl font-bold text-sm transition"
                  style={{
                    background: amount === preset
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
                      : colors.gray700,
                    color: colors.white,
                    border: amount === preset
                      ? "none"
                      : "1px solid #333",
                  }}
                >
                  {preset} FT
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Add a message (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{
                background: colors.gray700,
                border: "1px solid #444",
              }}
            />
            <p className="text-right text-gray-500 text-xs">
              {message.length}/200
            </p>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={sendTip.isPending || !track.userId}
              className="w-full py-3 font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendTip.isPending ? "SENDING..." : `TIP ${amount} FT`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
