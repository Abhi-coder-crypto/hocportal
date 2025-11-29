import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface AssignSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  packagePlan?: string;
}

export function AssignSessionDialog({ open, onOpenChange, sessionId, sessionTitle, packagePlan = "" }: AssignSessionDialogProps) {
  const { toast } = useToast();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Get current user to check role
  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me'],
  });
  const isAdmin = authData?.user?.role === 'admin';
  const trainerId = authData?.user?._id?.toString() || authData?.user?.id;

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<any[]>({
    queryKey: ['/api/packages'],
  });

  // Fetch appropriate clients based on user role
  const { data: allClients = [], isLoading: isLoadingAllClients } = useQuery<any[]>({
    queryKey: isAdmin ? ['/api/clients'] : ['/api/trainers', trainerId, 'clients'],
    enabled: isAdmin || !!trainerId,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedClients([]);
    }
  }, [open]);

  const { data: sessionClients = [], isLoading: isLoadingAssigned } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'clients'],
    enabled: open && !!sessionId,
  });

  // Fetch ALL sessions to check which clients are already assigned to any session
  const { data: allSessions = [] } = useQuery<any[]>({
    queryKey: ['/api/sessions'],
    enabled: open,
  });

  // Get all clients who are already assigned to ANY session
  const clientsInAnySessions = useMemo(() => {
    const clientSet = new Set<string>();
    allSessions.forEach((session: any) => {
      if (session.clients && Array.isArray(session.clients)) {
        session.clients.forEach((clientId: string) => {
          clientSet.add(clientId);
        });
      }
    });
    return clientSet;
  }, [allSessions]);

  // Check if a package name matches a session plan (more flexible matching)
  const packageMatchesPlan = (packageName: string, plan: string): boolean => {
    const normalizedPkgName = packageName.toLowerCase();
    switch (plan.toLowerCase()) {
      case 'fitplus':
        return normalizedPkgName.includes('fit plus');
      case 'pro':
        return normalizedPkgName.includes('pro transformation');
      case 'elite':
        return normalizedPkgName.includes('elite');
      default:
        return false;
    }
  };

  // Filter clients by session's package plan and exclude those already in any session
  const filteredClients = allClients.filter(client => {
    if (!client.packageId) return false;
    
    // Exclude clients already assigned to any session (except the current session being edited)
    const isInCurrentSession = sessionClients.some((sc: any) => sc._id === client._id);
    if (!isInCurrentSession && clientsInAnySessions.has(client._id)) {
      return false;
    }
    
    const pkg = typeof client.packageId === 'object' ? client.packageId : null;
    const packageName = pkg?.name || '';
    
    // If packagePlan is provided, filter by flexible package name matching
    if (packagePlan) {
      return packageMatchesPlan(packageName, packagePlan);
    }
    
    // Fallback: show clients from Fit Plus and higher packages (excluding Fit Basics)
    return packageName !== 'Fit Basics' && packageName !== '';
  });

  const assignedClientIds = new Set(sessionClients.map((client: any) => client._id));

  const assignMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      return await apiRequest('POST', `/api/sessions/${sessionId}/assign`, { clientIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trainers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      const message = data.errors && data.errors.length > 0
        ? `Batch assigned to ${data.assigned} client(s). ${data.errors.length} already assigned.`
        : `Batch assigned to ${data.assigned} client(s)`;
      
      toast({
        title: "Success",
        description: message,
      });
      
      // Check if 10 clients were assigned
      if (data.assigned === 10) {
        toast({
          title: "Batch Full",
          description: "10 clients assigned! Clone this session for remaining clients.",
          variant: "default",
        });
      }
      
      setSelectedClients([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign batch",
        variant: "destructive",
      });
    },
  });

  const handleToggleClient = (clientId: string) => {
    if (selectedClients.length >= 10 && !selectedClients.includes(clientId)) {
      toast({
        title: "Batch Full",
        description: "Maximum 10 clients per batch. Create another session for more clients.",
        variant: "destructive",
      });
      return;
    }
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSubmitClients = () => {
    if (selectedClients.length === 0) {
      return; // Button should be disabled, but just in case
    }
    assignMutation.mutate(selectedClients);
  };

  const getPackageName = (packageId: string) => {
    const pkg = packages.find(p => p._id === packageId);
    return pkg?.name || '';
  };

  const getPackageBadgeColor = (packageName: string) => {
    switch (packageName) {
      case 'Fit Plus':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'Pro Transformation':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'Elite Athlete':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  // Get live session eligible packages only
  const eligiblePackages = packages.filter(pkg => 
    pkg.name && !pkg.name.includes('Fit Basics') && 
    (pkg.liveGroupTrainingAccess === true || (pkg.liveSessionsPerMonth && pkg.liveSessionsPerMonth > 0))
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md h-[90vh] flex flex-col overflow-hidden" data-testid="dialog-assign-session">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Clients
          </DialogTitle>
          <DialogDescription>
            Assign up to 10 clients from this package
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 rounded-md border">
            <div className="space-y-3 p-4 pr-4">
            {packagePlan && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-medium">
                  Batch - {sessionClients.length + selectedClients.length}/10 selected
                </p>
              </div>
            )}

            {sessionClients.length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  <strong>Already assigned:</strong> {sessionClients.map((c: any) => c.name).join(', ')}
                </p>
              </div>
            )}

            {isLoadingAllClients || isLoadingAssigned ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">No eligible clients in this package</p>
                <p className="text-sm mt-2">All clients are already assigned to sessions or no clients exist for this package plan.</p>
              </div>
            ) : filteredClients.filter(client => !assignedClientIds.has(client._id)).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">All eligible clients are already assigned</p>
                <p className="text-sm mt-2">Click "Done" to finish.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client._id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate"
                    data-testid={`client-item-${client._id}`}
                  >
                    <Checkbox
                      id={`client-${client._id}`}
                      checked={selectedClients.includes(client._id)}
                      onCheckedChange={() => handleToggleClient(client._id)}
                      disabled={assignedClientIds.has(client._id)}
                      data-testid={`checkbox-client-${client._id}`}
                    />
                    <Label htmlFor={`client-${client._id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                        {assignedClientIds.has(client._id) && (
                          <Badge variant="secondary">Already Assigned</Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          
          {selectedClients.length > 0 ? (
            <Button
              onClick={handleSubmitClients}
              disabled={assignMutation.isPending}
              data-testid="button-assign"
            >
              {assignMutation.isPending ? 'Assigning...' : `Assign (${selectedClients.length})`}
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              data-testid="button-done"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
