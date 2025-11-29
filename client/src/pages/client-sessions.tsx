import { ClientHeader } from "@/components/client-header";
import { LiveSessionCard } from "@/components/live-session-card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { MobileNavigation } from "@/components/mobile-navigation";

export default function ClientSessions() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string | null>(null);

  // Get client ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem('clientId');
    if (!id) {
      setLocation('/client-access');
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  // Fetch ONLY sessions booked by this client
  const { data: sessionsData = [], isLoading, isError } = useQuery<any[]>({
    queryKey: [`/api/sessions/client/${clientId}`],
    enabled: !!clientId,
  });

  // Format and categorize sessions by status
  const { upcomingSessions, liveSessions, completedSessions } = useMemo(() => {
    if (!sessionsData) return { upcomingSessions: [], liveSessions: [], completedSessions: [] };

    const formatSession = (session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      // Get trainer name from trainerId (populated) or trainerName field
      const trainerName = session.trainerId?.name || session.trainerName || "Trainer";
      return {
        id: session._id,
        title: session.title,
        trainer: trainerName,
        date: sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: `${session.duration} min`,
        participants: session.currentParticipants || 0,
        maxParticipants: session.maxParticipants || 15,
        status: session.status,
        meetingLink: session.joinUrl || session.meetingLink,
        sessionType: session.sessionType,
        scheduledAt: session.scheduledAt,
        joinUrl: session.joinUrl,
      };
    };

    // Sort sessions by date
    const sorted = [...sessionsData].sort((a, b) => {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    return {
      upcomingSessions: sorted
        .filter(s => s.status === 'upcoming')
        .map(formatSession),
      liveSessions: sorted
        .filter(s => s.status === 'live')
        .map(formatSession),
      completedSessions: sorted
        .filter(s => s.status === 'completed')
        .map(formatSession),
    };
  }, [sessionsData]);

  return (
    <div className="min-h-screen flex flex-col mb-24 md:mb-0">
      <ClientHeader currentPage="sessions" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-6 space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">My Live Training Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Your scheduled sessions - click "Join Now" to enter the live session
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading sessions...
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              Failed to load sessions. Please refresh the page.
            </div>
          ) : (
            <>
              {liveSessions.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-6">Live Now</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveSessions.map((session: any) => (
                      <LiveSessionCard
                        key={session.id}
                        {...session}
                        onJoin={() => {
                          if (session.joinUrl) {
                            window.open(session.joinUrl, '_blank');
                          } else {
                            alert('Zoom link not available for this session yet');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-display font-bold tracking-tight mb-6">Sessions</h2>
                {upcomingSessions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingSessions.map((session: any) => (
                      <LiveSessionCard
                        key={session.id}
                        {...session}
                        onJoin={() => {
                          if (session.joinUrl) {
                            window.open(session.joinUrl, '_blank');
                          } else {
                            alert('Zoom link not available for this session yet');
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming sessions scheduled
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-display font-bold tracking-tight mb-6">Completed Sessions</h2>
                {completedSessions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedSessions.map((session: any) => (
                      <LiveSessionCard key={session.id} {...session} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed sessions yet
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}
