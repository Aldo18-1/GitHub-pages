import { FilterType } from '../types';

export const FILTER_CSS_MAP: Record<FilterType, string> = {
  normal: 'none',
  vintage: 'sepia(0.4) contrast(1.15) brightness(0.95) saturate(1.1)',
  noir: 'grayscale(1) contrast(1.3) brightness(0.9)',
  warmth: 'sepia(0.2) saturate(1.4) hue-rotate(-10deg)',
  cyber: 'contrast(1.2) saturate(1.8) hue-rotate(180deg)',
  dramatic: 'contrast(1.4) brightness(0.85) saturate(1.2)',
  cinematic: 'contrast(1.1) brightness(1.05) saturate(1.25) sepia(0.15)',
};

export const FILTER_LABELS: Record<FilterType, string> = {
  normal: 'Original',
  cinematic: 'Cinemático',
  vintage: 'Vintage',
  noir: 'Blanco & Negro',
  warmth: 'Cálido',
  dramatic: 'Dramático',
  cyber: 'Cyberpunk',
};

/**
 * Format relative time in Spanish
 */
export function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `Hace ${diffInWeeks} sem`;
  return past.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Reads a file and returns its Base64 Data URL, optionally resizing high-res images
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's a video, read it directly
    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // For images, optimize max dimension to 1600px to ensure fast IndexedDB storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.88));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates video thumbnail frame
 */
export async function generateVideoThumbnail(videoSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.currentTime = 0.5;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration / 2 || 0.5);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          return;
        }
      } catch (err) {
        console.warn('Could not extract thumbnail', err);
      }
      resolve('');
    };

    video.onerror = () => resolve('');

    // Fallback timer
    setTimeout(() => resolve(''), 3000);
  });
}

/**
 * Creates a synthetic procedural video in WebM format (using Canvas + MediaRecorder)
 * Useful for demoing and testing video posting when the user doesn't have a local video file ready!
 */
export async function createAestheticSampleVideo(type: 'aurora' | 'cyberpunk' | 'golden_hour'): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280; // 9:16 vertical video
    const ctx = canvas.getContext('2d');

    if (!ctx || !('MediaRecorder' in window)) {
      // Fallback
      resolve('');
      return;
    }

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();

    let frame = 0;
    const totalFrames = 90; // 3 seconds at 30fps

    function draw() {
      if (!ctx) return;
      frame++;
      const t = frame * 0.05;

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (type === 'aurora') {
        grad.addColorStop(0, '#041b2d');
        grad.addColorStop(0.5, '#0b3c49');
        grad.addColorStop(1, '#021019');
      } else if (type === 'cyberpunk') {
        grad.addColorStop(0, '#1c032e');
        grad.addColorStop(0.5, '#400c4f');
        grad.addColorStop(1, '#0a0014');
      } else {
        grad.addColorStop(0, '#361500');
        grad.addColorStop(0.5, '#78290f');
        grad.addColorStop(1, '#150600');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated glowing orbs / waves
      for (let i = 0; i < 5; i++) {
        const x = canvas.width / 2 + Math.sin(t + i * 1.3) * (canvas.width * 0.35);
        const y = canvas.height / 2 + Math.cos(t * 0.8 + i) * (canvas.height * 0.3);
        const radius = 120 + Math.sin(t + i) * 50;

        const radial = ctx.createRadialGradient(x, y, 10, x, y, radius);
        if (type === 'aurora') {
          radial.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
          radial.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (type === 'cyberpunk') {
          radial.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
          radial.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          radial.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
          radial.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cinematic center title overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const label = type === 'aurora' ? 'AURORA BOREALIS' : type === 'cyberpunk' ? 'NEON NIGHTS' : 'GOLDEN HORIZON';
      ctx.fillText(label, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Lumix Reel · 4K 60FPS', canvas.width / 2, canvas.height / 2 + 45);

      if (frame < totalFrames) {
        requestAnimationFrame(draw);
      } else {
        mediaRecorder.stop();
      }
    }

    draw();
  });
}
