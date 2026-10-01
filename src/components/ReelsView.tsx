import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Film,
  Music2,
  Sparkles,
  Send,
  X,
  Trash2,
} from 'lucide-react';
import { Post, User, Comment } from '../types';
import { FILTER_CSS_MAP, timeAgo } from '../utils/mediaUtils';
import { dbService } from '../db/db';

interface ReelsViewProps {
  posts: Post[];
  currentUser: User | null;
  savedPostIds: string[];
  onToggleLike: (post: Post) => void;
  onToggleSave: (postId: string) => void;
  onSelectCreator: (user: User) => void;
  onRequireAuth: () => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  posts,
  currentUser,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onSelectCreator,
  onRequireAuth,
  onOpenCreate,
  onRefresh,
}) => {
  const videoPosts = posts.filter((p) => p.mediaType === 'video');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [heartBurst, setHeartBurst] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentPost = videoPosts[currentIndex] || null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videoPosts.length]);

  // Load comments when opening drawer
  useEffect(() => {
    if (currentPost && isCommentsDrawerOpen) {
      dbService.getComments(currentPost.id).then(setComments);
    }
  }, [currentPost, isCommentsDrawerOpen]);

  const goToNext = () => {
    if (currentIndex < videoPosts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleDoubleClick = () => {
    if (currentPost) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 800);
      onToggleLike(currentPost);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!currentPost || !commentText.trim()) return;

    try {
      const newComment = await dbService.addComment(
        currentPost.id,
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        commentText.trim()
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !currentPost) return;
    try {
      await dbService.deleteComment(commentId, currentPost.id, currentUser.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (videoPosts.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-rose-400 mb-4">
          <Film className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 font-display">No hay reels todavía</h2>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Los Reels son vídeos verticales interactivos con sonido y efectos visuales. ¡Crea el primero o genera una muestra animada!
        </p>
        <button
          onClick={onOpenCreate}
          className="rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-rose-500 transition-colors"
        >
          Crear o Generar un Vídeo
        </button>
      </div>
    );
  }

  const isLiked = currentUser && currentPost ? currentPost.likedBy.includes(currentUser.id) : false;
  const isSaved = currentPost ? savedPostIds.includes(currentPost.id) : false;

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4rem)] max-w-md items-center justify-center p-2 sm:p-4 select-none">
      
      {/* Reel Card */}
      <div className="relative h-full w-full max-h-[820px] rounded-3xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center">
        
        {/* Main Video Element */}
        <video
          ref={videoRef}
          key={currentPost.id}
          src={currentPost.mediaUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          className="h-full w-full object-cover cursor-pointer"
          style={{ filter: FILTER_CSS_MAP[currentPost.filter] }}
          onClick={togglePlay}
          onDoubleClick={handleDoubleClick}
        />

        {/* Play/Pause indicator icon when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer pointer-events-auto"
          >
            <div className="rounded-full bg-black/60 p-5 text-white backdrop-blur-sm">
              <Play className="h-10 w-10 fill-white" />
            </div>
          </div>
        )}

        {/* Double Click Heart Animation */}
        {heartBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-28 w-28 fill-rose-500 text-rose-500 animate-ping duration-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Top Header Overlay: Sound & Indicator */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="rounded-full bg-black/40 px-3 py-1 backdrop-blur-md text-[11px] font-medium text-white/90">
            Reel {currentIndex + 1} de {videoPosts.length}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="pointer-events-auto rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Bottom Left: Creator info & Caption */}
        <div className="absolute bottom-6 left-4 right-16 z-20 text-white pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 mb-2.5">
            <img
              src={currentPost.userAvatar}
              alt={currentPost.userName}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border-2 border-white"
            />
            <div>
              <p className="text-xs font-bold leading-tight drop-shadow-md">{currentPost.userName}</p>
              <p className="text-[11px] text-white/80">@{currentPost.userUsername}</p>
            </div>
          </div>

          <p className="text-xs line-clamp-2 drop-shadow-md text-white/95 mb-2 font-normal leading-relaxed">
            {currentPost.caption}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-white/80">
            <Music2 className="h-3.5 w-3.5 animate-pulse" />
            <span className="truncate">Audio original · Lumix Cinema Sound</span>
          </div>
        </div>

        {/* Right Action Stack */}
        <div className="absolute bottom-14 right-3 z-20 flex flex-col items-center gap-4 text-white">
          {/* Like */}
          <button
            onClick={() => onToggleLike(currentPost)}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
          >
            <div className={`rounded-full p-3 backdrop-blur-md transition-colors ${
              isLiked ? 'bg-rose-600/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}>
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold drop-shadow">{currentPost.likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setIsCommentsDrawerOpen(true)}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
          >
            <div className="rounded-full bg-black/50 p-3 text-white backdrop-blur-md hover:bg-black/70 transition-colors">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold drop-shadow">{currentPost.commentsCount}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleSave(currentPost.id)}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
          >
            <div className={`rounded-full p-3 backdrop-blur-md transition-colors ${
              isSaved ? 'bg-amber-500/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}>
              <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[10px] font-medium drop-shadow">{isSaved ? 'Guardado' : 'Guardar'}</span>
          </button>
        </div>

        {/* Comments Drawer (Slide Up) */}
        {isCommentsDrawerOpen && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="h-3/5 w-full rounded-t-3xl border-t border-neutral-800 bg-neutral-900 p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">
                  Comentarios ({comments.length})
                </span>
                <button
                  onClick={() => setIsCommentsDrawerOpen(false)}
                  className="rounded-full p-1 text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-neutral-500 py-6">
                    Aún no hay comentarios. ¡Sé el primero!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <img
                          src={c.userAvatar}
                          alt={c.userName}
                          referrerPolicy="no-referrer"
                          className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold text-white mr-1.5">{c.userUsername}</span>
                          <span className="text-neutral-300">{c.text}</span>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{timeAgo(c.createdAt)}</p>
                        </div>
                      </div>
                      {currentUser?.id === c.userId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-neutral-600 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-rose-600 p-2 text-white disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Up/Down Navigation floating controls */}
      <div className="hidden lg:flex absolute -right-16 flex-col gap-3">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="rounded-full bg-neutral-900 border border-neutral-800 p-3 text-white hover:bg-neutral-800 disabled:opacity-30 transition-all"
          title="Vídeo anterior (Flecha Arriba)"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === videoPosts.length - 1}
          className="rounded-full bg-neutral-900 border border-neutral-800 p-3 text-white hover:bg-neutral-800 disabled:opacity-30 transition-all"
          title="Siguiente vídeo (Flecha Abajo)"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

    </div>
  );
};
