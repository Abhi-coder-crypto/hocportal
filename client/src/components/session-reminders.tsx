import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function SessionReminders() {
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  // Fetch assigned sessions for the client
  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ['/api/my-sessions'],
    refetchInterval: 60000, // Refetch every minute
    queryFn: async () => {
      try {
        const res = await fetch('/api/my-sessions');
        return res.json();
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (!Array.isArray(sessions)) return;

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find sessions within the next hour
    const sessionsWithinOneHour = sessions.filter((session: any) => {
      if (!session.scheduledAt) return false;
      const sessionTime = new Date(session.scheduledAt);
      return (
        sessionTime > now &&
        sessionTime <= oneHourFromNow &&
        session.status !== 'completed'
      );
    });

    setUpcomingSessions(sessionsWithinOneHour);
  }, [sessions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-notifications"
          title="Session Reminders"
          className="relative"
        >
          <Bell
            className={`h-5 w-5 ${
              upcomingSessions.length > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-chart-3'
            }`}
          />
          {upcomingSessions.length > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
              data-testid="badge-notification-count"
            >
              {upcomingSessions.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="dropdown-notifications">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Session Reminders
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Starting in the next hour</p>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No sessions starting soon
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {upcomingSessions.map((session: any) => {
              const sessionTime = new Date(session.scheduledAt);
              const minutesUntilStart = Math.round(
                (sessionTime.getTime() - new Date().getTime()) / 1000 / 60
              );

              return (
                <div
                  key={session._id}
                  className="flex flex-col gap-1 p-3 border-b last:border-b-0 hover:bg-muted/50"
                  data-testid={`session-reminder-${session._id}`}
                >
                  <div className="font-medium text-sm">{session.title}</div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>
                      Trainer: {session.trainerId?.name || 'Trainer'}
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      Starting in {minutesUntilStart} minute
                      {minutesUntilStart !== 1 ? 's' : ''}
                    </div>
                    <div>{format(sessionTime, 'hh:mm a')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
