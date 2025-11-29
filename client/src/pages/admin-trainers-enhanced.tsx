import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Users, UserCheck, UserX, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminTrainersEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [assigningTrainer, setAssigningTrainer] = useState<any>(null);
  const [selectedClientsForAssignment, setSelectedClientsForAssignment] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
    profilePhoto: null as File | null,
    documentOne: null as File | null,
    documentTwo: null as File | null,
  });
  
  const [fileNames, setFileNames] = useState({
    profilePhoto: "",
    documentOne: "",
    documentTwo: "",
  });

  const style = {
    "--sidebar-width": "16rem",
  };

  // Fetch all trainers
  const { data: trainers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/trainers', searchQuery, statusFilter],
    queryFn: async () => {
      const response = await fetch('/api/admin/trainers');
      if (!response.ok) throw new Error('Failed to fetch trainers');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all clients for assignment dropdown
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  // Filter trainers on the frontend
  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = searchQuery === "" || 
      trainer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || trainer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const createTrainerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/trainers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Trainer created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trainer",
        variant: "destructive",
      });
    },
  });

  const updateTrainerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/trainers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      setEditingTrainer(null);
      resetForm();
      toast({
        title: "Success",
        description: "Trainer updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trainer",
        variant: "destructive",
      });
    },
  });

  const toggleTrainerStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/trainers/${id}/status`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      setStatusFilter("all");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      toast({
        title: "Success",
        description: `Trainer status updated to ${variables.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trainer status",
        variant: "destructive",
      });
    },
  });

  const deleteTrainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/trainers/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      toast({
        title: "Success",
        description: "Trainer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trainer",
        variant: "destructive",
      });
    },
  });

  const assignClientsToTrainerMutation = useMutation({
    mutationFn: async ({ trainerId, clientIds }: { trainerId: string; clientIds: string[] }) => {
      const response = await apiRequest('PATCH', `/api/admin/trainers/${trainerId}/assign-clients`, { clientIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Clients assigned to trainer successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign clients",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "active",
      profilePhoto: null,
      documentOne: null,
      documentTwo: null,
    });
    setFileNames({
      profilePhoto: "",
      documentOne: "",
      documentTwo: "",
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    if (!editingTrainer && !formData.password) {
      toast({
        title: "Missing Password",
        description: "Password is required for new trainers",
        variant: "destructive",
      });
      return;
    }

    // Create FormData for file uploads
    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('email', formData.email);
    formDataObj.append('status', formData.status);
    
    if (formData.phone) formDataObj.append('phone', formData.phone);
    if (formData.password) formDataObj.append('password', formData.password);
    if (formData.profilePhoto) formDataObj.append('profilePhoto', formData.profilePhoto);
    if (formData.documentOne) formDataObj.append('documentOne', formData.documentOne);
    if (formData.documentTwo) formDataObj.append('documentTwo', formData.documentTwo);

    try {
      const endpoint = editingTrainer ? `/api/admin/trainers/${editingTrainer._id}` : '/api/admin/trainers';
      const method = editingTrainer ? 'PATCH' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        body: formDataObj,
      });
      
      if (!response.ok) {
        throw new Error('Failed to save trainer');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      setIsAddDialogOpen(false);
      setEditingTrainer(null);
      resetForm();
      
      toast({
        title: "Success",
        description: editingTrainer ? "Trainer updated successfully" : "Trainer created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trainer",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (trainer: any) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      password: "",
      status: trainer.status || "active",
      profilePhoto: null,
      documentOne: null,
      documentTwo: null,
    });
    setFileNames({
      profilePhoto: trainer.profilePhoto ? "Current: " + trainer.profilePhoto.split('/').pop() : "",
      documentOne: trainer.documentOne ? "Current: " + trainer.documentOne.split('/').pop() : "",
      documentTwo: trainer.documentTwo ? "Current: " + trainer.documentTwo.split('/').pop() : "",
    });
  };

  const handleToggleStatus = (trainer: any) => {
    const newStatus = trainer.status === "active" ? "inactive" : "active";
    toggleTrainerStatusMutation.mutate({ id: trainer._id, status: newStatus });
  };

  const handleAssignClients = (trainer: any) => {
    setAssigningTrainer(trainer);
    // Pre-select clients already assigned to this trainer
    const assignedClients = clients
      .filter(client => 
        client.trainerId === trainer._id || 
        (typeof client.trainerId === 'object' && client.trainerId?._id === trainer._id)
      )
      .map(client => client._id);
    setSelectedClientsForAssignment(new Set(assignedClients));
  };

  const handleSaveClientAssignments = () => {
    if (!assigningTrainer) return;
    assignClientsToTrainerMutation.mutate({
      trainerId: assigningTrainer._id,
      clientIds: Array.from(selectedClientsForAssignment),
    });
    setAssigningTrainer(null);
    setSelectedClientsForAssignment(new Set());
  };

  const handleToggleClientSelection = (clientId: string) => {
    const newSelected = new Set(selectedClientsForAssignment);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientsForAssignment(newSelected);
  };

  // Get assigned clients count
  const getAssignedClientsCount = (trainerId: string) => {
    return clients.filter(client => 
      client.trainerId === trainerId || 
      (typeof client.trainerId === 'object' && client.trainerId?._id === trainerId)
    ).length;
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Trainer Management</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight">Trainers</h2>
                  <p className="text-muted-foreground">Manage trainer accounts and assign clients</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-trainer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trainer
                </Button>
              </div>

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Search & Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search trainers by name, email, or phone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-trainers"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Trainers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    All Trainers ({filteredTrainers.length})
                  </CardTitle>
                  <CardDescription>
                    Manage trainer accounts, status, and client assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading trainers...</div>
                  ) : filteredTrainers.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Assigned Clients</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrainers.map((trainer) => (
                            <TableRow key={trainer._id} data-testid={`trainer-row-${trainer._id}`}>
                              <TableCell className="font-medium" data-testid={`trainer-name-${trainer._id}`}>
                                {trainer.name}
                              </TableCell>
                              <TableCell data-testid={`trainer-email-${trainer._id}`}>
                                {trainer.email}
                              </TableCell>
                              <TableCell data-testid={`trainer-phone-${trainer._id}`}>
                                {trainer.phone || "-"}
                              </TableCell>
                              <TableCell data-testid={`trainer-clients-${trainer._id}`}>
                                <Badge variant="secondary">
                                  <Users className="w-3 h-3 mr-1" />
                                  {getAssignedClientsCount(trainer._id)} clients
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={trainer.status === "active"}
                                    onCheckedChange={() => handleToggleStatus(trainer)}
                                    data-testid={`switch-status-${trainer._id}`}
                                  />
                                  <Badge 
                                    variant={trainer.status === "active" ? "default" : "secondary"}
                                    data-testid={`status-badge-${trainer._id}`}
                                  >
                                    {trainer.status === "active" ? (
                                      <>
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <UserX className="w-3 h-3 mr-1" />
                                        Inactive
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignClients(trainer)}
                                    data-testid={`button-assign-clients-${trainer._id}`}
                                  >
                                    <Users className="w-4 h-4 mr-1" />
                                    Assign
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(trainer)}
                                    data-testid={`button-edit-${trainer._id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteTrainerMutation.mutate(trainer._id)}
                                    disabled={deleteTrainerMutation.isPending}
                                    data-testid={`button-delete-${trainer._id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No trainers found</p>
                      <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-first-trainer">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Trainer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Add/Edit Trainer Dialog */}
      <Dialog open={isAddDialogOpen || !!editingTrainer} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingTrainer(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrainer ? "Edit Trainer" : "Add New Trainer"}</DialogTitle>
            <DialogDescription>
              {editingTrainer ? "Update trainer information" : "Create a new trainer account"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-trainer-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="trainer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-trainer-email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-trainer-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-trainer-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!editingTrainer && "*"} {editingTrainer && "(leave blank to keep current)"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingTrainer ? "Leave blank to keep current password" : "At least 6 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-trainer-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, profilePhoto: file });
                      setFileNames({ ...fileNames, profilePhoto: file?.name || "" });
                    }}
                    className="flex-1"
                    data-testid="input-profile-photo"
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                {fileNames.profilePhoto && (
                  <p className="text-sm text-muted-foreground">{fileNames.profilePhoto}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentOne">Document 1</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="documentOne"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, documentOne: file });
                      setFileNames({ ...fileNames, documentOne: file?.name || "" });
                    }}
                    className="flex-1"
                    data-testid="input-document-one"
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                {fileNames.documentOne && (
                  <p className="text-sm text-muted-foreground">{fileNames.documentOne}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentTwo">Document 2</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="documentTwo"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, documentTwo: file });
                      setFileNames({ ...fileNames, documentTwo: file?.name || "" });
                    }}
                    className="flex-1"
                    data-testid="input-document-two"
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                {fileNames.documentTwo && (
                  <p className="text-sm text-muted-foreground">{fileNames.documentTwo}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingTrainer(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTrainerMutation.isPending || updateTrainerMutation.isPending}
                data-testid="button-submit-trainer"
              >
                {(createTrainerMutation.isPending || updateTrainerMutation.isPending)
                  ? "Saving..."
                  : editingTrainer
                  ? "Update Trainer"
                  : "Create Trainer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Clients Dialog */}
      <Dialog open={!!assigningTrainer} onOpenChange={(open) => {
        if (!open) {
          setAssigningTrainer(null);
          setSelectedClientsForAssignment(new Set());
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Clients to {assigningTrainer?.name}</DialogTitle>
            <DialogDescription>
              Select clients to assign to this trainer. Selected clients will appear in the trainer's dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {clients.length > 0 ? (
              <div className="space-y-2">
                {clients.map((client: any) => (
                  <div
                    key={client._id}
                    className="flex items-center space-x-3 p-3 border rounded-md hover-elevate"
                    data-testid={`client-assignment-${client._id}`}
                  >
                    <Checkbox
                      checked={selectedClientsForAssignment.has(client._id)}
                      onCheckedChange={() => handleToggleClientSelection(client._id)}
                      data-testid={`checkbox-client-${client._id}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.email || client.phone}
                      </div>
                    </div>
                    {client.packageId && (
                      <Badge variant="secondary">
                        {typeof client.packageId === 'object' ? client.packageId.name : 'Package'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No clients available to assign
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssigningTrainer(null);
                setSelectedClientsForAssignment(new Set());
              }}
              data-testid="button-cancel-assignment"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveClientAssignments}
              disabled={assignClientsToTrainerMutation.isPending}
              data-testid="button-save-assignments"
            >
              {assignClientsToTrainerMutation.isPending
                ? "Assigning..."
                : `Assign ${selectedClientsForAssignment.size} Client${selectedClientsForAssignment.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}
