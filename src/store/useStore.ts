import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  publicKey: string;
  privateKey: string;
  displayName?: string;
  avatarUrl?: string;
  noxaId?: string;
}

export interface Contact {
  id: string;
  username: string;
  publicKey: string;
  customName?: string;
  displayName?: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isLocked?: boolean;
  isOnline?: boolean;
  lockType?: AppLockType;
  lockSecret?: string;
  streakCount?: number;
  lastMessageDate?: string; // YYYY-MM-DD
  isEphemeralMode?: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: number;
  readAt?: number;
  isDisappearing?: boolean;
  isViewOnce?: boolean;
  selfDestructTimer?: number | null;
  expiresAt?: number;
  isDeleted?: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds
  type?: 'text' | 'system' | 'image' | 'video' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  encryptedAesKey?: string;
  iv?: string;
  isAnonymous?: boolean;
  senderName?: string;
}

export type AppLockType = 'none' | 'pin' | 'pattern' | 'alphabetic';

export interface PrivacySettings {
  screenshotDetection: boolean;
  lastSeen: boolean;
  ghostMode: boolean;
  anonymousMode: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // user IDs
  avatarUrl?: string;
  createdBy: string;
  createdAt: number;
  isEphemeralMode?: boolean;
}

export interface AppLockConfig {
  enabled: boolean;
  secret: string;
  type: AppLockType;
  biometricEnabled: boolean;
}

interface AppState {
  user: User | null;
  accounts: User[]; // Multi-account support
  contacts: Record<string, Contact>;
  groups: Record<string, Group>;
  messages: Record<string, Message[]>; // contactId or groupId -> messages
  theme: 'dark' | 'light' | 'amoled';
  privacySettings: PrivacySettings;
  blockedUsers: string[]; // user IDs
  appLock: AppLockConfig;
  unlockedChats: Record<string, boolean>; // contactId -> isUnlocked
  isAppUnlocked: boolean;
  tempUsername: string;
  setUser: (user: User | null) => void;
  addAccount: (user: User) => void;
  switchAccount: (userId: string) => void;
  removeAccount: (userId: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  createGroup: (group: Group) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  addMember: (groupId: string, userId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
  addMessage: (targetId: string, message: Message) => void;
  updateMessage: (targetId: string, messageId: string, updates: Partial<Message>) => void;
  setTheme: (theme: 'dark' | 'light' | 'amoled') => void;
  setPrivacySettings: (settings: Partial<PrivacySettings>) => void;
  setAppLock: (config: Partial<AppLockConfig>) => void;
  setAppUnlocked: (unlocked: boolean) => void;
  setChatUnlocked: (contactId: string, unlocked: boolean) => void;
  setTempUsername: (username: string) => void;
  clearMessages: (targetId: string) => void;
  markMessagesAsRead: (targetId: string) => void;
  markMessagesAsDelivered: (targetId: string) => void;
  deleteMessage: (targetId: string, messageId: string) => void;
  reactToMessage: (targetId: string, messageId: string, emoji: string) => void;
  setContactStatus: (userId: string, isOnline: boolean) => void;
  updateStreak: (contactId: string) => void;
  cleanupExpiredMessages: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accounts: [],
      contacts: {},
      groups: {},
      messages: {},
      theme: 'dark',
      privacySettings: {
        screenshotDetection: true,
        lastSeen: true,
        ghostMode: false,
        anonymousMode: false,
      },
      blockedUsers: [],
      appLock: {
        enabled: false,
        secret: '',
        type: 'none',
        biometricEnabled: false,
      },
      unlockedChats: {},
      isAppUnlocked: false,
      tempUsername: 'Anonymous',
      setUser: (user) => set((state) => {
        if (!user) return { user, isAppUnlocked: false };
        // If adding a new user, also add to accounts if not present
        const exists = state.accounts.find(a => a.id === user.id);
        return { 
          user, 
          accounts: exists ? state.accounts : [...state.accounts, user],
          isAppUnlocked: false 
        };
      }),
      addAccount: (user) => set((state) => ({
        accounts: state.accounts.find(a => a.id === user.id) 
          ? state.accounts 
          : [...state.accounts, user]
      })),
      switchAccount: (userId) => set((state) => {
        const account = state.accounts.find(a => a.id === userId);
        if (account) {
          return { user: account, isAppUnlocked: false };
        }
        return state;
      }),
      removeAccount: (userId) => set((state) => {
        const newAccounts = state.accounts.filter(a => a.id !== userId);
        const newUser = state.user?.id === userId ? (newAccounts[0] || null) : state.user;
        return { accounts: newAccounts, user: newUser };
      }),
      addContact: (contact) =>
        set((state) => ({
          contacts: { ...state.contacts, [contact.id]: contact },
        })),
      updateContact: (id, updates) =>
        set((state) => ({
          contacts: {
            ...state.contacts,
            [id]: { ...state.contacts[id], ...updates },
          },
        })),
      blockUser: (userId) => set((state) => ({
        blockedUsers: state.blockedUsers.includes(userId) 
          ? state.blockedUsers 
          : [...state.blockedUsers, userId]
      })),
      unblockUser: (userId) => set((state) => ({
        blockedUsers: state.blockedUsers.filter(id => id !== userId)
      })),
      createGroup: (group) => set((state) => ({
        groups: { ...state.groups, [group.id]: group }
      })),
      updateGroup: (id, updates) => set((state) => ({
        groups: {
          ...state.groups,
          [id]: { ...state.groups[id], ...updates }
        }
      })),
      addMember: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group || group.members.includes(userId)) return state;
        return {
          groups: {
            ...state.groups,
            [groupId]: { ...group, members: [...group.members, userId] }
          }
        };
      }),
      removeMember: (groupId, userId) => set((state) => {
        const group = state.groups[groupId];
        if (!group) return state;
        return {
          groups: {
            ...state.groups,
            [groupId]: { ...group, members: group.members.filter(id => id !== userId) }
          }
        };
      }),
      addMessage: (targetId, message) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          // Avoid duplicates
          if (targetMessages.find(m => m.id === message.id)) return state;
          return {
            messages: {
              ...state.messages,
              [targetId]: [...targetMessages, message],
            },
          };
        }),
      updateMessage: (targetId, messageId, updates) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          const updatedMessages = targetMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
          return {
            messages: {
              ...state.messages,
              [targetId]: updatedMessages,
            },
          };
        }),
      setTheme: (theme) => set({ theme }),
      setPrivacySettings: (settings) =>
        set((state) => ({
          privacySettings: { ...state.privacySettings, ...settings },
        })),
      setAppLock: (config) => set((state) => ({
        appLock: { ...state.appLock, ...config }
      })),
      setAppUnlocked: (unlocked) => set({ isAppUnlocked: unlocked }),
      setChatUnlocked: (contactId, unlocked) =>
        set((state) => ({
          unlockedChats: { ...state.unlockedChats, [contactId]: unlocked },
        })),
      setTempUsername: (username) => set({ tempUsername: username }),
      clearMessages: (targetId) =>
        set((state) => ({
          messages: { ...state.messages, [targetId]: [] },
        })),
      markMessagesAsRead: (targetId) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          const now = Date.now();
          const updatedMessages = targetMessages.map((msg) => {
            if (msg.from === state.user?.id) return msg; // Don't mark own messages as read by self
            return {
              ...msg,
              status: 'read' as const,
              readAt: msg.readAt || now,
              deliveredAt: msg.deliveredAt || now,
            };
          });
          return {
            messages: {
              ...state.messages,
              [targetId]: updatedMessages,
            },
          };
        }),
      markMessagesAsDelivered: (targetId) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          const now = Date.now();
          const updatedMessages = targetMessages.map((msg) => {
            if (msg.from === state.user?.id) return msg;
            if (msg.status === 'read') return msg;
            return {
              ...msg,
              status: 'delivered' as const,
              deliveredAt: msg.deliveredAt || now,
            };
          });
          return {
            messages: {
              ...state.messages,
              [targetId]: updatedMessages,
            },
          };
        }),
      deleteMessage: (targetId, messageId) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          const updatedMessages = targetMessages.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: true, text: 'This message was deleted' } : msg
          );
          return {
            messages: {
              ...state.messages,
              [targetId]: updatedMessages,
            },
          };
        }),
      reactToMessage: (targetId, messageId, emoji) =>
        set((state) => {
          const targetMessages = state.messages[targetId] || [];
          const userId = state.user?.id;
          if (!userId) return state;

          const updatedMessages = targetMessages.map((msg) => {
            if (msg.id !== messageId) return msg;

            const reactions = { ...(msg.reactions || {}) };
            const users = [...(reactions[emoji] || [])];

            if (users.includes(userId)) {
              // Remove reaction if already exists
              reactions[emoji] = users.filter((id) => id !== userId);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              // Add reaction
              reactions[emoji] = [...users, userId];
            }

            return { ...msg, reactions };
          });

          return {
            messages: {
              ...state.messages,
              [targetId]: updatedMessages,
            },
          };
        }),
      setContactStatus: (userId, isOnline) =>
        set((state) => {
          if (!state.contacts[userId]) return state;
          return {
            contacts: {
              ...state.contacts,
              [userId]: { ...state.contacts[userId], isOnline },
            },
          };
        }),
      updateStreak: (contactId) =>
        set((state) => {
          const contact = state.contacts[contactId];
          if (!contact) return state;

          const today = new Date().toISOString().split('T')[0];
          const lastDate = contact.lastMessageDate;

          if (lastDate === today) return state;

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = 1;
          if (lastDate === yesterdayStr) {
            newStreak = (contact.streakCount || 0) + 1;
          }

          return {
            contacts: {
              ...state.contacts,
              [contactId]: {
                ...contact,
                streakCount: newStreak,
                lastMessageDate: today,
              },
            },
          };
        }),
      cleanupExpiredMessages: () =>
        set((state) => {
          const now = Date.now();
          let hasChanges = false;
          const newMessages = { ...state.messages };

          for (const targetId in newMessages) {
            const filtered = newMessages[targetId].filter(
              (msg) => !msg.expiresAt || msg.expiresAt > now
            );
            if (filtered.length !== newMessages[targetId].length) {
              newMessages[targetId] = filtered;
              hasChanges = true;
            }
          }

          if (hasChanges) {
            return { messages: newMessages };
          }
          return state;
        }),
    }),
    {
      name: 'noxa-storage',
      partialize: (state) => {
        const { unlockedChats, isAppUnlocked, ...rest } = state;
        // Also strip isOnline from contacts before persisting
        const contacts = { ...rest.contacts };
        for (const id in contacts) {
          const { isOnline, ...contactRest } = contacts[id];
          contacts[id] = contactRest as any;
        }
        return { ...rest, contacts };
      },
    }
  )
);
