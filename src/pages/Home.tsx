import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { socket } from '../lib/socket';
import { Search, MessageSquarePlus, Settings, User as UserIcon, ShieldCheck, Check, CheckCheck, Upload, Image as ImageIcon, X, Camera, Clock, BellOff, Lock, QrCode, Users, Plus, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import AddFriendModal from '../components/AddFriendModal';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Home() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const contacts = useStore((state) => state.contacts);
  const groups = useStore((state) => state.groups);
  const messages = useStore((state) => state.messages);
  const addContact = useStore((state) => state.addContact);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'contacts'>('chats');

  const predefinedAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel',
  ];

  const updateAvatar = async (url: string) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          displayName: user.displayName,
          avatarUrl: url
        }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, avatarUrl: url });
        setShowAvatarPicker(false);
      }
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateAvatar(base64String);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user) {
      navigate('/intro');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          setSearchResults(data.filter((u: any) => u.id !== user?.id));
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Search failed', err);
          }
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  const startChat = (contactUser: any) => {
    if (!contacts[contactUser.id]) {
      addContact({
        id: contactUser.id,
        username: contactUser.username,
        publicKey: contactUser.public_key,
        displayName: contactUser.displayName,
        avatarUrl: contactUser.avatarUrl,
      });
    }
                    navigate(`/chat/${contactUser.id}`);
    setSearchQuery('');
  };

  const contactList = Object.values(contacts);
  const groupList = Object.values(groups);
  
  const filteredContacts = contactList.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.displayName && c.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.customName && c.customName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGroups = groupList.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = Object.keys(messages).filter(id => {
    const msgs = messages[id] || [];
    if (msgs.length === 0) return false;
    
    const contact = contacts[id];
    const group = groups[id];
    
    if (contact) {
      return contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (contact.displayName && contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
             (contact.customName && contact.customName.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (group) {
      return group.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return false;
  });

  const theme = useStore((state) => state.theme);

  return (
    <div className={clsx(
      "flex-1 flex flex-col relative transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <div className="px-6 pt-12 pb-6 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 group">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 overflow-hidden relative group/avatar shadow-lg shadow-indigo-500/10"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="text-left"
            >
              <h1 className="text-xl font-bold tracking-tight hover:text-indigo-400 transition-colors">
                {user?.displayName || user?.username || 'NOXA'}
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">My Profile</p>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ai-assistant')}
              className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-full flex items-center justify-center transition-colors border border-indigo-500/30"
              title="Noxa AI"
            >
              <Bot className="w-5 h-5 text-indigo-400" />
            </button>
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors border border-zinc-700/50"
              title="Add Friends"
            >
              <QrCode className="w-5 h-5 text-zinc-400" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 bg-zinc-800/50 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors border border-zinc-700/50"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="relative group mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder={activeTab === 'chats' ? "Search by name or username..." : "Search groups by name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('chats')}
            className={clsx(
              "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'chats' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'groups' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Groups
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={clsx(
              "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'contacts' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Contacts
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {searchQuery ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Active Chats Section */}
              {filteredChats.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Chats</h2>
                  </div>
                  {filteredChats.map((id) => {
                    const contact = contacts[id];
                    const group = groups[id];
                    const chatMsgs = messages[id] || [];
                    const lastMsg = chatMsgs[chatMsgs.length - 1];
                    
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(`/chat/${id}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                      >
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                          {contact ? (
                            contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              contact.customName ? contact.customName.charAt(0).toUpperCase() : (contact.username?.charAt(0).toUpperCase() || '?')
                            )
                          ) : group ? (
                            group.avatarUrl ? (
                              <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                              group.name.charAt(0).toUpperCase()
                            )
                          ) : '?'}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-zinc-100">
                            {contact ? (contact.customName || contact.displayName || contact.username) : group?.name}
                          </h3>
                          <p className="text-sm text-zinc-500 truncate">
                            {lastMsg ? (lastMsg.from === user?.id ? `You: ${lastMsg.text}` : lastMsg.text) : 'No messages'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Groups Search Results */}
              {filteredGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Groups</h2>
                  </div>
                  {filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => navigate(`/chat/${group.id}`)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                    >
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                        {group.avatarUrl ? (
                          <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                          group.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-zinc-100">{group.name}</h3>
                        <p className="text-sm text-zinc-500">{group.members.length} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Contacts Search Results */}
              {filteredContacts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Contacts</h2>
                  </div>
                  {filteredContacts.map((contact) => {
                    const isLocked = contact.isLocked;

                    return (
                      <button
                        key={contact.id}
                        onClick={() => navigate(`/chat/${contact.id}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                      >
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.username || 'Contact'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            contact.customName ? contact.customName.charAt(0).toUpperCase() : (contact.username?.charAt(0).toUpperCase() || '?')
                          )}
                          <div className={clsx(
                            "absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-950 rounded-full z-10 transition-colors",
                            contact.isOnline ? "bg-emerald-500" : "bg-zinc-600"
                          )} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                            {contact.customName || contact.displayName || contact.username}
                            {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                          </h3>
                          <p className="text-sm text-zinc-500">@{contact.username || 'unknown'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Global Search Results */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 mb-3">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Search</h2>
                </div>
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500 font-medium">Searching Noxa network...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.filter(u => !contacts[u.id]).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startChat(u)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                    >
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.username || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          u.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-zinc-100">{u.displayName || u.username}</h3>
                        <p className="text-sm text-zinc-500">@{u.username}</p>
                      </div>
                    </button>
                  ))
                ) : (filteredContacts.length === 0 && filteredGroups.length === 0 && filteredChats.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                      <Search className="w-8 h-8 text-zinc-700" />
                    </div>
                    <h3 className="text-zinc-300 font-medium mb-1">No results found</h3>
                    <p className="text-xs text-zinc-500">Try searching for a different name or username</p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {activeTab === 'chats' ? (
                contactList.length > 0 ? (
                  contactList.map((contact) => {
                    const contactMsgs = messages[contact.id] || [];
                    const lastMsg = contactMsgs[contactMsgs.length - 1];
                    const unreadCount = contactMsgs.filter(m => m.from === contact.id && m.status !== 'read').length;
                    const isLocked = contact.isLocked;
                    
                    return (
                      <button
                        key={contact.id}
                        onClick={() => navigate(`/chat/${contact.id}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                      >
                        <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-xl font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.username || 'Contact'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            contact.customName ? contact.customName.charAt(0).toUpperCase() : (contact.username?.charAt(0).toUpperCase() || '?')
                          )}
                          <div className={clsx(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-zinc-950 rounded-full z-10 transition-colors",
                            contact.isOnline ? "bg-emerald-500" : "bg-zinc-600"
                          )} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-semibold text-zinc-100 text-lg flex items-center gap-2">
                              {contact.customName || contact.displayName || contact.username}
                              {contact?.isMuted && <BellOff className="w-3.5 h-3.5 text-zinc-500" />}
                              {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                            </h3>
                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && !isLocked && (
                                <div className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                  {unreadCount}
                                </div>
                              )}
                              {lastMsg && !isLocked && (
                                <span className="text-xs text-zinc-500 font-medium">
                                  {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className={clsx(
                              "text-sm truncate max-w-[180px]",
                              unreadCount > 0 ? "text-zinc-100 font-medium" : "text-zinc-400"
                            )}>
                              {isLocked ? (
                                <span className="flex items-center gap-1 text-zinc-500 italic">
                                  <Lock className="w-3 h-3" /> Chat is locked
                                </span>
                              ) : (
                                lastMsg ? (lastMsg.from === user?.id ? `You: ${lastMsg.text}` : lastMsg.text) : 'Start an encrypted chat'
                              )}
                            </p>
                            {lastMsg && lastMsg.from === user?.id && !isLocked && (
                              <span className="flex-shrink-0">
                                {lastMsg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                ) : lastMsg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                                ) : lastMsg.status === 'sent' ? (
                                  <Check className="w-3.5 h-3.5 text-zinc-400" />
                                ) : (
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <MessageSquarePlus className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No active chats</h3>
                    <p className="text-sm text-zinc-500 max-w-[200px]">Search for a username above to start an encrypted conversation.</p>
                  </div>
                )
              ) : activeTab === 'groups' ? (
                groupList.length > 0 ? (
                  groupList.map((group) => {
                    const groupMsgs = messages[group.id] || [];
                    const lastMsg = groupMsgs[groupMsgs.length - 1];
                    const unreadCount = groupMsgs.filter(m => m.from !== user?.id && m.status !== 'read').length;
                    
                    return (
                      <button
                        key={group.id}
                        onClick={() => navigate(`/chat/${group.id}`)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                      >
                        <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-xl font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                          {group.avatarUrl ? (
                            <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            group.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-semibold text-zinc-100 text-lg flex items-center gap-2">
                              {group.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                <div className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                  {unreadCount}
                                </div>
                              )}
                              {lastMsg && (
                                <span className="text-xs text-zinc-500 font-medium">
                                  {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className={clsx(
                              "text-sm truncate max-w-[180px]",
                              unreadCount > 0 ? "text-zinc-100 font-medium" : "text-zinc-400"
                            )}>
                              {lastMsg ? (lastMsg.from === user?.id ? `You: ${lastMsg.text}` : lastMsg.text) : 'Start a group conversation'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No groups yet</h3>
                    <p className="text-sm text-zinc-500 max-w-[200px]">Create a group to chat with multiple friends at once.</p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Create Group
                    </button>
                  </div>
                )
              ) : (
                contactList.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">All Contacts ({contactList.length})</h2>
                    </div>
                    {contactList.sort((a, b) => (a.customName || a.displayName || a.username).localeCompare(b.customName || b.displayName || b.username)).map((contact) => (
                      <div
                        key={contact.id}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800/50 group"
                      >
                        <button 
                          onClick={() => navigate(`/chat/${contact.id}`)}
                          className="flex-1 flex items-center gap-4 text-left"
                        >
                          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors relative overflow-hidden">
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.username || 'Contact'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              contact.customName ? contact.customName.charAt(0).toUpperCase() : (contact.username?.charAt(0).toUpperCase() || '?')
                            )}
                            <div className={clsx(
                              "absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-950 rounded-full z-10 transition-colors",
                              contact.isOnline ? "bg-emerald-500" : "bg-zinc-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                              {contact.customName || contact.displayName || contact.username}
                              {contact.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                            </h3>
                            <p className="text-sm text-zinc-500">@{contact.username || 'unknown'}</p>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/chat/${contact.id}`)}
                            className="p-2 bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white rounded-xl transition-all"
                            title="Message"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${contact.username} from your contacts?`)) {
                                useStore.setState((state) => {
                                  const newContacts = { ...state.contacts };
                                  delete newContacts[contact.id];
                                  return { contacts: newContacts };
                                });
                              }
                            }}
                            className="p-2 bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white rounded-xl transition-all"
                            title="Remove Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <UserIcon className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No contacts yet</h3>
                    <p className="text-sm text-zinc-500 max-w-[200px]">Add friends by scanning their QR code or searching for their username.</p>
                    <button
                      onClick={() => setShowAddFriend(true)}
                      className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Add Friend
                    </button>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => {
          if (activeTab === 'chats' || activeTab === 'contacts') setShowAddFriend(true);
          else setShowCreateGroup(true);
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/20 transition-transform hover:scale-105 active:scale-95 z-20"
      >
        {activeTab === 'chats' || activeTab === 'contacts' ? <Plus className="w-6 h-6" /> : <Users className="w-6 h-6" />}
      </button>

      <AddFriendModal 
        isOpen={showAddFriend} 
        onClose={() => setShowAddFriend(false)} 
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAvatarPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Profile Picture</h3>
                  <p className="text-sm text-zinc-500">Choose how others see you</p>
                </div>
                <button 
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Upload Custom</h4>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                      <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Click to upload image</p>
                      <p className="text-xs text-zinc-600 mt-1">PNG, JPG or GIF</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUpdating} />
                  </label>
                </div>

                {/* Predefined List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Predefined Avatars</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {predefinedAvatars.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => updateAvatar(url)}
                        disabled={isUpdating}
                        className={clsx(
                          "aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                          user?.avatarUrl === url ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-transparent hover:border-zinc-700"
                        )}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isUpdating && (
                <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-white">Updating Profile...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
