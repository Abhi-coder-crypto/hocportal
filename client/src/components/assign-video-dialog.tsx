import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
}

export function AssignVideoDialog({ open, onOpenChange, videoId, videoTitle }: AssignVideoDialogProps) {
  const { toast } = useToast();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Get current user to check role
  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me'],
  });
  const isAdmin = authData?.role === 'admin';
  const trainerId = authData?.user?._id?.toString() || authData?.user?.id || authData?._id?.toString();

  // Fetch appropriate clients based on user role
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: isAdmin ? ['/api/admin/clients'] : ['/api/trainers', trainerId, 'clients'],
    enabled: isAdmin || !!trainerId,
  });

  const { data: assignedClients = [], isLoading: isLoadingAssigned } = useQuery<any[]>({
    queryKey: ['/api/videos', videoId, 'clients'],
    enabled: open && !!videoId,
  });

  const assignMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      return await apiRequest('POST', `/api/videos/${videoId}/assign`, { clientIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'clients'] });
      
      const message = data.errors && data.errors.length > 0
        ? `Video assigned to ${data.assigned} client(s). ${data.errors.length} already assigned.`
        : `Video assigned to ${data.assigned} client(s)`;
      
      toast({
        title: "Success",
        description: message,
      });
      setSelectedClients([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign video",
        variant: "destructive",
      });
    },
  });

  const handleToggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSubmit = () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one client",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate(selectedClients);
  };

  const assignedClientIds = new Set(assignedClients.map((ac: any) => ac._id));

  const getPackageBadge = (packageType: string) => {
    switch (packageType) {
      case 'basic':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700">Basic</Badge>;
      case 'premium':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700">Premium</Badge>;
      case 'elite':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-700">Elite</Badge>;
      default:
        return null;
    }
  };

  // Reset selected clients when dialog is opened with a new video
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedClients([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-assign-video">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Video to Clients
          </DialogTitle>
          <DialogDescription>
            Assign "{videoTitle}" to one or more clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingClients || isLoadingAssigned ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No clients found
                  </div>
                ) : (
                  clients.map((client) => (
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
                      <Label
                        htmlFor={`client-${client._id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPackageBadge(client.package)}
                            {assignedClientIds.has(client._id) && (
                              <Badge variant="secondary">Already Assigned</Badge>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-assign"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isPending || selectedClients.length === 0}
            data-testid="button-confirm-assign"
          >
            {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign to {selectedClients.length} Client{selectedClients.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
