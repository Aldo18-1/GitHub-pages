import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Trash2,
  Send,
  Camera,
  CheckCircle2,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { Post, User, Comment } from '../types';
import { FILTER_CSS_MAP, timeAgo } from '../utils/mediaUtils';
import { dbService } from '../db/db';

interface FeedViewProps {
  posts: Post[];
  currentUser: User | null;
  creators: User[];
  savedPostIds: string[];
  onToggleLike: (post: Post) => void;
  onToggleSave: (postId: string) => void;
  onSelectCreator: (user: User) => void;
  onRequireAuth: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  currentUser,
  creators,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onSelectCreator,
  onRequireAuth,
  onRefresh,
  onOpenCreate,
}) => {
  // Video player controls state
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(true);

  // Active comments drawer per post
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Double click heart burst state
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null);

  const handleDoubleClickMedia = (post: Post) => {
    setHeartBurstPostId(post.id);
    setTimeout(() => setHeartBurstPostId(null), 800);
    onToggleLike(post);
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
    } else {
      setExpandedCommentsPostId(postId);
      const comments = await dbService.getComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const newComment = await dbService.addComment(
        postId,
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        text
      );

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;
    try {
      await dbService.deleteComment(commentId, postId, currentUser.id);
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (window.confirm('¿Seguro que deseas eliminar esta publicación?')) {
      try {
        await dbService.deletePost(postId, currentUser.id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleShare = (postId: string) => {
    const url = window.location.origin;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${url}#post-${postId}`);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  const handleToggleFollowCreator = async (creatorId: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    await dbService.toggleFollow(currentUser.id, creatorId);
    onRefresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      
      {/* Active Creators Carousel (Stories) */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Creadores de Lumix
          </span>
          <span className="text-[11px] text-neutral-500">
            {creators.length} fotógrafos activos
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
          {/* User's own story button */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenCreate}
              className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-rose-500/80 bg-neutral-950 text-rose-400 hover:border-rose-400 transition-colors"
            >
              <Camera className="h-6 w-6 stroke-[1.8]" />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold shadow-sm">
                +
              </div>
            </button>
            <span className="text-[11px] text-neutral-300 font-medium truncate max-w-[68px]">
              Publicar
            </span>
          </div>

          {/* Creators list */}
          {creators.map((creator) => {
            const isFollowing = currentUser?.followingIds.includes(creator.id);
            return (
              <div
                key={creator.id}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                onClick={() => onSelectCreator(creator)}
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    referrerPolicy="no-referrer"
                    className="h-15 w-15 rounded-full object-cover border-2 border-neutral-900"
                  />
                  {creator.isVerified && (
                    <div className="absolute bottom-0 right-0 rounded-full bg-neutral-900 p-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 fill-sky-500 text-neutral-900" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-neutral-300 font-medium truncate max-w-[68px] text-center">
                  {creator.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Posts Stream */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Aún no hay publicaciones</h3>
          <p className="text-xs text-neutral-400 mb-5 max-w-sm mx-auto">
            Sé el primero en compartir una fotografía o un vídeo con la comunidad de creadores.
          </p>
          <button
            onClick={onOpenCreate}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
          >
            Publicar Ahora
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => {
            const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
            const isSaved = savedPostIds.includes(post.id);
            const isOwner = currentUser?.id === post.userId;
            const isVideo = post.mediaType === 'video';
            const isPlaying = playingVideoId === post.id;
            const isCommentsOpen = expandedCommentsPostId === post.id;
            const commentsList = postComments[post.id] || [];

            return (
              <article
                key={post.id}
                id={`post-${post.id}`}
                className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 shadow-lg overflow-hidden backdrop-blur-sm transition-all"
              >
                
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800/60">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => {
                      const creator = creators.find((c) => c.id === post.userId);
                      if (creator) onSelectCreator(creator);
                    }}
                  >
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-neutral-700/60"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                          {post.userName}
                        </span>
                        <span className="text-xs text-neutral-400">@{post.userUsername}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span>{timeAgo(post.createdAt)}</span>
                        {post.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-neutral-400">
                              <MapPin className="h-3 w-3" />
                              {post.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser && currentUser.id !== post.userId && (
                      <button
                        onClick={() => handleToggleFollowCreator(post.userId)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          currentUser.followingIds.includes(post.userId)
                            ? 'border border-neutral-700 bg-neutral-800/80 text-neutral-300'
                            : 'bg-neutral-100 text-neutral-900 hover:bg-white'
                        }`}
                      >
                        {currentUser.followingIds.includes(post.userId) ? 'Siguiendo' : 'Seguir'}
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-rose-400 transition-colors"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Container */}
                <div
                  className="relative w-full bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
                  onDoubleClick={() => handleDoubleClickMedia(post)}
                >
                  {isVideo ? (
                    <div className="relative w-full flex items-center justify-center bg-black">
                      <video
                        src={post.mediaUrl}
                        loop
                        muted={muted}
                        playsInline
                        className="max-h-[640px] w-full object-contain"
                        style={{ filter: FILTER_CSS_MAP[post.filter] }}
                        ref={(el) => {
                          if (el) {
                            if (isPlaying) {
                              el.play().catch(() => {});
                            } else {
                              el.pause();
                            }
                          }
                        }}
                      />
                      
                      {/* Video playback overlay toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingVideoId(isPlaying ? null : post.id);
                        }}
                        className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${
                          isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                        }`}
                      >
                        <div className="rounded-full bg-black/60 p-4 text-white backdrop-blur-sm hover:scale-110 transition-transform">
                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white" />}
                        </div>
                      </button>

                      {/* Video sound mute/unmute button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMuted(!muted);
                        }}
                        className="absolute bottom-3 right-3 rounded-full bg-black/70 p-2 text-white/90 backdrop-blur-sm hover:bg-black transition-colors"
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      referrerPolicy="no-referrer"
                      className="max-h-[640px] w-full object-contain transition-all"
                      style={{ filter: FILTER_CSS_MAP[post.filter] }}
                    />
                  )}

                  {/* Animated Heart Particle on Double Click */}
                  {heartBurstPostId === post.id && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Heart className="h-24 w-24 fill-rose-500 text-rose-500 animate-ping duration-500 drop-shadow-2xl" />
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Like button */}
                      <button
                        onClick={() => onToggleLike(post)}
                        className="flex items-center gap-1.5 text-neutral-300 hover:text-rose-400 transition-colors group"
                      >
                        <Heart
                          className={`h-5 w-5 transition-transform group-active:scale-125 ${
                            isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'
                          }`}
                        />
                        <span className="text-xs font-semibold tabular-nums">
                          {post.likesCount}
                        </span>
                      </button>

                      {/* Comments toggle */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs font-semibold tabular-nums">
                          {post.commentsCount}
                        </span>
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => handleShare(post.id)}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Copiar enlace"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>

                      {copiedPostId === post.id && (
                        <span className="text-[11px] text-emerald-400 font-medium animate-fade-in">
                          ¡Enlace copiado!
                        </span>
                      )}
                    </div>

                    {/* Bookmark / Save */}
                    <button
                      onClick={() => onToggleSave(post.id)}
                      className="text-neutral-400 hover:text-white transition-colors"
                      title={isSaved ? 'Guardado' : 'Guardar'}
                    >
                      <Bookmark
                        className={`h-5 w-5 ${
                          isSaved ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Caption & Tags */}
                  <div className="mt-3 space-y-1.5 text-xs text-neutral-200 leading-relaxed">
                    <p>
                      <span className="font-semibold text-white mr-2">
                        {post.userUsername}
                      </span>
                      {post.caption}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-rose-400/90 hover:underline cursor-pointer font-medium text-[11px]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.cameraDetails && (
                      <p className="text-[11px] text-neutral-500 font-mono pt-1">
                        📷 {post.cameraDetails}
                      </p>
                    )}
                  </div>

                  {/* Comments Preview or Drawer */}
                  {post.commentsCount > 0 && !isCommentsOpen && (
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="mt-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-300"
                    >
                      Ver los {post.commentsCount} comentarios...
                    </button>
                  )}

                  {/* Expanded Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2.5">
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {commentsList.map((comm) => (
                          <div key={comm.id} className="flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start gap-2">
                              <img
                                src={comm.userAvatar}
                                alt={comm.userName}
                                referrerPolicy="no-referrer"
                                className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                              />
                              <div>
                                <span className="font-semibold text-white mr-1.5">
                                  {comm.userUsername}
                                </span>
                                <span className="text-neutral-300">{comm.text}</span>
                                <p className="text-[10px] text-neutral-500 mt-0.5">
                                  {timeAgo(comm.createdAt)}
                                </p>
                              </div>
                            </div>

                            {currentUser?.id === comm.userId && (
                              <button
                                onClick={() => handleDeleteComment(comm.id, post.id)}
                                className="text-neutral-600 hover:text-rose-400 transition-colors p-1"
                                title="Borrar comentario"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick comment input */}
                  <form
                    onSubmit={(e) => handleAddComment(post.id, e)}
                    className="mt-3 flex items-center gap-2 border-t border-neutral-800/60 pt-2.5"
                  >
                    <input
                      type="text"
                      placeholder="Añade un comentario..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!commentInputs[post.id]?.trim()}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-400 disabled:opacity-40 transition-opacity"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>

                </div>

              </article>
            );
          })}
        </div>
      )}

    </div>
  );
};
