import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, Users, Camera, Check, Search, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const user = useStore((state) => state.user);
  const contacts = useStore((state) => state.contacts);
  const createGroup = useStore((state) => state.createGroup);
  
  const theme = useStore((state) => state.theme);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const contactList = Object.values(contacts);
  const filteredContacts = contactList.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.displayName && c.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          createdBy: user.id,
          members: selectedMembers,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${groupName}`,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create group');
      
      createGroup({
        id: data.id,
        name: groupName,
        members: [user.id, ...selectedMembers],
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${groupName}`,
        createdBy: user.id,
        createdAt: data.createdAt,
      });

      // Add system message
      useStore.getState().addMessage(data.id, {
        id: crypto.randomUUID(),
        from: 'system',
        to: data.id,
        text: `${user.displayName || user.username} created the group`,
        timestamp: data.createdAt,
        status: 'read',
        type: 'system'
      });
      
      onClose();
      setGroupName('');
      setSelectedMembers([]);
    } catch (err) {
      console.error('Group creation failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={clsx(
              "relative w-full max-w-lg border-t sm:border rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-200",
              theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            )}
          >
            <div className={clsx(
              "p-6 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl",
              theme === 'light' ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'
            )}>
              <div>
                <h3 className={clsx(
                  "text-xl font-bold",
                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                )}>Create Group</h3>
                <p className="text-sm text-zinc-500">Start a conversation with multiple people</p>
              </div>
              <button 
                onClick={onClose}
                className={clsx(
                  "p-2 rounded-full transition-colors text-zinc-400",
                  theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Group Info */}
              <div className="flex items-center gap-4">
                <label className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 transition-colors cursor-pointer group overflow-hidden relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter group name..."
                  />
                </div>
              </div>

              {/* Member Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Members</h4>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {selectedMembers.length} Selected
                  </span>
                </div>

                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    placeholder="Search contacts..."
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => toggleMember(contact.id)}
                      className={clsx(
                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                        selectedMembers.includes(contact.id)
                          ? "bg-indigo-600/10 border-indigo-500/50"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" />
                          ) : (
                            contact.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-white">{contact.displayName || contact.username}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">@{contact.username}</p>
                        </div>
                      </div>
                      <div className={clsx(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        selectedMembers.includes(contact.id)
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-zinc-700"
                      )}>
                        {selectedMembers.includes(contact.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                  {filteredContacts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-zinc-600">No contacts found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/80 border-t border-zinc-800">
              <button
                onClick={handleCreate}
                disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                Create Group
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
