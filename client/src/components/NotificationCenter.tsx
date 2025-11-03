import { Button } from "@/components/ui/button";
import { Bell, X, Trophy, Music, Star, TrendingUp } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  type: "prediction" | "reward" | "track" | "achievement";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "prediction",
      title: "Prediction Scored!",
      message: "Your prediction for 'Electric Dreams' scored 8.5/10",
      timestamp: "2h ago",
      read: false,
    },
    {
      id: "2",
      type: "reward",
      title: "Tokens Earned",
      message: "You earned 15 FT for accurate predictions",
      timestamp: "5h ago",
      read: false,
    },
    {
      id: "3",
      type: "track",
      title: "New Track Available",
      message: "Luna Eclipse just dropped 'Cosmic Waves'",
      timestamp: "1d ago",
      read: true,
    },
    {
      id: "4",
      type: "achievement",
      title: "Achievement Unlocked!",
      message: "Certified 10 tracks - Blue Tier unlocked",
      timestamp: "2d ago",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function getIcon(type: Notification["type"]) {
    switch (type) {
      case "prediction":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "reward":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "track":
        return <Music className="w-5 h-5 text-purple-500" />;
      case "achievement":
        return <Star className="w-5 h-5 text-orange-500" />;
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount}
          </div>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-400"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                        !notification.read ? "bg-blue-900/10" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-bold ${
                                !notification.read ? "text-white" : "text-gray-300"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
