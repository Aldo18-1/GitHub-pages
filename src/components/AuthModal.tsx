import React, { useState } from 'react';
import { X, UserPlus, LogIn, Lock, Mail, User as UserIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { dbService } from '../db/db';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  availableUsers: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  availableUsers,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [identifier, setIdentifier] = useState<string>(''); // username or email
  const [password, setPassword] = useState<string>('');

  // Register extra states
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('/src/assets/images/avatar_creator_female_1790826614793.jpg');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const users = await dbService.getUsers();
      const cleanIdent = identifier.trim().toLowerCase();
      const user = users.find(
        (u) =>
          u.username.toLowerCase() === cleanIdent ||
          u.email.toLowerCase() === cleanIdent
      );

      if (!user) {
        throw new Error('No se encontró ninguna cuenta con ese usuario o correo.');
      }

      if (user.password && user.password !== password) {
        throw new Error('Contraseña incorrecta. Por favor revisa tus credenciales.');
      }

      dbService.setActiveUserId(user.id);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) throw new Error('Por favor ingresa tu nombre');
      if (!username.trim()) throw new Error('Por favor ingresa un nombre de usuario');
      if (!email.trim() || !email.includes('@')) throw new Error('Ingresa un correo electrónico válido');
      if (!password || password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres');

      const newUser = await dbService.createUser({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        email: email.trim().toLowerCase(),
        password,
        avatar: avatar || '/src/assets/images/avatar_creator_female_1790826614793.jpg',
        bio: bio.trim() || 'Apasionado por la fotografía y el video visual.',
      });

      onAuthSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (user: User) => {
    dbService.setActiveUserId(user.id);
    onAuthSuccess(user);
    onClose();
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-neutral-950 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              mode === 'login'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              mode === 'register'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="ej. sofia_lens o tu@correo.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="Tu contraseña secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-rose-500 disabled:opacity-50"
            >
              {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>

            {/* Quick Demo Switcher */}
            {availableUsers.length > 0 && (
              <div className="pt-4 border-t border-neutral-800">
                <p className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Acceso rápido con cuentas de prueba:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableUsers.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(u)}
                      className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-left hover:border-neutral-700 transition-colors"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{u.name.split(' ')[0]}</p>
                        <p className="text-[10px] text-neutral-500 truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="ej. Mateo Gómez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombre de Usuario (@handle)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-neutral-500 font-mono">@</span>
                <input
                  type="text"
                  required
                  placeholder="mateo_photo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 py-2 pl-7 pr-3 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="mateo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Biografía o Especialidad
              </label>
              <input
                type="text"
                placeholder="ej. Fotografía de viajes, retrato y dron"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-full object-cover border border-neutral-700 shrink-0"
                />
                <label className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors">
                  Subir Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-rose-500 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta y Comenzar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
