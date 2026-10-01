import React, { useState } from 'react';
import { Camera, Film, Compass, Database, Plus, LogIn, User as UserIcon, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: 'feed' | 'reels' | 'explore' | 'profile' | 'database';
  setCurrentTab: (tab: 'feed' | 'reels' | 'explore' | 'profile' | 'database') => void;
  currentUser: User | null;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectUserForProfile: (user: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenCreate,
  onOpenAuth,
  onLogout,
  onSelectUserForProfile,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setCurrentTab('feed')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-rose-600 text-white shadow-sm shadow-rose-500/20">
            <Camera className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="font-display text-xl tracking-tight">Lumix Media</span>
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-6">
          <button
            onClick={() => setCurrentTab('feed')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'feed'
                ? 'text-white border-b-2 border-rose-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </button>

          <button
            onClick={() => setCurrentTab('reels')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'reels'
                ? 'text-white border-b-2 border-rose-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Reels</span>
          </button>

          <button
            onClick={() => setCurrentTab('explore')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'explore'
                ? 'text-white border-b-2 border-rose-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explorar</span>
          </button>

          <button
            onClick={() => setCurrentTab('database')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'database'
                ? 'text-white border-b-2 border-rose-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Base de Datos</span>
          </button>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-500 active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Publicar</span>
          </button>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-700/60 p-0.5 transition-colors hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title={currentUser.name}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover"
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl z-40">
                    <div className="border-b border-neutral-800 px-3 py-2">
                      <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
                        <span className="truncate">{currentUser.name}</span>
                        {currentUser.isVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 fill-sky-500 text-neutral-900 shrink-0" />
                        )}
                      </div>
                      <p className="truncate text-xs text-neutral-400">@{currentUser.username}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectUserForProfile(currentUser);
                          setCurrentTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-neutral-400" />
                        Mi Perfil
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('database');
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        <Database className="h-4 w-4 text-neutral-400" />
                        Base de Datos & GitHub
                      </button>
                    </div>

                    <div className="border-t border-neutral-800 pt-1">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-rose-400" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <LogIn className="h-4 w-4" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
