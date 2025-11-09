// Group-related types for the application

export interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  code: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  isPrivate: boolean;
  maxMembers: number;
  members: string[];
  admins: string[];
  tags: string[];
  lastActivity: Date;
  // Client-side computed properties
  isCreator?: boolean;
  isJoined?: boolean;
  joinedAt?: Date;
  userRole?: 'admin' | 'member';
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastActive?: Date;
}

export interface UserMembership {
  groupId: string;
  groupCode: string;
  groupName: string;
  joinedAt: Date;
  role: 'admin' | 'member';
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  subject: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface JoinGroupRequest {
  groupCode: string;
}