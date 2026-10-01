import initialData from './initialData.json';
import { User, Post, Comment, AppDatabase } from '../types';

const DB_NAME = 'LumixMediaDB';
const DB_VERSION = 1;
const CURRENT_USER_KEY = 'lumix_active_user_id';

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: false });
        }

        // Posts store
        if (!db.objectStoreNames.contains('posts')) {
          const postStore = db.createObjectStore('posts', { keyPath: 'id' });
          postStore.createIndex('userId', 'userId', { unique: false });
          postStore.createIndex('createdAt', 'createdAt', { unique: false });
          postStore.createIndex('mediaType', 'mediaType', { unique: false });
        }

        // Comments store
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('postId', 'postId', { unique: false });
        }

        // Saved Posts store
        if (!db.objectStoreNames.contains('saved_posts')) {
          const savedStore = db.createObjectStore('saved_posts', { keyPath: 'id' });
          savedStore.createIndex('userId', 'userId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Initializes the database with seed data if empty
   */
  async initialize(): Promise<void> {
    const db = await this.openDB();
    const usersCount = await this.count(db, 'users');

    if (usersCount === 0) {
      console.log('Seeding initial Lumix Media database from initialData.json...');
      await this.seedFromData(initialData as AppDatabase);
    }

    // Ensure there is a default active user logged in if none selected
    const activeUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (!activeUserId) {
      const firstUser = (initialData.users && initialData.users[0]) ? initialData.users[0].id : '';
      if (firstUser) {
        localStorage.setItem(CURRENT_USER_KEY, firstUser);
      }
    }
  }

  private count(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  private seedFromData(data: AppDatabase): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const db = await this.openDB();
      const tx = db.transaction(['users', 'posts', 'comments', 'saved_posts'], 'readwrite');

      const userStore = tx.objectStore('users');
      data.users.forEach((u) => userStore.put(u));

      const postStore = tx.objectStore('posts');
      data.posts.forEach((p) => postStore.put(p));

      const commentStore = tx.objectStore('comments');
      data.comments.forEach((c) => commentStore.put(c));

      const savedStore = tx.objectStore('saved_posts');
      if (data.savedPostIdsByUser) {
        Object.entries(data.savedPostIdsByUser).forEach(([userId, postIds]) => {
          postIds.forEach((postId) => {
            savedStore.put({ id: `${userId}_${postId}`, userId, postId });
          });
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /* ---------------- USER METHODS ---------------- */

  async getUsers(): Promise<User[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const index = store.index('username');
      const req = index.get(username.toLowerCase().trim());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'followersCount' | 'followingIds'>): Promise<User> {
    const db = await this.openDB();
    const newUser: User = {
      ...userData,
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: userData.username.toLowerCase().trim(),
      followersCount: 0,
      followingIds: [],
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');
      const req = store.add(newUser);
      req.onsuccess = () => {
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        resolve(newUser);
      };
      req.onerror = () => reject(new Error('El nombre de usuario o correo ya está en uso.'));
    });
  }

  async updateUser(user: User): Promise<User> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['users', 'posts'], 'readwrite');
      const userStore = tx.objectStore('users');
      userStore.put(user);

      // Also update author info in their posts
      const postStore = tx.objectStore('posts');
      const index = postStore.index('userId');
      const req = index.openCursor(IDBKeyRange.only(user.id));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          const post: Post = cursor.value;
          post.userName = user.name;
          post.userUsername = user.username;
          post.userAvatar = user.avatar;
          cursor.update(post);
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(user);
      tx.onerror = () => reject(tx.error);
    });
  }

  getActiveUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
  }

  setActiveUserId(userId: string | null): void {
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  async getActiveUser(): Promise<User | null> {
    const id = this.getActiveUserId();
    if (!id) return null;
    return this.getUserById(id);
  }

  /* ---------------- POST METHODS ---------------- */

  async getPosts(options?: {
    userId?: string;
    mediaType?: 'photo' | 'video';
    tag?: string;
    searchQuery?: string;
  }): Promise<Post[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readonly');
      const store = tx.objectStore('posts');
      const req = store.getAll();

      req.onsuccess = () => {
        let posts: Post[] = req.result || [];

        if (options?.userId) {
          posts = posts.filter((p) => p.userId === options.userId);
        }
        if (options?.mediaType) {
          posts = posts.filter((p) => p.mediaType === options.mediaType);
        }
        if (options?.tag) {
          const cleanTag = options.tag.toLowerCase().replace('#', '');
          posts = posts.filter((p) =>
            p.tags.some((t) => t.toLowerCase() === cleanTag)
          );
        }
        if (options?.searchQuery) {
          const query = options.searchQuery.toLowerCase();
          posts = posts.filter(
            (p) =>
              p.caption.toLowerCase().includes(query) ||
              p.userName.toLowerCase().includes(query) ||
              p.userUsername.toLowerCase().includes(query) ||
              (p.location && p.location.toLowerCase().includes(query)) ||
              p.tags.some((t) => t.toLowerCase().includes(query))
          );
        }

        // Sort newest first
        posts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        resolve(posts);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getPostById(id: string): Promise<Post | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('posts', 'readonly');
      const store = tx.objectStore('posts');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async createPost(
    postData: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'likedBy' | 'commentsCount'>
  ): Promise<Post> {
    const db = await this.openDB();
    const newPost: Post = {
      ...postData,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readwrite');
      const store = tx.objectStore('posts');
      const req = store.add(newPost);
      req.onsuccess = () => resolve(newPost);
      req.onerror = () => reject(req.error);
    });
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const db = await this.openDB();
    const post = await this.getPostById(postId);
    if (!post || post.userId !== userId) {
      throw new Error('No tienes permiso para eliminar esta publicación');
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['posts', 'comments', 'saved_posts'], 'readwrite');
      const postStore = tx.objectStore('posts');
      postStore.delete(postId);

      // Clean comments
      const commentStore = tx.objectStore('comments');
      const index = commentStore.index('postId');
      const req = index.openCursor(IDBKeyRange.only(postId));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async toggleLikePost(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readwrite');
      const store = tx.objectStore('posts');
      const req = store.get(postId);

      req.onsuccess = () => {
        const post: Post = req.result;
        if (!post) {
          reject(new Error('Publicación no encontrada'));
          return;
        }

        const isLiked = post.likedBy.includes(userId);
        if (isLiked) {
          post.likedBy = post.likedBy.filter((id) => id !== userId);
          post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
          post.likedBy.push(userId);
          post.likesCount += 1;
        }

        store.put(post);
        resolve({ likesCount: post.likesCount, isLiked: !isLiked });
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* ---------------- COMMENT METHODS ---------------- */

  async getComments(postId: string): Promise<Comment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('comments', 'readonly');
      const store = tx.objectStore('comments');
      const index = store.index('postId');
      const req = index.getAll(IDBKeyRange.only(postId));

      req.onsuccess = () => {
        const comments: Comment[] = req.result || [];
        comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(comments);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async addComment(
    postId: string,
    user: { id: string; name: string; username: string; avatar: string },
    text: string
  ): Promise<Comment> {
    const db = await this.openDB();
    const comment: Comment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      postId,
      userId: user.id,
      userName: user.name,
      userUsername: user.username,
      userAvatar: user.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['comments', 'posts'], 'readwrite');
      const commentStore = tx.objectStore('comments');
      commentStore.add(comment);

      const postStore = tx.objectStore('posts');
      const req = postStore.get(postId);
      req.onsuccess = () => {
        const post: Post = req.result;
        if (post) {
          post.commentsCount = (post.commentsCount || 0) + 1;
          postStore.put(post);
        }
      };

      tx.oncomplete = () => resolve(comment);
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteComment(commentId: string, postId: string, userId: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['comments', 'posts'], 'readwrite');
      const commentStore = tx.objectStore('comments');
      const postStore = tx.objectStore('posts');

      const req = commentStore.get(commentId);
      req.onsuccess = () => {
        const comment: Comment = req.result;
        if (!comment || comment.userId !== userId) {
          reject(new Error('No autorizado para borrar este comentario'));
          return;
        }

        commentStore.delete(commentId);

        const postReq = postStore.get(postId);
        postReq.onsuccess = () => {
          const post: Post = postReq.result;
          if (post) {
            post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
            postStore.put(post);
          }
        };
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  /* ---------------- SAVED / BOOKMARKS ---------------- */

  async getSavedPostIds(userId: string): Promise<string[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('saved_posts', 'readonly');
      const store = tx.objectStore('saved_posts');
      const index = store.index('userId');
      const req = index.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => {
        const records = req.result || [];
        resolve(records.map((r: { postId: string }) => r.postId));
      };
      req.onerror = () => resolve([]);
    });
  }

  async toggleSavePost(userId: string, postId: string): Promise<boolean> {
    const db = await this.openDB();
    const id = `${userId}_${postId}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saved_posts', 'readwrite');
      const store = tx.objectStore('saved_posts');
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result) {
          store.delete(id);
          resolve(false); // unsaved
        } else {
          store.put({ id, userId, postId });
          resolve(true); // saved
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  /* ---------------- FOLLOW / UNFOLLOW ---------------- */

  async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (currentUserId === targetUserId) return false;
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');

      const reqCurrent = store.get(currentUserId);
      reqCurrent.onsuccess = () => {
        const currentUser: User = reqCurrent.result;
        const reqTarget = store.get(targetUserId);

        reqTarget.onsuccess = () => {
          const targetUser: User = reqTarget.result;
          if (!currentUser || !targetUser) {
            reject(new Error('Usuario no encontrado'));
            return;
          }

          const isFollowing = (currentUser.followingIds || []).includes(targetUserId);
          if (isFollowing) {
            currentUser.followingIds = currentUser.followingIds.filter((id) => id !== targetUserId);
            targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
          } else {
            currentUser.followingIds = [...(currentUser.followingIds || []), targetUserId];
            targetUser.followersCount = (targetUser.followersCount || 0) + 1;
          }

          store.put(currentUser);
          store.put(targetUser);
          resolve(!isFollowing);
        };
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  /* ---------------- DATABASE BACKUP / EXPORT / IMPORT ---------------- */

  async exportFullDatabase(): Promise<AppDatabase> {
    const db = await this.openDB();
    const users = await this.getUsers();
    const posts = await this.getPosts();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['comments', 'saved_posts'], 'readonly');
      const commentStore = tx.objectStore('comments');
      const savedStore = tx.objectStore('saved_posts');

      const commentsReq = commentStore.getAll();
      const savedReq = savedStore.getAll();

      tx.oncomplete = () => {
        const savedMap: Record<string, string[]> = {};
        (savedReq.result || []).forEach((item: { userId: string; postId: string }) => {
          if (!savedMap[item.userId]) savedMap[item.userId] = [];
          savedMap[item.userId].push(item.postId);
        });

        resolve({
          version: 1,
          exportedAt: new Date().toISOString(),
          users,
          posts,
          comments: commentsReq.result || [],
          savedPostIdsByUser: savedMap,
        });
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  async importFullDatabase(data: AppDatabase): Promise<void> {
    if (!data.users || !data.posts) {
      throw new Error('El archivo no contiene un formato de base de datos válido.');
    }
    await this.clearAllData();
    await this.seedFromData(data);
  }

  async resetDatabaseToFactory(): Promise<void> {
    await this.clearAllData();
    await this.seedFromData(initialData as AppDatabase);
    const firstUser = initialData.users[0]?.id;
    if (firstUser) {
      this.setActiveUserId(firstUser);
    }
  }

  private async clearAllData(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['users', 'posts', 'comments', 'saved_posts'], 'readwrite');
      tx.objectStore('users').clear();
      tx.objectStore('posts').clear();
      tx.objectStore('comments').clear();
      tx.objectStore('saved_posts').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new IndexedDBStorage();
