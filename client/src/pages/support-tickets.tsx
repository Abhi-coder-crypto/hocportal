import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/language-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Clock, Plus, TicketIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  _id: string;
  ticketNumber: string;
  clientId: string;
  clientName: string;
  subject: string;
  category: 'technical' | 'billing' | 'account' | 'training' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting-response' | 'resolved' | 'closed';
  description: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  responses: Array<{
    responderId: string;
    responderName: string;
    responderType: 'client' | 'support' | 'admin';
    message: string;
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
    }>;
    createdAt: string;
  }>;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  priority: z.string().min(1, 'Please select a priority'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function SupportTicketsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const clientId = '67370beb3a67ba69a1f13bb4'; // Demo client ID

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets/client', clientId],
  });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: '',
      priority: '',
      description: '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return await apiRequest('POST', '/api/tickets', {
        ...data,
        clientId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/client', clientId] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: t('common.success'),
        description: 'Ticket created successfully',
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('msg.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" data-testid="icon-resolved" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" data-testid="icon-in-progress" />;
      case 'waiting-response':
        return <Clock className="w-5 h-5 text-orange-500" data-testid="icon-waiting" />;
      case 'closed':
        return <CheckCircle2 className="w-5 h-5 text-muted-foreground" data-testid="icon-closed" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" data-testid="icon-open" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'waiting-response':
        return 'outline';
      case 'closed':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return t('comm.statusOpen');
      case 'in-progress':
        return t('comm.statusInProgress');
      case 'waiting-response':
        return t('comm.statusWaitingResponse');
      case 'resolved':
        return t('comm.statusResolved');
      case 'closed':
        return t('comm.statusClosed');
      default:
        return status;
    }
  };

  const getPriorityBadge = (priority: string) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let label = t('comm.priorityLow');
    
    if (priority === 'urgent') {
      variant = 'destructive';
      label = t('comm.priorityUrgent');
    } else if (priority === 'high') {
      variant = 'destructive';
      label = t('comm.priorityHigh');
    } else if (priority === 'medium') {
      variant = 'default';
      label = t('comm.priorityMedium');
    } else if (priority === 'low') {
      variant = 'secondary';
      label = t('comm.priorityLow');
    }
    
    return (
      <Badge variant={variant} data-testid={`badge-priority-${priority}`}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-tickets">
        <div className="text-center">
          <div className="text-lg font-medium">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">{t('comm.supportTickets')}</h1>
            <p className="text-muted-foreground mt-1">
              {tickets && tickets.length > 0
                ? `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`
                : t('comm.noTickets')}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-ticket">
                <Plus className="w-4 h-4 mr-2" />
                {t('comm.createTicket')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">{t('comm.newTicket')}</DialogTitle>
                <DialogDescription>
                  Fill out the form below to submit a support ticket
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('comm.ticketSubject')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of the issue" 
                            {...field} 
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('comm.ticketCategory')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">{t('comm.categoryGeneral')}</SelectItem>
                              <SelectItem value="technical">{t('comm.categoryTechnical')}</SelectItem>
                              <SelectItem value="billing">{t('comm.categoryBilling')}</SelectItem>
                              <SelectItem value="account">{t('comm.categoryAccount')}</SelectItem>
                              <SelectItem value="training">{t('comm.categoryTraining')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('comm.ticketPriority')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t('comm.priorityLow')}</SelectItem>
                              <SelectItem value="medium">{t('comm.priorityMedium')}</SelectItem>
                              <SelectItem value="high">{t('comm.priorityHigh')}</SelectItem>
                              <SelectItem value="urgent">{t('comm.priorityUrgent')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('comm.ticketDescription')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed information about your issue..." 
                            rows={6}
                            {...field} 
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                      data-testid="button-submit-ticket"
                    >
                      {createTicketMutation.isPending ? t('common.loading') : t('comm.submitTicket')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {(!tickets || tickets.length === 0) && (
          <Card data-testid="card-no-tickets">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TicketIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('comm.noTickets')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first support ticket to get help
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tickets?.map((ticket) => (
            <Card 
              key={ticket._id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
              data-testid={`card-ticket-${ticket._id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CardTitle className="text-xl" data-testid={`text-title-${ticket._id}`}>
                          {ticket.subject}
                        </CardTitle>
                        <Badge variant="outline" data-testid={`badge-ticket-number-${ticket._id}`}>
                          {ticket.ticketNumber}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {ticket.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusVariant(ticket.status)} data-testid={`badge-status-${ticket._id}`}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span data-testid={`text-date-${ticket._id}`}>
                    Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </span>
                  {ticket.responses && ticket.responses.length > 0 && (
                    <span data-testid={`text-responses-${ticket._id}`}>
                      {ticket.responses.length} {ticket.responses.length === 1 ? 'response' : 'responses'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
