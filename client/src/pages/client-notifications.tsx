import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Bell,
  Calendar,
  Trophy,
  DollarSign,
  BellRing,
  Info,
  Check,
  Trash2,
  Search,
  Filter,
  CheckCheck,
  ExternalLink,
} from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'session' | 'payment' | 'update' | 'achievement' | 'reminder';
  isRead: boolean;
  link?: string;
  createdAt: string;
}


export default function ClientNotifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notification deleted",
        variant: "default",
      });
    },
  });

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'session':
        return Calendar;
      case 'payment':
        return DollarSign;
      case 'achievement':
        return Trophy;
      case 'reminder':
        return BellRing;
      case 'update':
        return Info;
      default:
        return Info;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'session':
        return 'text-blue-500 dark:text-blue-400 bg-blue-500/10';
      case 'payment':
        return 'text-green-500 dark:text-green-400 bg-green-500/10';
      case 'achievement':
        return 'text-purple-500 dark:text-purple-400 bg-purple-500/10';
      case 'reminder':
        return 'text-orange-500 dark:text-orange-400 bg-orange-500/10';
      case 'update':
        return 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'payment':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'achievement':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      case 'reminder':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'update':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    if (notification.link) {
      setLocation(notification.link);
    }
  };

  const filteredNotifications = notifications
    .filter((n) => {
      if (selectedTab === "unread") return !n.isRead;
      if (selectedTab === "read") return n.isRead;
      if (selectedTab !== "all") return n.type === selectedTab;
      return true;
    })
    .filter((n) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                Stay updated with your fitness journey
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All as Read ({unreadCount})
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-notifications"
              />
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-unread">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="session" data-testid="tab-session">
              <Calendar className="h-4 w-4 mr-1" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="achievement" data-testid="tab-achievement">
              <Trophy className="h-4 w-4 mr-1" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">
              <DollarSign className="h-4 w-4 mr-1" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="reminder" data-testid="tab-reminder">
              <BellRing className="h-4 w-4 mr-1" />
              Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-0">
            {isLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "We'll notify you when something important happens"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  return (
                    <Card
                      key={notification._id}
                      className={`hover-elevate cursor-pointer transition-all ${
                        !notification.isRead
                          ? 'border-l-4 border-l-primary shadow-md'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-card-${notification._id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(
                              notification.type
                            )}`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-base">
                                  {notification.title}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs no-default-active-elevate ${getTypeBadgeColor(
                                    notification.type
                                  )}`}
                                >
                                  {notification.type}
                                </Badge>
                                {!notification.isRead && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification._id);
                                    }}
                                    data-testid={`button-mark-read-${notification._id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark Read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification._id);
                                  }}
                                  data-testid={`button-delete-${notification._id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {notification.link && (
                                <span className="flex items-center gap-1 text-primary">
                                  Click to view details
                                  <ExternalLink className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

    </div>
  );
}
