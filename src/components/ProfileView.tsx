import React, { useState } from 'react';
import {
  MapPin,
  Globe,
  Calendar,
  Grid,
  Film,
  Bookmark,
  CheckCircle2,
  Edit3,
  UserPlus,
  UserCheck,
  X,
  Upload,
} from 'lucide-react';
import { User, Post } from '../types';
import { FILTER_CSS_MAP } from '../utils/mediaUtils';
import { dbService } from '../db/db';

interface ProfileViewProps {
  user: User;
  currentUser: User | null;
  posts: Post[];
  savedPostIds: string[];
  onSelectPost: (post: Post) => void;
  onRefresh: () => void;
  onRequireAuth: () => void;
  onUpdateCurrentUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  posts,
  savedPostIds,
  onSelectPost,
  onRefresh,
  onRequireAuth,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos' | 'saved'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Edit form states
  const [editName, setEditName] = useState<string>(user.name);
  const [editBio, setEditBio] = useState<string>(user.bio || '');
  const [editLocation, setEditLocation] = useState<string>(user.location || '');
  const [editWebsite, setEditWebsite] = useState<string>(user.website || '');
  const [editAvatar, setEditAvatar] = useState<string>(user.avatar);

  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = currentUser ? currentUser.followingIds.includes(user.id) : false;

  const userPosts = posts.filter((p) => p.userId === user.id);
  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));

  const displayedPosts = () => {
    switch (activeTab) {
      case 'photos':
        return userPosts.filter((p) => p.mediaType === 'photo');
      case 'videos':
        return userPosts.filter((p) => p.mediaType === 'video');
      case 'saved':
        return savedPosts;
      default:
        return userPosts;
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    await dbService.toggleFollow(currentUser.id, user.id);
    onRefresh();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      bio: editBio.trim(),
      location: editLocation.trim() || undefined,
      website: editWebsite.trim() || undefined,
      avatar: editAvatar,
    };

    await dbService.updateUser(updatedUser);
    onUpdateCurrentUser(updatedUser);
    setIsEditModalOpen(false);
    onRefresh();
  };

  const currentDisplayed = displayedPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Profile Header */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-md mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar with gradient glow */}
          <div className="relative shrink-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shadow-xl">
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-full object-cover border-4 border-neutral-900"
              />
            </div>
            {user.isVerified && (
              <div className="absolute bottom-1 right-1 rounded-full bg-neutral-900 p-1">
                <CheckCircle2 className="h-5 w-5 fill-sky-500 text-neutral-900" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center justify-center sm:justify-start gap-2">
                  {user.name}
                </h1>
                <p className="text-xs text-neutral-400 font-mono">@{user.username}</p>
              </div>

              {/* Action Button */}
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar Perfil
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition-all ${
                    isFollowing
                      ? 'border border-neutral-700 bg-neutral-800 text-neutral-300'
                      : 'bg-rose-600 text-white shadow-lg hover:bg-rose-500'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Siguiendo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Seguir
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Meta details */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-neutral-400 pt-1">
              {user.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-rose-400 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {user.website.replace('https://', '')}
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                Miembro desde 2026
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center sm:justify-start gap-8 pt-3 border-t border-neutral-800">
              <div className="text-center sm:text-left">
                <span className="block text-base font-bold text-white tabular-nums">
                  {userPosts.length}
                </span>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider">
                  Publicaciones
                </span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-base font-bold text-white tabular-nums">
                  {user.followersCount}
                </span>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider">
                  Seguidores
                </span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-base font-bold text-white tabular-nums">
                  {user.followingIds?.length || 0}
                </span>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider">
                  Siguiendo
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center border-b border-neutral-800 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-rose-500 text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid className="h-4 w-4" />
          Todo ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'photos'
              ? 'border-b-2 border-rose-500 text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Fotos ({userPosts.filter((p) => p.mediaType === 'photo').length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'videos'
              ? 'border-b-2 border-rose-500 text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Film className="h-4 w-4" />
          Vídeos ({userPosts.filter((p) => p.mediaType === 'video').length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'saved'
                ? 'border-b-2 border-rose-500 text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Guardados ({savedPosts.length})
          </button>
        )}
      </div>

      {/* Media Grid */}
      {currentDisplayed.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <p className="text-sm font-medium">No hay publicaciones en esta sección</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {currentDisplayed.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer shadow"
            >
              {post.mediaType === 'video' ? (
                <video
                  src={post.mediaUrl}
                  poster={post.thumbnailUrl}
                  muted
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ filter: FILTER_CSS_MAP[post.filter] }}
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ filter: FILTER_CSS_MAP[post.filter] }}
                />
              )}

              {post.mediaType === 'video' && (
                <div className="absolute top-2 right-2 rounded bg-black/60 p-1 text-white">
                  <Film className="h-3.5 w-3.5" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-semibold">
                <span>❤️ {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-semibold text-white mb-4">Editar Perfil</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={editAvatar}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full object-cover border border-neutral-700"
                />
                <label className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Cambiar Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Biografía</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="ej. Madrid, España"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Sitio Web</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://tudominio.com"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
