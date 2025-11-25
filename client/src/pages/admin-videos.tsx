import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadVideoModal } from "@/components/upload-video-modal";
import { Search, Plus, Edit, Trash2, Eye, CheckCircle2, FileText, Play, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditVideoModal } from "@/components/edit-video-modal";
import { AssignVideoDialog } from "@/components/assign-video-dialog";
import { VideoPlayerModal } from "@/components/video-player-modal";

interface Video {
  _id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  category: string;
  duration?: number;
  intensity?: string;
  difficulty?: string;
  trainer?: string;
  equipment?: string[];
  views?: number;
  completions?: number;
  isDraft?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminVideos() {
  const style = { "--sidebar-width": "16rem" };
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignVideoId, setAssignVideoId] = useState<string>("");
  const [assignVideoTitle, setAssignVideoTitle] = useState<string>("");
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string; id: string } | null>(null);
  const { toast } = useToast();

  // Fetch all videos
  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest('DELETE', `/api/videos/${videoId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: "Video deleted",
        description: "The video has been successfully deleted from the library.",
      });
      setDeleteVideoId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (video: Video) => {
    setSelectedVideo(video);
    setShowEditModal(true);
  };

  const handlePlayVideo = (video: Video) => {
    setPlayingVideo({ url: `/api/videos/${video._id}/stream`, title: video.title, id: video._id });
  };

  const handleDelete = (videoId: string) => {
    setDeleteVideoId(videoId);
  };

  const handleAssign = (video: Video) => {
    setAssignVideoId(video._id);
    setAssignVideoTitle(video.title);
    setShowAssignDialog(true);
  };

  const confirmDelete = () => {
    if (deleteVideoId) {
      deleteMutation.mutate(deleteVideoId);
    }
  };

  // Filter videos by search
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = Array.from(new Set(videos.map((v: Video) => v.category)));

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Video Library</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowUploadModal(true)} data-testid="button-upload-video">
                <Plus className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <VideoPlayerModal
            isOpen={!!playingVideo}
            onClose={() => setPlayingVideo(null)}
            videoUrl={playingVideo?.url || ""}
            videoTitle={playingVideo?.title || ""}
            videoId={playingVideo?.id || ""}
          />

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{videos.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{categories.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(videos.reduce((sum: number, v: Video) => sum + (v.duration || 0), 0) / 60)}h
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {videos.filter((v: Video) => {
                        const created = new Date(v.createdAt);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Videos Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>All Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading videos...</p>
                  ) : filteredVideos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No videos found</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {filteredVideos.map((video: Video) => (
                        <Card key={video._id} className="hover-elevate overflow-hidden" data-testid={`card-video-${video._id}`}>
                          <CardContent className="p-0">
                            <div className="relative aspect-video bg-muted flex items-center justify-center rounded-t-md group overflow-hidden">
                              {video.thumbnail || video.thumbnailData ? (
                                <>
                                  <img 
                                    src={video.thumbnailData !== undefined ? `/api/videos/${video._id}/thumbnail` : video.thumbnail} 
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        size="icon" 
                                        className="h-12 w-12 rounded-full"
                                        onClick={() => setPlayingVideo({ url: `/api/videos/${video._id}/stream`, title: video.title, id: video._id })}
                                        data-testid={`button-play-${video._id}`}
                                      >
                                        <Play className="h-6 w-6 fill-current" />
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                                  <Play className="h-12 w-12 text-primary/40 relative z-10" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        size="icon" 
                                        className="h-12 w-12 rounded-full"
                                        onClick={() => setPlayingVideo({ url: `/api/videos/${video._id}/stream`, title: video.title, id: video._id })}
                                        data-testid={`button-play-${video._id}`}
                                      >
                                        <Play className="h-6 w-6 fill-current" />
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                              {video.isDraft && (
                                <Badge className="absolute top-2 right-2" variant="secondary" data-testid="badge-draft">
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <h3 className="font-semibold line-clamp-1" data-testid={`text-video-title-${video._id}`}>{video.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {video.description || 'No description'}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">{video.category}</Badge>
                                {video.difficulty && (
                                  <Badge variant="outline">{video.difficulty}</Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{video.duration || 0} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{video.views || 0} views</span>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleAssign(video)}
                                  data-testid={`button-assign-${video._id}`}
                                >
                                  Assign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleEdit(video)}
                                  data-testid={`button-edit-${video._id}`}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleDelete(video._id)}
                                  data-testid={`button-delete-${video._id}`}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Upload Video Modal */}
      <UploadVideoModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      {/* Edit Video Modal */}
      {selectedVideo && (
        <EditVideoModal
          open={showEditModal}
          onOpenChange={() => {
            setShowEditModal(false);
            setSelectedVideo(null);
          }}
          video={selectedVideo}
        />
      )}

      {/* Assign Video Dialog */}
      <AssignVideoDialog
        open={showAssignDialog}
        onOpenChange={() => setShowAssignDialog(false)}
        videoId={assignVideoId}
        videoTitle={assignVideoTitle}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={(open) => !open && setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
