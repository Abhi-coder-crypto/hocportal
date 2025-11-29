import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Cropper from "react-easy-crop";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Filter,
  X,
  Eye,
  UserCheck,
  UserX,
  UserPlus,
  Activity,
  Calendar,
  Package,
  FileText,
  LayoutGrid,
  LayoutList,
  FileCheck,
  User,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DocumentViewer } from "@/components/document-viewer";

export default function AdminClientsEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("joinDate");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [viewingDocuments, setViewingDocuments] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<{url: string; name: string; mimeType?: string} | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    packageId: "",
    packageDuration: "4",
    age: "",
    gender: "",
    height: "",
    weight: "",
    address: "",
    allergies: "",
    status: "active",
    profilePhoto: null as File | null,
    governmentIdDocument: null as File | null,
  });
  
  const [fileNames, setFileNames] = useState({
    profilePhoto: "",
    governmentIdDocument: "",
  });

  const [profileImageSrc, setProfileImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/clients/search', searchQuery, statusFilter, packageFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (packageFilter && packageFilter !== 'all') params.append('packageId', packageFilter);
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await fetch(`/api/admin/clients/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: allPackages = [] } = useQuery<any[]>({
    queryKey: ['/api/packages'],
  });

  // Filter to only show the 4 new packages (exclude old ones with _ARCHIVED suffix)
  const packages = allPackages.filter((pkg: any) => {
    const name = pkg.name || '';
    const isFourNewPackages = [
      'Fit Basics',
      'Fit Plus (Main Group Program)',
      'Pro Transformation',
      'Elite Athlete / Fast Result'
    ].some(newName => name.includes(newName));
    return isFourNewPackages && !name.includes('_ARCHIVED');
  });

  const { data: clientActivity, isLoading: activityLoading } = useQuery<any>({
    queryKey: ['/api/admin/clients', viewingClient?._id, 'activity'],
    enabled: !!viewingClient,
    queryFn: async () => {
      if (!viewingClient) return null;
      const response = await fetch(`/api/admin/clients/${viewingClient._id}/activity`);
      if (!response.ok) {
        throw new Error('Failed to fetch client activity');
      }
      return response.json();
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/clients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setEditingClient(null);
      setViewingClient(null);
      resetForm();
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const toggleClientStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/clients/${id}/status`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Switch to "all" filter to ensure the updated client is visible
      setStatusFilter("all");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: `Client status updated to ${variables.status}`,
      });
    },
    onError: (error: any) => {
      console.error('Status toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client status",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/clients/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ clientIds, updates }: { clientIds: string[]; updates: any }) => {
      const response = await apiRequest('POST', '/api/admin/clients/bulk-update', {
        clientIds,
        updates,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClients(new Set());
      setIsBulkActionsOpen(false);
      toast({
        title: "Success",
        description: "Clients updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update clients",
        variant: "destructive",
      });
    },
  });

  const validateIndianPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob as Blob);
      }, 'image/jpeg');
    });
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setProfileImageSrc(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!profileImageSrc || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(profileImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      setFormData({ ...formData, profilePhoto: croppedFile });
      setFileNames({ ...fileNames, profilePhoto: 'profile-photo.jpg (cropped)' });
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      packageId: "",
      packageDuration: "4",
      age: "",
      gender: "",
      height: "",
      weight: "",
      address: "",
      allergies: "",
      status: "active",
      profilePhoto: null,
      governmentIdDocument: null,
    });
    setFileNames({
      profilePhoto: "",
      governmentIdDocument: "",
    });
    setProfileImageSrc(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validateIndianPhone(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Indian phone number (10 digits, optionally starting with +91 or 91)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate Government ID is required for new clients
    if (!editingClient && !formData.governmentIdDocument) {
      toast({
        title: "Missing Required Document",
        description: "Please upload a Government ID (Aadhar card/Pan card/other)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password for new clients
    if (!editingClient && !formData.password) {
      toast({
        title: "Missing Password",
        description: "Please enter a password for the new client",
        variant: "destructive",
      });
      return;
    }
    
    // Create FormData for file uploads
    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('phone', formData.phone);
    formDataObj.append('email', formData.email);
    formDataObj.append('status', formData.status);
    
    // Only send password for new clients (not for editing)
    if (!editingClient) {
      formDataObj.append('password', formData.password);
    }
    
    if (formData.packageId) {
      formDataObj.append('packageId', formData.packageId);
      formDataObj.append('packageDuration', formData.packageDuration || "4");
    }
    if (formData.age) formDataObj.append('age', formData.age);
    if (formData.gender) formDataObj.append('gender', formData.gender);
    if (formData.height) formDataObj.append('height', formData.height);
    if (formData.weight) formDataObj.append('weight', formData.weight);
    if (formData.address) formDataObj.append('address', formData.address);
    if (formData.allergies) formDataObj.append('allergies', formData.allergies);
    if (formData.profilePhoto) formDataObj.append('profilePhoto', formData.profilePhoto);
    if (formData.governmentIdDocument) formDataObj.append('aadharDocument', formData.governmentIdDocument);

    try {
      const endpoint = editingClient ? `/api/clients/${editingClient._id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        body: formDataObj,
      });
      
      if (!response.ok) {
        throw new Error('Failed to save client');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsAddDialogOpen(false);
      setEditingClient(null);
      resetForm();
      
      toast({
        title: "Success",
        description: editingClient ? "Client updated successfully" : "Client added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    let packageId = "";
    if (client.packageId) {
      if (typeof client.packageId === 'object' && '_id' in client.packageId) {
        packageId = String(client.packageId._id);
      } else if (typeof client.packageId === 'object') {
        packageId = client.packageId.toString();
      } else {
        packageId = String(client.packageId);
      }
    }
    setFormData({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      password: "",
      packageId: packageId,
      packageDuration: client.packageDuration?.toString() || "4",
      age: client.age?.toString() || "",
      gender: client.gender || "",
      height: client.height?.toString() || "",
      weight: client.weight?.toString() || "",
      address: client.address || "",
      allergies: client.allergies?.join(", ") || "",
      status: client.status || "active",
      profilePhoto: null,
      governmentIdDocument: null,
    });
    setFileNames({
      profilePhoto: client.profilePhoto ? "Current: " + client.profilePhoto.split('/').pop() : "",
      governmentIdDocument: client.aadharDocument ? "Current: " + client.aadharDocument.split('/').pop() : "",
    });
  };

  const handleToggleSelect = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = () => {
    const clientsArray = Array.isArray(clients) ? clients : [];
    if (selectedClients.size === clientsArray.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clientsArray.map((c: any) => c._id)));
    }
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    bulkUpdateMutation.mutate({
      clientIds: Array.from(selectedClients),
      updates: { status: newStatus },
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/clients/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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

  const clientsArray = Array.isArray(clients) ? clients : [];
  const totalClients = clientsArray.length;
  const activeCount = clientsArray.filter((c: any) => c.status === 'active').length;
  const inactiveCount = clientsArray.filter((c: any) => c.status === 'inactive').length;
  const enquiredCount = clientsArray.filter((c: any) => c.status === 'enquired').length;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">
                Client Management
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
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-clients">{totalClients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-active-clients">{activeCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-inactive-clients">{inactiveCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enquired</CardTitle>
                    <UserPlus className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600" data-testid="text-enquired-clients">{enquiredCount}</div>
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

                <Select value={packageFilter} onValueChange={setPackageFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-package-filter">
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg._id} value={pkg._id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joinDate">Join Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="lastActivity">Last Activity</SelectItem>
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

                <div className="flex gap-2 ml-auto">
                  {selectedClients.size > 0 && (
                    <Dialog open={isBulkActionsOpen} onOpenChange={setIsBulkActionsOpen}>
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkActionsOpen(true)}
                        data-testid="button-bulk-actions"
                      >
                        Bulk Actions ({selectedClients.size})
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Actions</DialogTitle>
                          <DialogDescription>
                            Update {selectedClients.size} selected client{selectedClients.size !== 1 ? 's' : ''}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Update Status</Label>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => handleBulkStatusUpdate('active')}
                                data-testid="button-bulk-active"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Mark Active
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleBulkStatusUpdate('inactive')}
                                data-testid="button-bulk-inactive"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Mark Inactive
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    data-testid="button-export"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>

                  <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-client">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </div>

              {/* Clients List/Card View */}
              {viewMode === "list" ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedClients.size === clientsArray.length && clientsArray.length > 0}
                            onCheckedChange={handleSelectAll}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Loading clients...
                          </TableCell>
                        </TableRow>
                      ) : clientsArray.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No clients found
                          </TableCell>
                        </TableRow>
                      ) : (
                        clientsArray.map((client: any) => (
                          <TableRow key={client._id} data-testid={`row-client-${client._id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedClients.has(client._id)}
                                onCheckedChange={() => handleToggleSelect(client._id)}
                                data-testid={`checkbox-client-${client._id}`}
                              />
                            </TableCell>
                            <TableCell className="font-semibold" data-testid="text-client-name">
                              {client.name}
                            </TableCell>
                            <TableCell data-testid="text-client-phone">{client.phone}</TableCell>
                            <TableCell>
                              {client.packageId ? (
                                <Badge variant="outline" data-testid="badge-package">
                                  {client.packageId.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">No package</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(client.status || 'active')}
                            </TableCell>
                            <TableCell data-testid="text-join-date">
                              {new Date(client.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewingClient(client)}
                                  data-testid={`button-view-${client._id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewingDocuments(client)}
                                  data-testid={`button-view-docs-${client._id}`}
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(client)}
                                  data-testid={`button-edit-${client._id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`⚠️ Are you sure you want to permanently delete ${client.name}?\n\nThis action CANNOT be undone. All their data, workouts, sessions, and progress will be permanently removed.`)) {
                                      deleteClientMutation.mutate(client._id);
                                    }
                                  }}
                                  disabled={deleteClientMutation.isPending}
                                  data-testid={`button-delete-${client._id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {client.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                  <Switch
                                    checked={client.status === 'active'}
                                    onCheckedChange={(checked) => {
                                      toggleClientStatusMutation.mutate({
                                        id: client._id,
                                        status: checked ? 'active' : 'inactive'
                                      });
                                    }}
                                    disabled={toggleClientStatusMutation.isPending}
                                    data-testid={`switch-status-${client._id}`}
                                  />
                                </div>
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
                  {clientsLoading ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      Loading clients...
                    </div>
                  ) : clientsArray.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      No clients found
                    </div>
                  ) : (
                    clientsArray.map((client: any) => (
                      <Card key={client._id} className="overflow-hidden hover-elevate" data-testid={`card-client-${client._id}`}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              {client.profilePhoto ? (
                                <img 
                                  src={client.profilePhoto} 
                                  alt={client.name}
                                  className="h-24 w-24 rounded-full object-cover border-2 border-border"
                                  data-testid={`img-profile-${client._id}`}
                                />
                              ) : (
                                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                                  <User className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0">
                                {getStatusBadge(client.status || 'active')}
                              </div>
                            </div>
                            <div className="text-center w-full">
                              <h3 className="font-semibold text-lg" data-testid="text-client-name">{client.name}</h3>
                              <p className="text-sm text-muted-foreground" data-testid="text-client-phone">{client.phone}</p>
                              {client.packageId && (
                                <Badge variant="outline" className="mt-2" data-testid="badge-package">
                                  {client.packageId.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="font-medium" data-testid="text-join-date">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {client.age && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Age:</span>
                                <span className="font-medium">{client.age} years</span>
                              </div>
                            )}
                            {client.weight && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight:</span>
                                <span className="font-medium">{client.weight} kg</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 pt-4 border-t">
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingClient(client)}
                                data-testid={`button-view-${client._id}`}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (client.aadharDocument) {
                                    setViewingDocument({
                                      url: client.aadharDocument,
                                      name: `${client.name} - Government ID`,
                                    });
                                  } else {
                                    toast({
                                      title: "No Document",
                                      description: "This client has no government ID document uploaded",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                data-testid={`button-view-docs-${client._id}`}
                              >
                                <FileCheck className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(client)}
                                data-testid={`button-edit-${client._id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {client.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                              <Switch
                                checked={client.status === 'active'}
                                onCheckedChange={(checked) => {
                                  toggleClientStatusMutation.mutate({
                                    id: client._id,
                                    status: checked ? 'active' : 'inactive'
                                  });
                                }}
                                disabled={toggleClientStatusMutation.isPending}
                                data-testid={`switch-status-${client._id}`}
                              />
                            </div>
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

      {/* Add/Edit Client Dialog */}
      <Dialog open={isAddDialogOpen || !!editingClient} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingClient(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Update client information" : "Enter client details to add them to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-client-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={!!editingClient}
                  data-testid="input-client-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-client-email"
              />
            </div>

            {!editingClient && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  data-testid="input-client-password"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package">Package</Label>
                <Select
                  value={formData.packageId}
                  onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                >
                  <SelectTrigger data-testid="select-package">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg._id} value={pkg._id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageDuration">Package Duration</Label>
                <Select
                  value={formData.packageDuration}
                  onValueChange={(value) => setFormData({ ...formData, packageDuration: value })}
                >
                  <SelectTrigger data-testid="select-package-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 weeks</SelectItem>
                    <SelectItem value="8">8 weeks</SelectItem>
                    <SelectItem value="12">12 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  data-testid="input-client-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  data-testid="input-client-height"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  data-testid="input-client-weight"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter client's address..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                data-testid="textarea-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies & Dietary Restrictions</Label>
              <Textarea
                id="allergies"
                placeholder="e.g., Peanuts, Gluten, Dairy (comma-separated)"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                data-testid="textarea-allergies"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  data-testid="input-profile-photo"
                />
                {fileNames.profilePhoto && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{fileNames.profilePhoto}</p>
                    {editingClient?.profilePhoto && (
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingDocument({
                          url: editingClient.profilePhoto,
                          name: `${editingClient.name} - Profile Photo`,
                        })}
                        data-testid="button-view-profile-photo"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governmentIdDocument">
                Government ID (Aadhar card/Pan card/other) {!editingClient && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="governmentIdDocument"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, governmentIdDocument: file });
                    setFileNames({ ...fileNames, governmentIdDocument: file.name });
                  }
                }}
                required={!editingClient}
                data-testid="input-government-id-document"
              />
              {fileNames.governmentIdDocument && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{fileNames.governmentIdDocument}</p>
                  {editingClient?.aadharDocument && (
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingDocument({
                        url: editingClient.aadharDocument,
                        name: `${editingClient.name} - Government ID`,
                      })}
                      data-testid="button-view-government-id"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
                data-testid="button-save-client"
              >
                {editingClient ? "Update Client" : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog open={!!viewingClient} onOpenChange={(open) => {
        if (!open) setViewingClient(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>{viewingClient?.name}</span>
              {viewingClient && getStatusBadge(viewingClient.status || 'active')}
            </DialogTitle>
            <DialogDescription>Complete client profile and activity history</DialogDescription>
          </DialogHeader>

          {viewingClient && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Admin Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{viewingClient.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewingClient.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Package</Label>
                    <p className="font-medium">{viewingClient.packageId?.name || 'No package'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Join Date</Label>
                    <p className="font-medium">{new Date(viewingClient.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p className="font-medium">{viewingClient.age || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium">{viewingClient.gender || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Height</Label>
                    <p className="font-medium">{viewingClient.height ? `${viewingClient.height} cm` : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Weight</Label>
                    <p className="font-medium">{viewingClient.weight ? `${viewingClient.weight} kg` : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Goal</Label>
                    <p className="font-medium">{viewingClient.goal || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Activity</Label>
                    <p className="font-medium">
                      {viewingClient.lastActivityDate 
                        ? new Date(viewingClient.lastActivityDate).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                {activityLoading ? (
                  <p className="text-center text-muted-foreground">Loading activity...</p>
                ) : clientActivity ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{clientActivity.totalWorkouts}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{clientActivity.totalLiveSessions}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Workout Plans</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{clientActivity.assignedWorkoutPlans}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Diet Plans</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{clientActivity.assignedDietPlans}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {clientActivity.recentWorkouts.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recent Workouts</h4>
                        <div className="space-y-2">
                          {clientActivity.recentWorkouts.slice(0, 5).map((workout: any, index: number) => (
                            <Card key={index}>
                              <CardContent className="flex items-center justify-between p-4">
                                <div>
                                  <p className="font-medium">{workout.workoutName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(workout.completedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{workout.duration} min</p>
                                  <p className="text-sm text-muted-foreground">{workout.caloriesBurned} cal</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No activity data available</p>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={viewingClient.adminNotes || ''}
                    onChange={(e) => {
                      setViewingClient({
                        ...viewingClient,
                        adminNotes: e.target.value,
                      });
                    }}
                    placeholder="Add private notes about this client..."
                    rows={10}
                    data-testid="textarea-view-admin-notes"
                  />
                  <Button 
                    onClick={() => {
                      updateClientMutation.mutate({
                        id: viewingClient._id,
                        data: { adminNotes: viewingClient.adminNotes },
                      });
                    }}
                    data-testid="button-save-notes"
                  >
                    Save Notes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* View Documents Dialog */}
      <Dialog open={!!viewingDocuments} onOpenChange={(open) => {
        if (!open) setViewingDocuments(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Client Documents - {viewingDocuments?.name}
            </DialogTitle>
            <DialogDescription>
              View uploaded identity and other documents for this client
            </DialogDescription>
          </DialogHeader>
          
          {viewingDocuments && (
            <div className="space-y-6 py-4">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Profile Photo</Label>
                {viewingDocuments.profilePhoto ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={viewingDocuments.profilePhoto} 
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover border-2 border-border"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setViewingDocument({
                        url: viewingDocuments.profilePhoto,
                        name: `${viewingDocuments.name} - Profile Photo`,
                      })}
                      data-testid="button-view-profile-photo-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No profile photo uploaded</p>
                  </div>
                )}
              </div>

              {/* Government ID Document */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Government ID (Aadhar/PAN/Other)</Label>
                {viewingDocuments.aadharDocument ? (
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Government ID Document</p>
                          <p className="text-sm text-muted-foreground">
                            {viewingDocuments.aadharDocument.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setViewingDocument({
                          url: viewingDocuments.aadharDocument,
                          name: `${viewingDocuments.name} - Government ID`,
                        })}
                        data-testid="button-view-government-id-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">No government ID document uploaded</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Other Documents */}
              {viewingDocuments.otherDocument && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Other Documents</Label>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Additional Document</p>
                          <p className="text-sm text-muted-foreground">
                            {viewingDocuments.otherDocument.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setViewingDocument({
                          url: viewingDocuments.otherDocument,
                          name: `${viewingDocuments.name} - Other Document`,
                        })}
                        data-testid="button-view-other-document"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
            <DialogDescription>
              Adjust the circular crop area to select your profile photo
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[400px] w-full">
            {profileImageSrc && (
              <Cropper
                image={profileImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropper(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropSave}>
              Save Cropped Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <DocumentViewer
        open={!!viewingDocument}
        document={viewingDocument}
        onClose={() => setViewingDocument(null)}
      />

    </div>
  </SidebarProvider>
  );
}
