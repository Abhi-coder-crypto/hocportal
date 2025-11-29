import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function SessionReminders() {
  const [checkedSessions, setCheckedSessions] = useState<Set<string>>(new Set());

  const { data: sessions } = useQuery<any[]>({
    queryKey: ['/api/sessions'],
    refetchInterval: 60000, // Refetch every minute
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notification: { title: string; message: string; type: string; link?: string }) => {
      return apiRequest('POST', '/api/notifications', notification);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  useEffect(() => {
    if (!sessions) return;

    const checkReminders = () => {
      const now = new Date();
      const reminderTime = 60 * 60 * 1000; // 1 hour before

      sessions.forEach(session => {
        if (session.status === 'upcoming' && !checkedSessions.has(session._id)) {
          const sessionTime = new Date(session.scheduledAt);
          const timeDiff = sessionTime.getTime() - now.getTime();
          
          // Create in-app notification 1 hour before session
          if (timeDiff > 0 && timeDiff <= reminderTime) {
            const minutesUntil = Math.round(timeDiff / 60000);
            createNotificationMutation.mutate({
              title: "Upcoming Live Session",
              message: `${session.title} starts in ${minutesUntil} minutes!`,
              type: 'reminder',
              link: `/client/sessions`
            });
            
            setCheckedSessions(prev => new Set(prev).add(session._id));
          }
        }
      });
    };

    // Check immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [sessions, checkedSessions]);

  return (
    <Button
      variant="ghost"
      size="icon"
      data-testid="button-notifications"
      title="Notifications"
    >
      <Bell className="h-5 w-5 text-chart-3" />
    </Button>
  );
}
