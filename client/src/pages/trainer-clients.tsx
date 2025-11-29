import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Download, 
  LayoutList, 
  LayoutGrid,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  UserPlus,
  MessageSquare,
  Mail,
  Phone,
  Target,
  TrendingUp
} from "lucide-react";
import type { Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TrainerClients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const { toast } = useToast();

  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me']
  });

  const user = authData?.user;
  const trainerId = user?._id?.toString() || user?.id;

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/trainers', trainerId, 'clients'],
    enabled: !!trainerId
  });

  // Filter clients
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery);
    
    return matchesSearch;
  });

  // Calculate statistics
  const totalClients = clients.length;
  const activeCount = totalClients;
  const inactiveCount = 0;
  const enquiredCount = 0;

  const handleExport = () => {
    try {
      const headers = ["Name", "Phone", "Email", "Status", "Join Date"];
      const rows = filteredClients.map((client: any) => [
        client.name,
        client.phone || "-",
        client.email || "-",
        "active",
        new Date(client.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trainer-clients-${new Date().toLocaleDateString()}.csv`;
      link.click();

      toast({
        title: "Success",
        description: "Client data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export client data",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (client: any) => {
    if (client.phone) {
      const phoneNumber = client.phone.replace(/\D/g, "");
      const message = `Hello ${client.name}, this is your trainer from FitPro. How can I help you today?`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      active: { variant: "default" as const, icon: UserCheck, label: "Active" },
      inactive: { variant: "secondary" as const, icon: UserX, label: "Inactive" },
      enquired: { variant: "outline" as const, icon: UserPlus, label: "Enquired" },
    };
    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <TrainerSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">
                My Clients
              </h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-clients">
                      {totalClients}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-active-clients">
                      {activeCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-inactive-clients">
                      {inactiveCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enquired</CardTitle>
                    <UserPlus className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600" data-testid="text-enquired-clients">
                      {enquiredCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="enquired">Enquired</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 border rounded-md p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    data-testid="button-view-card"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  data-testid="button-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Clients List/Card View */}
              {viewMode === "list" ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Loading clients...
                            </TableCell>
                          </TableRow>
                        ) : filteredClients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No clients found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredClients.map((client: any) => (
                            <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                              <TableCell className="font-semibold" data-testid="text-client-name">
                                {client.name}
                              </TableCell>
                              <TableCell data-testid="text-client-phone">
                                {client.phone || "-"}
                              </TableCell>
                              <TableCell data-testid="text-client-email">
                                {client.email || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="default">Active</Badge>
                              </TableCell>
                              <TableCell data-testid="text-join-date">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleMessage(client)}
                                    data-testid={`button-message-${client.id}`}
                                    title="Send WhatsApp message"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {isLoading ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      Loading clients...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      No clients found
                    </div>
                  ) : (
                    filteredClients.map((client: any) => (
                      <Card key={client.id} className="overflow-hidden hover-elevate" data-testid={`card-client-${client.id}`}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-center w-full">
                              <h3 className="font-semibold text-lg" data-testid="text-client-name">
                                {client.name}
                              </h3>
                              <p className="text-sm text-muted-foreground" data-testid="text-client-phone">
                                {client.phone || "-"}
                              </p>
                              {client.email && (
                                <p className="text-sm text-muted-foreground" data-testid="text-client-email">
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-medium" data-testid={`status-${client.id}`}>
                                Active
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="font-medium" data-testid="text-join-date">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleMessage(client)}
                              data-testid={`button-message-${client._id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

    </div>
  </SidebarProvider>
  );
}
