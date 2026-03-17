import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { X, Camera, Check, Search, Loader2, UserPlus, Trash2, Shield, User } from 'lucide-react';
import clsx from 'clsx';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export default function GroupSettingsModal({ isOpen, onClose, groupId }: GroupSettingsModalProps) {
  const user = useStore((state) => state.user);
  const group = useStore((state) => state.groups[groupId]);
  const contacts = useStore((state) => state.contacts);
  const updateGroup = useStore((state) => state.updateGroup);
  const addMember = useStore((state) => state.addMember);
  const removeMember = useStore((state) => state.removeMember);
  const addMessage = useStore((state) => state.addMessage);

  const [groupName, setGroupName] = useState(group?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(group?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  if (!group) return null;

  const isCreator = group.createdBy === user?.id;
  const memberList = group.members;
  
  const contactList = Object.values(contacts);
  const availableContacts = contactList.filter(c => !memberList.includes(c.id));
  const filteredContacts = availableContacts.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.displayName && c.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!groupName.trim()) return;
    setIsSaving(true);
    try {
      // In a real app, we'd call an API here
      updateGroup(groupId, { name: groupName, avatarUrl });
      
      // Add system message
      addMessage(groupId, {
        id: crypto.randomUUID(),
        from: 'system',
        to: groupId,
        text: `${user?.displayName || user?.username} updated the group settings`,
        timestamp: Date.now(),
        status: 'read',
        type: 'system'
      });
      
      onClose();
    } catch (err) {
      console.error('Failed to save group settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = (contactId: string) => {
    addMember(groupId, contactId);
    const contact = contacts[contactId];
    addMessage(groupId, {
      id: crypto.randomUUID(),
      from: 'system',
      to: groupId,
      text: `${user?.displayName || user?.username} added ${contact.displayName || contact.username} to the group`,
      timestamp: Date.now(),
      status: 'read',
      type: 'system'
    });
    setShowAddMember(false);
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === group.createdBy) return; // Cannot remove creator
    removeMember(groupId, memberId);
    const contact = contacts[memberId];
    const memberName = contact ? (contact.displayName || contact.username) : 'A member';
    addMessage(groupId, {
      id: crypto.randomUUID(),
      from: 'system',
      to: groupId,
      text: `${user?.displayName || user?.username} removed ${memberName} from the group`,
      timestamp: Date.now(),
      status: 'read',
      type: 'system'
    });
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
            className="relative w-full max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-white">Group Settings</h3>
                <p className="text-sm text-zinc-500">Manage group info and members</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Group Info Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Group Info</h4>
                <div className="flex items-center gap-4">
                  <label className={clsx(
                    "w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center border-2 border-dashed border-zinc-700 transition-colors overflow-hidden relative group",
                    isCreator ? "hover:border-indigo-500/50 cursor-pointer" : "cursor-default"
                  )}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-zinc-600" />
                    )}
                    {isCreator && (
                      <>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </>
                    )}
                  </label>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      disabled={!isCreator}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                      placeholder="Enter group name..."
                    />
                  </div>
                </div>
                {isCreator && (
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving || !groupName.trim() || (groupName === group.name && avatarUrl === group.avatarUrl)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                )}
              </div>

              {/* Members Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Members ({memberList.length})</h4>
                  {isCreator && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add Member
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {memberList.map((memberId) => {
                    const member = contacts[memberId] || (memberId === user?.id ? user : null);
                    const isMemberCreator = memberId === group.createdBy;
                    
                    return (
                      <div
                        key={memberId}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700">
                            {member?.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm text-white flex items-center gap-2">
                              {member?.displayName || member?.username || 'Unknown User'}
                              {isMemberCreator && <Shield className="w-3 h-3 text-amber-500" />}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {isMemberCreator ? 'Group Creator' : 'Member'}
                            </p>
                          </div>
                        </div>
                        {isCreator && memberId !== user?.id && !isMemberCreator && (
                          <button
                            onClick={() => handleRemoveMember(memberId)}
                            className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-rose-500 group"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Add Member Sub-Modal */}
          <AnimatePresence>
            {showAddMember && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAddMember(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Add Member</h3>
                    <button onClick={() => setShowAddMember(false)} className="text-zinc-500 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative group mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      placeholder="Search contacts..."
                    />
                  </div>

                  <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleAddMember(contact.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 transition-all text-left"
                      >
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" />
                          ) : (
                            contact.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{contact.displayName || contact.username}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">@{contact.username}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-indigo-500" />
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-zinc-600">No contacts available</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
