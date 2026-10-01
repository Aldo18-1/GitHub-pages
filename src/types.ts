export type MediaType = 'photo' | 'video';
export type FilterType = 'normal' | 'vintage' | 'noir' | 'warmth' | 'cyber' | 'dramatic' | 'cinematic';
export type AspectRatioType = '1:1' | '4:5' | '16:9' | '9:16';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  location?: string;
  website?: string;
  followersCount: number;
  followingIds: string[];
  createdAt: string;
  isVerified?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  aspectRatio: AspectRatioType;
  filter: FilterType;
  caption: string;
  tags: string[];
  location?: string;
  cameraDetails?: string;
  likesCount: number;
  likedBy: string[]; // array of userIds
  commentsCount: number;
  createdAt: string;
}

export interface AppDatabase {
  users: User[];
  posts: Post[];
  comments: Comment[];
  savedPostIdsByUser: Record<string, string[]>;
  version: number;
  exportedAt?: string;
}
