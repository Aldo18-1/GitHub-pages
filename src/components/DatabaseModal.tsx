import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  GitBranch,
  Github,
  CheckCircle,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import { dbService } from '../db/db';
import { AppDatabase } from '../types';

interface DatabaseModalProps {
  onDataChanged: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ onDataChanged }) => {
  const [stats, setStats] = useState({
    usersCount: 0,
    postsCount: 0,
    commentsCount: 0,
    photosCount: 0,
    videosCount: 0,
  });
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadStats = async () => {
    try {
      const users = await dbService.getUsers();
      const posts = await dbService.getPosts();
      let commentsCount = 0;
      for (const p of posts) {
        commentsCount += p.commentsCount || 0;
      }
      setStats({
        usersCount: users.length,
        postsCount: posts.length,
        commentsCount,
        photosCount: posts.filter((p) => p.mediaType === 'photo').length,
        videosCount: posts.filter((p) => p.mediaType === 'video').length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExportJSON = async () => {
    try {
      const fullDB = await dbService.exportFullDatabase();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDB, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `lumix_database_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setMessage({ text: '¡Base de datos exportada con éxito como archivo .json!', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: 'Error al exportar la base de datos.', type: 'error' });
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json: AppDatabase = JSON.parse(event.target?.result as string);
        await dbService.importFullDatabase(json);
        await loadStats();
        onDataChanged();
        setMessage({ text: '¡Base de datos importada y sincronizada correctamente!', type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      } catch (err: any) {
        setMessage({ text: 'El archivo JSON no tiene un formato válido de base de datos.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactory = async () => {
    if (window.confirm('¿Deseas restaurar la base de datos inicial con los usuarios y fotos de muestra?')) {
      setIsResetting(true);
      try {
        await dbService.resetDatabaseToFactory();
        await loadStats();
        onDataChanged();
        setMessage({ text: 'Base de datos restaurada a valores iniciales de fábrica.', type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      } catch (err) {
        setMessage({ text: 'Error al restablecer la base de datos.', type: 'error' });
      } finally {
        setIsResetting(false);
      }
    }
  };

  const copyToClipboard = (text: string, stepId: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    }
  };

  const gitCommands = `# 1. Inicializar git en la raíz del proyecto
git init
git add .
git commit -m "feat: Red social Lumix completa con fotos, vídeos y base de datos"

# 2. Conectar con tu repositorio de GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            <Database className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">
            Base de Datos & Publicación en GitHub
          </h1>
        </div>
        <p className="text-xs text-neutral-400 max-w-2xl">
          Esta aplicación funciona 100% de manera autónoma con una base de datos local y persistente (IndexedDB + JSON).
          Está lista para ser subida y publicada directamente en GitHub o GitHub Pages sin requerir servidores de pago.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 text-xs font-medium border animate-in fade-in ${
            message.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Usuarios Registrados
          </span>
          <span className="text-2xl font-bold text-white tabular-nums">{stats.usersCount}</span>
          <p className="text-[10px] text-neutral-500 mt-1">Con contraseñas y perfiles</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Publicaciones Totales
          </span>
          <span className="text-2xl font-bold text-white tabular-nums">{stats.postsCount}</span>
          <p className="text-[10px] text-neutral-500 mt-1">
            {stats.photosCount} fotos · {stats.videosCount} vídeos
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Comentarios Activos
          </span>
          <span className="text-2xl font-bold text-white tabular-nums">{stats.commentsCount}</span>
          <p className="text-[10px] text-neutral-500 mt-1">En tiempo real</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Motor de Almacenamiento
          </span>
          <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-4 w-4" /> IndexedDB
          </span>
          <p className="text-[10px] text-neutral-500 mt-1">Nativo & Sin límites de 5MB</p>
        </div>
      </div>

      {/* Database Management Actions */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white font-display flex items-center gap-2">
          <Layers className="h-4 w-4 text-rose-500" />
          Operaciones de Base de Datos
        </h2>
        <p className="text-xs text-neutral-400">
          Puedes respaldar todos los usuarios, publicaciones, fotos y vídeos en un archivo <code className="text-rose-400">database.json</code>,
          importar un archivo existente o restablecer a los datos iniciales de fábrica.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Base de Datos (.JSON)
          </button>

          <label className="cursor-pointer flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors">
            <Upload className="h-4 w-4" />
            Importar Archivo JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetFactory}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
            Restablecer a Datos de Fábrica
          </button>
        </div>
      </div>

      {/* GitHub Deployment Guide */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-neutral-950">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Cómo Publicar este Proyecto Directamente en GitHub
              </h2>
              <p className="text-xs text-neutral-400">
                Todo el código, flujos de GitHub Actions y base de datos inicial ya están creados en este repositorio.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">
                1
              </span>
              Subir los archivos a tu cuenta de GitHub mediante Git:
            </span>
            <button
              onClick={() => copyToClipboard(gitCommands, 1)}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white"
            >
              {copiedStep === 1 ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar comandos
                </>
              )}
            </button>
          </div>
          <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {gitCommands}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">
              2
            </span>
            Publicación Gratuita con GitHub Pages:
          </span>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300 space-y-2">
            <p>
              1. En tu repositorio de GitHub, haz clic en la pestaña <strong className="text-white">Settings</strong> (Ajustes).
            </p>
            <p>
              2. En el menú lateral izquierdo, ve a <strong className="text-white">Pages</strong>.
            </p>
            <p>
              3. En la sección <strong className="text-white">Build and deployment &gt; Source</strong>, selecciona <strong className="text-rose-400">GitHub Actions</strong>.
            </p>
            <p className="text-neutral-400 text-[11px]">
              El archivo <code className="text-neutral-200">.github/workflows/deploy.yml</code> que hemos configurado compilará y publicará la web automáticamente en <code className="text-rose-400 font-mono">https://tu-usuario.github.io/tu-repo/</code> con certificado SSL gratis.
            </p>
          </div>
        </div>

        {/* Architecture details */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">
              3
            </span>
            Estructura de archivos y persistencia de base de datos incluida:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <span className="font-semibold text-white block mb-1">
                📁 /src/db/initialData.json
              </span>
              <p className="text-[11px] text-neutral-400">
                Archivo semilla con los usuarios iniciales, publicaciones y comentarios que se siembran al clonar el repositorio.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <span className="font-semibold text-white block mb-1">
                📁 /src/db/db.ts
              </span>
              <p className="text-[11px] text-neutral-400">
                Motor IndexedDB TypeScript con CRUD completo para usuarios, contraseñas, fotos, vídeos, me gusta, comentarios y copias de seguridad.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
