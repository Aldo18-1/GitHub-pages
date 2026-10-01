import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Film,
  Sparkles,
  MapPin,
  Sliders,
  Check,
  Video,
  Play,
  RotateCcw,
} from 'lucide-react';
import { User, MediaType, FilterType, AspectRatioType } from '../types';
import { dbService } from '../db/db';
import {
  FILTER_CSS_MAP,
  FILTER_LABELS,
  fileToDataUrl,
  generateVideoThumbnail,
  createAestheticSampleVideo,
} from '../utils/mediaUtils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPostCreated: () => void;
  onRequireAuth: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  onRequireAuth,
}) => {
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('4:5');
  const [filter, setFilter] = useState<FilterType>('normal');
  const [caption, setCaption] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [cameraDetails, setCameraDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const streamObjectRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleStartCamera = async () => {
    try {
      setError('');
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamObjectRef.current = stream;
      if (videoStreamRef.current) {
        videoStreamRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setError('No se pudo acceder a la cámara. Por favor autoriza el permiso o usa la subida de archivos.');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamObjectRef.current) {
      streamObjectRef.current.getTracks().forEach((t) => t.stop());
      streamObjectRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureCamera = () => {
    if (!videoStreamRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoStreamRef.current.videoWidth || 1280;
    canvas.height = videoStreamRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoStreamRef.current, 0, 0, canvas.width, canvas.height);
      const captured = canvas.toDataURL('image/jpeg', 0.9);
      setMediaUrl(captured);
      setMediaType('photo');
    }
    handleStopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');
    if (isVideo && (aspectRatio === '1:1' || aspectRatio === '4:5')) {
      setAspectRatio('9:16');
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setMediaUrl(dataUrl);

      if (isVideo) {
        const thumb = await generateVideoThumbnail(dataUrl);
        setThumbnailUrl(thumb);
      }
    } catch (err: any) {
      setError('Error al procesar el archivo.');
    }
  };

  const handleGenerateSampleVideo = async (sampleType: 'aurora' | 'cyberpunk' | 'golden_hour') => {
    setError('');
    setIsSubmitting(true);
    try {
      setMediaType('video');
      setAspectRatio('9:16');
      const videoDataUrl = await createAestheticSampleVideo(sampleType);
      setMediaUrl(videoDataUrl);
      const thumb = await generateVideoThumbnail(videoDataUrl);
      setThumbnailUrl(thumb);
    } catch (err: any) {
      setError('Error al generar vídeo de muestra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!mediaUrl) {
      setError('Por favor selecciona una foto o un vídeo antes de publicar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Process tags
      const cleanTags = tagsInput
        .split(/[,\s#]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await dbService.createPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userUsername: currentUser.username,
        userAvatar: currentUser.avatar,
        mediaType,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || (mediaType === 'photo' ? mediaUrl : undefined),
        aspectRatio,
        filter,
        caption: caption.trim(),
        tags: cleanTags,
        location: location.trim() || undefined,
        cameraDetails: cameraDetails.trim() || undefined,
      });

      handleStopCamera();
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la publicación en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16]';
      default:
        return 'aspect-[4/5]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              {mediaType === 'photo' ? <Camera className="h-4 w-4" /> : <Film className="h-4 w-4" />}
            </div>
            <h2 className="text-base font-semibold text-white font-display">
              Nueva Publicación de {mediaType === 'photo' ? 'Foto' : 'Vídeo'}
            </h2>
          </div>
          <button
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Media Preview & Pickers (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              
              {/* Media Container */}
              <div className="relative w-full max-h-[460px] flex items-center justify-center rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden">
                {isCameraActive ? (
                  <div className="relative w-full h-[400px] flex flex-col items-center justify-center bg-black">
                    <video
                      ref={videoStreamRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCaptureCamera}
                        className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-rose-500 transition-all active:scale-95"
                      >
                        <Camera className="h-4 w-4" />
                        Capturar Foto
                      </button>
                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="rounded-full bg-neutral-800/80 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : mediaUrl ? (
                  <div className="relative w-full flex items-center justify-center p-2">
                    <div className={`relative max-w-full max-h-[420px] rounded-lg overflow-hidden ${getAspectClass()}`}>
                      {mediaType === 'photo' ? (
                        <img
                          src={mediaUrl}
                          alt="Previsualización"
                          className="w-full h-full object-cover transition-all"
                          style={{ filter: FILTER_CSS_MAP[filter] }}
                        />
                      ) : (
                        <video
                          src={mediaUrl}
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ filter: FILTER_CSS_MAP[filter] }}
                        />
                      )}

                      {/* Clear media button */}
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrl('');
                          setThumbnailUrl('');
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black hover:text-white transition-colors"
                        title="Cambiar archivo"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 px-6 text-center flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 mb-4">
                      <Upload className="h-7 w-7 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      Arrastra y suelta tu foto o vídeo aquí
                    </p>
                    <p className="text-xs text-neutral-400 mb-5 max-w-xs">
                      Soporta JPG, PNG, WEBP, GIF, MP4 y WebM. Guardado de forma persistente en tu base de datos local.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <label className="cursor-pointer flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors border border-neutral-700">
                        <Upload className="h-4 w-4" />
                        Examinar Archivos
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors border border-neutral-700"
                      >
                        <Camera className="h-4 w-4" />
                        Usar Cámara
                      </button>
                    </div>

                    {/* Pre-made aesthetic sample videos */}
                    <div className="mt-6 pt-5 border-t border-neutral-800/80 w-full">
                      <p className="text-[11px] font-medium text-neutral-400 mb-2 flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        ¿No tienes un vídeo a mano? Genera una muestra cinemática:
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleGenerateSampleVideo('aurora')}
                          className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:border-emerald-500/50 transition-colors"
                        >
                          Vídeo Aurora 9:16
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleGenerateSampleVideo('cyberpunk')}
                          className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[11px] font-medium text-fuchsia-400 hover:border-fuchsia-500/50 transition-colors"
                        >
                          Vídeo Neon 9:16
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleGenerateSampleVideo('golden_hour')}
                          className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[11px] font-medium text-amber-400 hover:border-amber-500/50 transition-colors"
                        >
                          Vídeo Sunset 9:16
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio & Filter Selector */}
              {mediaUrl && (
                <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5" /> Proporción:
                    </span>
                    <div className="flex items-center gap-1">
                      {(['1:1', '4:5', '16:9', '9:16'] as AspectRatioType[]).map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            aspectRatio === ar
                              ? 'bg-rose-600 text-white'
                              : 'bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-neutral-400 block mb-2">
                      Filtro de Color:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFilter(f)}
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
                            filter === f
                              ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          {FILTER_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Post Metadata (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                
                {/* User info preview */}
                {currentUser && (
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-neutral-400">@{currentUser.username}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Descripción / Pie de foto
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escribe la historia detrás de esta fotografía o vídeo..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 p-3 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Etiquetas / Hashtags
                  </label>
                  <input
                    type="text"
                    placeholder="paisaje, cine, arquitectura, barcelona, noche"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Separa por comas o espacios. Se crearán etiquetas automáticas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Ubicación (opcional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="ej. Patagonia, Chile o Tokio, Japón"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Equipo / Cámara (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Sony A7IV · 35mm f/1.4 · ISO 100"
                    value={cameraDetails}
                    onChange={(e) => setCameraDetails(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  disabled={isSubmitting || !mediaUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {isSubmitting ? 'Guardando en Base de Datos...' : 'Publicar Ahora'}
                </button>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};
