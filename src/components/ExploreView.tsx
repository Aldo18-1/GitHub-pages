import React, { useState, useMemo } from 'react';
import { Search, Film, Heart, MessageCircle, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { Post, User } from '../types';
import { FILTER_CSS_MAP } from '../utils/mediaUtils';

interface ExploreViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ posts, onSelectPost }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todo' },
    { id: 'photos', label: 'Fotografía' },
    { id: 'videos', label: 'Vídeos' },
    { id: 'naturaleza', label: 'Naturaleza' },
    { id: 'urbano', label: 'Urbano & Arquitectura' },
    { id: 'retrato', label: 'Retratos' },
    { id: 'cine', label: 'Cinemático' },
  ];

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      if (selectedCategory === 'photos' && post.mediaType !== 'photo') return false;
      if (selectedCategory === 'videos' && post.mediaType !== 'video') return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'photos' &&
        selectedCategory !== 'videos'
      ) {
        const matchesTag = post.tags.some(
          (t) =>
            t.toLowerCase().includes(selectedCategory) ||
            selectedCategory.includes(t.toLowerCase())
        );
        const matchesCaption = post.caption.toLowerCase().includes(selectedCategory);
        if (!matchesTag && !matchesCaption) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          post.caption.toLowerCase().includes(query) ||
          post.userName.toLowerCase().includes(query) ||
          post.userUsername.toLowerCase().includes(query) ||
          (post.location && post.location.toLowerCase().includes(query)) ||
          post.tags.some((t) => t.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Search & Filters Header */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por fotógrafo, etiqueta (#paisaje), lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 backdrop-blur-sm"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Results */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center my-8">
          <ImageIcon className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
          <p className="text-sm font-semibold text-white mb-1">
            No se encontraron publicaciones
          </p>
          <p className="text-xs text-neutral-400">
            Intenta con otra palabra clave o selecciona la categoría "Todo".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPosts.map((post, idx) => {
            const isVideo = post.mediaType === 'video';
            const isFeatured = idx % 7 === 0;

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`group relative overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800/80 cursor-pointer transition-all hover:scale-[1.01] hover:border-neutral-700 shadow-md ${
                  isFeatured ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
                style={{
                  minHeight: isFeatured ? '360px' : '200px',
                  aspectRatio: isFeatured ? '16/10' : '1/1',
                }}
              >
                {isVideo ? (
                  <video
                    src={post.mediaUrl}
                    poster={post.thumbnailUrl}
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ filter: FILTER_CSS_MAP[post.filter] }}
                    onMouseEnter={(e) => {
                      const video = e.currentTarget;
                      video.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ filter: FILTER_CSS_MAP[post.filter] }}
                    loading="lazy"
                  />
                )}

                {/* Media Type Badge */}
                {isVideo && (
                  <div className="absolute top-2.5 right-2.5 rounded-md bg-black/60 backdrop-blur-sm p-1.5 text-white shadow">
                    <Film className="h-3.5 w-3.5" />
                  </div>
                )}

                {/* Hover Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 text-white">
                  <p className="text-xs font-semibold line-clamp-1 mb-1">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="font-medium truncate max-w-[120px]">
                      @{post.userUsername}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold">
                        <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <MessageCircle className="h-3 w-3" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
