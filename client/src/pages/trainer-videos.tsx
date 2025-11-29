import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Video as VideoIcon, Clock, Eye, Play, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { UploadVideoModal } from "@/components/upload-video-modal";
import { AssignVideoDialog } from "@/components/assign-video-dialog";

interface VideoType {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  hasVideoData?: boolean;
  hasThumbnailData?: boolean;
  category: string;
  duration?: number;
  intensity?: string;
  difficulty?: string;
  trainer?: string;
  equipment?: string[];
  views?: number;
  completions?: number;
  isDraft?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function TrainerVideos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string; id: string } | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignVideoId, setAssignVideoId] = useState<string>("");
  const [assignVideoTitle, setAssignVideoTitle] = useState<string>("");
  
  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: videos = [], isLoading } = useQuery<VideoType[]>({
    queryKey: ['/api/videos']
  });

  const filteredVideos = videos.filter((video: VideoType) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(videos.map((v: VideoType) => v.category)));

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <TrainerSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">
                Video Library
              </h1>
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
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

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
                      {Math.round(videos.reduce((sum: number, v: VideoType) => sum + (v.duration || 0), 0) / 60)}h
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {videos.filter((v: VideoType) => {
                        const created = new Date(v.createdAt);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                      {filteredVideos.map((video: VideoType) => (
                        <Card key={video._id || video.id} className="hover-elevate overflow-hidden">
                          <CardContent className="p-0">
                            <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center rounded-t-md group">
                              {video.url ? (
                                <>
                                  <VideoIcon className="h-12 w-12 text-muted-foreground" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="icon" 
                                      className="h-12 w-12 rounded-full"
                                      onClick={() => setPlayingVideo({ url: `/api/videos/${video._id || video.id}/stream`, title: video.title })}
                                      data-testid={`button-play-${video._id || video.id}`}
                                    >
                                      <Play className="h-6 w-6" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <VideoIcon className="h-12 w-12 text-muted-foreground" />
                              )}
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {video.description || 'No description'}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">{video.category}</Badge>
                                <Badge variant="outline">{video.category || 'Intermediate'}</Badge>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{video.duration || 0} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{Math.floor(Math.random() * 100)} views</span>
                                </div>
                              </div>

                              <Button size="sm" className="w-full" variant="outline" data-testid={`button-edit-${video._id || video.id}`}>
                                Edit Video
                              </Button>
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
    </SidebarProvider>
  );
}
