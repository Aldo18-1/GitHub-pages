import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FeedView } from './components/FeedView';
import { ReelsView } from './components/ReelsView';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { DatabaseModal } from './components/DatabaseModal';
import { CreatePostModal } from './components/CreatePostModal';
import { AuthModal } from './components/AuthModal';
import { MediaLightbox } from './components/MediaLightbox';
import { dbService } from './db/db';
import { User, Post } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'feed' | 'reels' | 'explore' | 'profile' | 'database'>('feed');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [lightboxPost, setLightboxPost] = useState<Post | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      await dbService.initialize();
      const loadedUsers = await dbService.getUsers();
      const loadedPosts = await dbService.getPosts();
      const activeUser = await dbService.getActiveUser();

      setUsers(loadedUsers);
      setPosts(loadedPosts);
      setCurrentUser(activeUser);

      if (activeUser) {
        const saved = await dbService.getSavedPostIds(activeUser.id);
        setSavedPostIds(saved);
      } else {
        setSavedPostIds([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle like toggle
  const handleToggleLike = async (post: Post) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const { likesCount, isLiked } = await dbService.toggleLikePost(post.id, currentUser.id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) {
            const newLikedBy = isLiked
              ? [...p.likedBy, currentUser.id]
              : p.likedBy.filter((id) => id !== currentUser.id);
            return { ...p, likesCount, likedBy: newLikedBy };
          }
          return p;
        })
      );
      if (lightboxPost && lightboxPost.id === post.id) {
        setLightboxPost((prev) =>
          prev
            ? {
                ...prev,
                likesCount,
                likedBy: isLiked
                  ? [...prev.likedBy, currentUser.id]
                  : prev.likedBy.filter((id) => id !== currentUser.id),
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle bookmark toggle
  const handleToggleSave = async (postId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const isSaved = await dbService.toggleSavePost(currentUser.id, postId);
      setSavedPostIds((prev) =>
        isSaved ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
      showToast(isSaved ? 'Publicación guardada' : 'Publicación eliminada de guardados');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle select creator profile
  const handleSelectCreator = (user: User) => {
    setSelectedProfileUser(user);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle user logout
  const handleLogout = () => {
    dbService.setActiveUserId(null);
    setCurrentUser(null);
    setSavedPostIds([]);
    showToast('Has cerrado sesión');
  };

  // Handle successful auth
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
    showToast(`¡Bienvenido de vuelta, ${user.name.split(' ')[0]}!`);
  };

  // Target user for Profile tab
  const activeProfileUser = selectedProfileUser || currentUser || users[0] || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-neutral-700 bg-neutral-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Navigation Top Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'profile' && !selectedProfileUser && currentUser) {
            setSelectedProfileUser(currentUser);
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenCreate={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsCreateOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onSelectUserForProfile={(u) => {
          setSelectedProfileUser(u);
          setCurrentTab('profile');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'feed' && (
          <FeedView
            posts={posts}
            currentUser={currentUser}
            creators={users}
            savedPostIds={savedPostIds}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
            onSelectCreator={handleSelectCreator}
            onRequireAuth={() => setIsAuthOpen(true)}
            onRefresh={loadData}
            onOpenCreate={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsCreateOpen(true);
            }}
          />
        )}

        {currentTab === 'reels' && (
          <ReelsView
            posts={posts}
            currentUser={currentUser}
            savedPostIds={savedPostIds}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
            onSelectCreator={handleSelectCreator}
            onRequireAuth={() => setIsAuthOpen(true)}
            onOpenCreate={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsCreateOpen(true);
            }}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'explore' && (
          <ExploreView
            posts={posts}
            onSelectPost={(post) => setLightboxPost(post)}
          />
        )}

        {currentTab === 'profile' && activeProfileUser && (
          <ProfileView
            user={activeProfileUser}
            currentUser={currentUser}
            posts={posts}
            savedPostIds={savedPostIds}
            onSelectPost={(post) => setLightboxPost(post)}
            onRefresh={loadData}
            onRequireAuth={() => setIsAuthOpen(true)}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              if (selectedProfileUser?.id === updated.id) {
                setSelectedProfileUser(updated);
              }
            }}
          />
        )}

        {currentTab === 'database' && (
          <DatabaseModal onDataChanged={loadData} />
        )}
      </main>

      {/* Create Photo / Video Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onPostCreated={() => {
          loadData();
          showToast('¡Tu publicación ha sido creada y guardada con éxito!');
        }}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        availableUsers={users}
      />

      {/* Fullscreen Media Lightbox */}
      <MediaLightbox
        post={lightboxPost}
        onClose={() => setLightboxPost(null)}
        currentUser={currentUser}
        savedPostIds={savedPostIds}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onSelectCreator={handleSelectCreator}
        onRequireAuth={() => setIsAuthOpen(true)}
        onRefresh={loadData}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Lumix Media · Plataforma autónoma de fotografía y vídeo lista para GitHub</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setCurrentTab('database')}
              className="hover:text-white transition-colors"
            >
              Base de Datos
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (!currentUser) setIsAuthOpen(true);
                else handleLogout();
              }}
              className="hover:text-white transition-colors"
            >
              {currentUser ? 'Cerrar Sesión' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
