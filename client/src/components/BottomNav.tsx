import React from 'react';
import { useLocation } from 'wouter';
import { Home, Search, Upload, Star, User, Activity } from 'lucide-react';

const colors = {
  primary: '#FF4500',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  textSecondary: '#A0A0A0',
};

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  id: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/feed', id: 'home' },
  { icon: Search, label: 'Discover', path: '/discover', id: 'discover' },
  { icon: Upload, label: 'Submit', path: '/submit', id: 'submit' },
  { icon: Star, label: 'Rewards', path: '/rewards', id: 'rewards' },
  { icon: User, label: 'Profile', path: '/profile', id: 'profile' },
];

interface BottomNavProps {
  activeTab?: string;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [location, setLocation] = useLocation();

  // Determine active tab from current location if not provided
  const currentTab = activeTab || navItems.find(item => item.path === location)?.id || 'home';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-20 shadow-2xl z-50"
      style={{ 
        background: colors.gray800, 
        borderTop: `1px solid ${colors.gray700}`,
      }}
    >
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          
          // Special styling for Submit button (center)
          const isSubmit = item.id === 'submit';
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 gap-1 py-2 transition-all ${
                isSubmit ? 'relative -mt-6' : ''
              }`}
            >
              {isSubmit ? (
                // Elevated submit button
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ 
                    background: isActive 
                      ? 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)'
                      : colors.gray700,
                    border: `3px solid ${isActive ? '#FF4500' : colors.gray700}`,
                    boxShadow: isActive 
                      ? '0 0 20px rgba(255, 69, 0, 0.5)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }} 
                  />
                </div>
              ) : (
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: isActive ? colors.primary : colors.textSecondary }} 
                />
              )}
              <span 
                className="text-xs"
                style={{ color: isActive ? colors.primary : colors.textSecondary }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
