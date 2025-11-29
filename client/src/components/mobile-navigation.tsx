import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HomeIcon, LiveIcon, LibraryIcon, DietIcon } from "@/components/nav-icons";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  testId: string;
}

export function MobileNavigation() {
  const [location, setLocation] = useLocation();

  const navItems: NavItem[] = [
    {
      icon: <HomeIcon className="h-16 w-16" />,
      label: "Home",
      path: "/client",
      testId: "nav-home",
    },
    {
      icon: <LiveIcon className="h-16 w-16" />,
      label: "Live",
      path: "/client/sessions",
      testId: "nav-live-sessions",
    },
    {
      icon: <LibraryIcon className="h-16 w-16" />,
      label: "Library",
      path: "/client/videos",
      testId: "nav-video-library",
    },
    {
      icon: <DietIcon className="h-16 w-16" />,
      label: "Diet",
      path: "/client/diet",
      testId: "nav-diet",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-around h-28 px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="icon"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-2 h-auto py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              data-testid={item.testId}
            >
              <div className="flex items-center justify-center">{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
