import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function AdminClientSetup() {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { clientId: string; email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/admin/create-client-user', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsDialogOpen(false);
      setSelectedClient(null);
      setEmail("");
      setPassword("");
      toast({
        title: "Success",
        description: "User account created successfully! Client can now login.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user account",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (client: any) => {
    setSelectedClient(client);
    setEmail(client.email || "");
    setPassword("");
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      clientId: selectedClient._id,
      email: email.toLowerCase(),
      password,
    });
  };

  // Filter clients to show those without user accounts
  // We'll assume if a client has an email but we can't query users easily,
  // we'll show all clients for now and let the endpoint handle duplicates
  const clientsToSetup = clients;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold">Client Login Setup</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-6xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Setup User Accounts for Clients</CardTitle>
                  <CardDescription>
                    Create login credentials for clients who don't have user accounts yet.
                    This allows them to access their dashboard using email and password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientsLoading ? (
                      <p className="text-muted-foreground">Loading clients...</p>
                    ) : clientsToSetup.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No clients found. Add clients first from the Clients page.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {clientsToSetup.map((client: any) => (
                          <Card key={client._id} className="hover-elevate">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">{client.name}</h3>
                                    {client.email && (
                                      <Badge variant="outline">
                                        {client.email}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-4 text-sm text-muted-foreground">
                                    {client.phone && (
                                      <span>Phone: {client.phone}</span>
                                    )}
                                    {client.packageId && (
                                      <span>Package: {client.packageId.name || 'Assigned'}</span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleCreateUser(client)}
                                  data-testid={`button-create-user-${client._id}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Create User Account
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-2">
                      <CardTitle className="text-blue-900 dark:text-blue-100">
                        How This Works
                      </CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300">
                        When you create a user account:
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  <p>✓ A user account is created with the email and password you provide</p>
                  <p>✓ The client can then login at the Client Login page</p>
                  <p>✓ They'll have access to their personalized fitness dashboard</p>
                  <p>✓ The email should be unique - you cannot create duplicate user accounts</p>
                  <p>✓ Password must be at least 6 characters long</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-create-user">
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>
              Set up login credentials for {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-user-email"
              />
              <p className="text-xs text-muted-foreground">
                This will be used for login
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-user-password"
              />
              <p className="text-xs text-muted-foreground">
                Client will use this to login
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createUserMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createUserMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}
