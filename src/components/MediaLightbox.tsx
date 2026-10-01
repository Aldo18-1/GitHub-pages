import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  Camera,
  Trash2,
  Send,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Post, User, Comment } from '../types';
import { FILTER_CSS_MAP, timeAgo } from '../utils/mediaUtils';
import { dbService } from '../db/db';

interface MediaLightboxProps {
  post: Post | null;
  onClose: () => void;
  currentUser: User | null;
  savedPostIds: string[];
  onToggleLike: (post: Post) => void;
  onToggleSave: (postId: string) => void;
  onSelectCreator: (user: User) => void;
  onRequireAuth: () => void;
  onRefresh: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  post,
  onClose,
  currentUser,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onSelectCreator,
  onRequireAuth,
  onRefresh,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);

  useEffect(() => {
    if (post) {
      dbService.getComments(post.id).then(setComments);
    }
  }, [post]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!post) return null;

  const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
  const isSaved = savedPostIds.includes(post.id);
  const isVideo = post.mediaType === 'video';

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim()) return;

    try {
      const newComment = await dbService.addComment(
        post.id,
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
    if (!currentUser) return;
    try {
      await dbService.deleteComment(commentId, post.id, currentUser.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col lg:flex-row h-full max-h-[90vh] w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 rounded-full bg-black/70 p-2 text-white/90 hover:bg-black hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media Left Column */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
          {isVideo ? (
            <div className="relative h-full w-full flex items-center justify-center">
              <video
                src={post.mediaUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                controls
                className="max-h-[85vh] w-full object-contain"
                style={{ filter: FILTER_CSS_MAP[post.filter] }}
              />
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 left-4 rounded-full bg-black/70 p-2 text-white hover:bg-black transition-colors"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-full object-contain"
              style={{ filter: FILTER_CSS_MAP[post.filter] }}
            />
          )}
        </div>

        {/* Info & Comments Right Column */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900">
          
          {/* Author Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={post.userAvatar}
                alt={post.userName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover border border-neutral-700"
              />
              <div>
                <p className="text-xs font-semibold text-white">{post.userName}</p>
                <p className="text-[11px] text-neutral-400">@{post.userUsername}</p>
              </div>
            </div>
          </div>

          {/* Caption & Metadata */}
          <div className="p-4 border-b border-neutral-800/80 space-y-2">
            <p className="text-xs text-neutral-200 leading-relaxed">{post.caption}</p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-rose-400 text-[11px] font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-1 text-[11px] text-neutral-400 space-y-1">
              {post.location && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-neutral-500" /> {post.location}
                </p>
              )}
              {post.cameraDetails && (
                <p className="flex items-center gap-1.5 font-mono text-[10px]">
                  <Camera className="h-3 w-3 text-neutral-500" /> {post.cameraDetails}
                </p>
              )}
              <p className="text-neutral-500">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Comentarios ({comments.length})
            </span>
            {comments.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-4">No hay comentarios aún.</p>
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
                      className="text-neutral-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action Row */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggleLike(post)}
                  className="flex items-center gap-1.5 text-neutral-300 hover:text-rose-400 transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'
                    }`}
                  />
                  <span className="text-xs font-semibold tabular-nums">{post.likesCount}</span>
                </button>
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-semibold tabular-nums">{comments.length}</span>
                </div>
              </div>

              <button
                onClick={() => onToggleSave(post.id)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Bookmark
                  className={`h-5 w-5 ${
                    isSaved ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'
                  }`}
                />
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Añade un comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-lg bg-rose-600 p-2 text-white hover:bg-rose-500 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
