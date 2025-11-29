import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, RefreshCw, Clock, DollarSign, Zap } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getRemainingDays, hasFeature, FEATURE_LABELS } from "@/lib/featureAccess";

interface ClientWithPackage {
  _id: string;
  name: string;
  email: string;
  packageName?: string;
  packageId?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  accessDurationWeeks?: number;
}

export default function AdminPackageManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    packageId: "",
    accessDurationWeeks: "4",
  });
  const { toast } = useToast();

  const style = { "--sidebar-width": "16rem" } as React.CSSProperties;

  const { data: clients = [], isLoading } = useQuery<ClientWithPackage[]>({
    queryKey: ['/api/admin/clients/packages', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      const response = await fetch(`/api/admin/clients/packages?${params}`);
      return response.json();
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['/api/packages'],
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient?._id) throw new Error('No client selected');
      return apiRequest('PATCH', `/api/admin/clients/${selectedClient._id}/subscription`, {
        packageId: formData.packageId,
        accessDurationWeeks: parseInt(formData.accessDurationWeeks),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/packages'] });
      toast({ title: 'Success', description: 'Subscription updated successfully' });
      setIsDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEditClient = (client: ClientWithPackage) => {
    setSelectedClient(client);
    setFormData({
      packageId: client.packageId || "",
      accessDurationWeeks: String(client.accessDurationWeeks || 4),
    });
    setIsDialogOpen(true);
  };

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-bold">Package Management</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Clients Grid */}
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No clients found</div>
                ) : (
                  clients.map((client) => {
                    const remainingDays = getRemainingDays(client.subscriptionEndDate);
                    const isActive = remainingDays > 0;
                    return (
                      <Card key={client._id} className={isActive ? '' : 'opacity-75'}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{client.name}</CardTitle>
                              <CardDescription>{client.email}</CardDescription>
                            </div>
                            <Badge variant={isActive ? 'default' : 'destructive'}>
                              {isActive ? 'Active' : 'Expired'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Package</p>
                              <p className="font-semibold">{client.packageName || 'None'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="font-semibold flex items-center gap-1">
                                <Clock className="h-4 w-4" /> {client.accessDurationWeeks} weeks
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Expires</p>
                              <p className="font-semibold text-sm">
                                {client.subscriptionEndDate
                                  ? format(new Date(client.subscriptionEndDate), 'MMM dd')
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Days Left</p>
                              <p className={`font-semibold ${remainingDays <= 7 ? 'text-yellow-600' : ''}`}>
                                {remainingDays} days
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleEditClient(client)}
                            variant="outline"
                            size="sm"
                            data-testid={`button-edit-${client._id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit Subscription
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subscription - {selectedClient?.name}</DialogTitle>
            <DialogDescription>Manage package access and duration</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package">Package</Label>
              <Select value={formData.packageId} onValueChange={(value) => setFormData({ ...formData, packageId: value })}>
                <SelectTrigger id="package">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg: any) => (
                    <SelectItem key={pkg._id} value={pkg._id}>
                      {pkg.name} - ₹{pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={formData.accessDurationWeeks} onValueChange={(value) => setFormData({ ...formData, accessDurationWeeks: value })}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.packageId && (
              <Card className="bg-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Available Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Features would be displayed here based on selected package */}
                    <p className="text-sm text-muted-foreground">Features will display based on selected package</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateSubscriptionMutation.mutate()}
              disabled={updateSubscriptionMutation.isPending || !formData.packageId}
            >
              {updateSubscriptionMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  </SidebarProvider>
  );
}
