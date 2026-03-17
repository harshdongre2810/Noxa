import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { socket } from '../lib/socket';
import { noxaAI } from '../services/aiService';
import { encryptMessage, decryptMessage, encryptFile, decryptFile } from '../lib/crypto';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Shield, Clock, EyeOff, Smile, Paperclip, Check, CheckCheck, Trash2, AlertTriangle, UserCog, X, Bell, BellOff, PhoneOff, Mic, MicOff, Volume, Volume2, Lock, Palette, Key, ChevronRight, Settings, RefreshCw, Image, FileText, Play, Download, Loader2, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import ErrorMessage from '../components/ErrorMessage';
import { AppLockType } from '../store/useStore';
import PatternLock from '../components/AppLock/PatternLock';
import PinLock from '../components/AppLock/PinLock';
import PasswordLock from '../components/AppLock/PasswordLock';
import ChatLockOverlay from '../components/AppLock/ChatLockOverlay';
import GroupSettingsModal from '../components/GroupSettingsModal';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const contacts = useStore((state) => state.contacts);
  const groups = useStore((state) => state.groups);
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const privacySettings = useStore((state) => state.privacySettings);
  const markMessagesAsRead = useStore((state) => state.markMessagesAsRead);
  const deleteMessage = useStore((state) => state.deleteMessage);
  const reactToMessage = useStore((state) => state.reactToMessage);
  const markMessagesAsDelivered = useStore((state) => state.markMessagesAsDelivered);
  const clearMessages = useStore((state) => state.clearMessages);
  const updateContact = useStore((state) => state.updateContact);
  const addContact = useStore((state) => state.addContact);
  const updateMessage = useStore((state) => state.updateMessage);
  const createGroup = useStore((state) => state.createGroup);
  const updateGroup = useStore((state) => state.updateGroup);
  const setPrivacySettings = useStore((state) => state.setPrivacySettings);
  const tempUsername = useStore((state) => state.tempUsername);
  const setTempUsername = useStore((state) => state.setTempUsername);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [disappearingTimer, setDisappearingTimer] = useState<number | null>(null);
  const [selfDestructTimer, setSelfDestructTimer] = useState<number | null>(null);
  const updateStreak = useStore(state => state.updateStreak);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isSecretChat, setIsSecretChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [secureMode, setSecureMode] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [showAnonymousSettings, setShowAnonymousSettings] = useState(false);
  const [tempNameInput, setTempNameInput] = useState(tempUsername);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isMutedCall, setIsMutedCall] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerphoneOn, setIsSpeakerphoneOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [nickname, setNickname] = useState('');
  const [showLockSetup, setShowLockSetup] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'type' | 'input' | 'confirm'>('type');
  const [tempLockType, setTempLockType] = useState<AppLockType>('none');
  const [tempSecret, setTempSecret] = useState('');
  const [setupError, setSetupError] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    if (isCalling && callType === 'video') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [isCalling, callType, localStreamRef.current, remoteStream]);

  const contact = id ? contacts[id] : null;
  const group = id ? groups[id] : null;
  const isGroup = !!group;
  const chatMessages = id ? messages[id] || [] : [];
  const isEphemeralMode = isGroup ? group?.isEphemeralMode : contact?.isEphemeralMode;

  const toggleEphemeralMode = () => {
    if (!id) return;
    if (isGroup) {
      updateGroup(id, { isEphemeralMode: !isEphemeralMode });
    } else {
      updateContact(id, { isEphemeralMode: !isEphemeralMode });
    }
  };

  useEffect(() => {
    if (contact) {
      setNickname(contact.customName || '');
    }
  }, [contact?.id]);

  useEffect(() => {
    if (!user || !id) {
      navigate('/home');
      return;
    }

    if (!contact && !group && !isFetchingProfile) {
      // We'll let fetchContactProfile handle it
      return;
    }

    if (!contact && !group) return;

    const handleTyping = (data: any) => {
      if (data.from === id || (data.isGroup && data.to === id)) {
        setRemoteTyping(true);
        setTimeout(() => setRemoteTyping(false), 3000);
      }
    };

    socket.on('typing', handleTyping);

    const handleOffer = (data: any) => {
      if (data.to === user.id) {
        if (isCalling) {
          socket.emit('call:busy', { to: data.from, from: user.id });
          return;
        }
        setIncomingCallData(data);
        setCallType(data.callType);
        setCallStatus('ringing');
      }
    };

    const handleBusy = (data: any) => {
      if (data.from === id) {
        setCallError('User is busy on another call');
        setTimeout(() => cleanupCall(), 3000);
      }
    };

    const handleRejected = (data: any) => {
      if (data.from === id) {
        setCallStatus('ended');
        setTimeout(() => cleanupCall(), 2000);
      }
    };

    const handleAnswer = async (data: any) => {
      if (pcRef.current) {
        try {
          if (pcRef.current.signalingState === 'have-local-offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCallStatus('connected');
            
            // Process buffered candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              if (candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        } catch (e) {
          console.error('Error setting remote answer', e);
        }
      }
    };

    const handleCandidate = async (data: any) => {
      if (pcRef.current) {
        try {
          if (pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            pendingCandidates.current.push(data.candidate);
          }
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      }
    };

    const handleCallEnd = () => {
      cleanupCall();
    };

    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleCandidate);
    socket.on('call:end', handleCallEnd);
    socket.on('call:busy', handleBusy);
    socket.on('call:rejected', handleRejected);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleCandidate);
      socket.off('call:end', handleCallEnd);
      socket.off('call:busy', handleBusy);
      socket.off('call:rejected', handleRejected);
      cleanupCall();
    };
  }, [user, contact, id, navigate]);

  useEffect(() => {
    if (id && user && chatMessages.length > 0 && !privacySettings.ghostMode) {
      // Mark received messages as read when viewing the chat
      const hasUnread = chatMessages.some(m => m.from !== user.id && m.status !== 'read');
      if (hasUnread) {
        markMessagesAsRead(id);
        socket.emit('read', { to: id, from: user.id, isGroup });
      }
    }
  }, [id, user, chatMessages, markMessagesAsRead, privacySettings.ghostMode]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfile = async (retries = 3, isRetry = false) => {
      if (!id || id === 'undefined' || (isFetchingProfile && !isRetry)) return;
      
      setIsFetchingProfile(true);
      try {
        // Try fetching as user first (by ID)
        let userRes = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal: controller.signal });
        let data;
        
        if (userRes.ok) {
          data = await userRes.json();
        } else if (userRes.status === 404) {
          // If not found by ID, try by username
          const usernameRes = await fetch(`/api/users/by-username/${encodeURIComponent(id)}`, { signal: controller.signal });
          if (usernameRes.ok) {
            data = await usernameRes.json();
          }
        }

        if (data) {
          const contactData = {
            id: data.id,
            username: data.username,
            publicKey: data.public_key || data.publicKey,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl
          };

          // Use functional updates or check state carefully to avoid loops
          // But better yet, remove contacts from dependency array
          addContact(contactData);
          setIsFetchingProfile(false);
          return;
        }

        // If not a user, try fetching as group
        const groupRes = await fetch(`/api/groups/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          if (groupData && (groupData.id === id || groupData.name === id)) {
            const normalizedGroup = {
              id: groupData.id,
              name: groupData.name,
              members: groupData.members,
              avatarUrl: groupData.avatarUrl,
              createdBy: groupData.created_by,
              createdAt: groupData.created_at
            };

            createGroup(normalizedGroup);
            setIsFetchingProfile(false);
            return;
          }
        }

        // If both failed with 404
        if (userRes.status === 404 && (!groupRes || groupRes.status === 404)) {
          // Only navigate away if we don't already have it in local store
          // This avoids navigating away during transient network issues if we have cached data
          // But here we are specifically checking for 404
          // navigate('/home'); // Removed for now to be less aggressive
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch profile', err);
          if (retries > 0) {
            console.log(`Retrying fetch profile... (${retries} left)`);
            setTimeout(() => fetchProfile(retries - 1, true), 2000);
            return; // Don't set fetching to false yet
          }
        }
      } finally {
        setIsFetchingProfile(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [id, addContact, createGroup, navigate]); // Removed contacts and groups from dependencies

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setIsCalling(false);
    setCallStatus('idle');
    setIncomingCallData(null);
    setIsMutedCall(false);
    setIsCameraOff(false);
    setIsSpeakerphoneOn(false);
    setIsFrontCamera(true);
    setCallDuration(0);
    pendingCandidates.current = [];
    setCallError(null);
  };

  const createPeerConnection = (targetId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          to: targetId,
          from: user?.id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setRemoteStream(event.streams[0]);
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!id || !user) return;
    setCallType(type);
    setIsCalling(true);
    setCallStatus('calling');
    setCallError(null);
    setIsMutedCall(false);
    setIsCameraOff(false);
    setIsSpeakerphoneOn(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:offer', {
        to: id,
        from: user.id,
        offer,
        callType: type,
        username: user.username,
        avatarUrl: user.avatarUrl
      });
    } catch (err) {
      console.error('Failed to start call', err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCallError('Microphone/Camera permission denied. Please allow access in your browser settings.');
      } else {
        setCallError('Failed to start call. Please check your connection and try again.');
      }
      setTimeout(() => cleanupCall(), 3000);
    }
  };

  const acceptCall = async () => {
    if (!incomingCallData || !user) return;
    setIsCalling(true);
    setCallStatus('connected');
    setCallError(null);
    setIsMutedCall(false);
    setIsCameraOff(false);
    setIsSpeakerphoneOn(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCallData.callType === 'video'
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(incomingCallData.from);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
      
      // Process buffered candidates
      while (pendingCandidates.current.length > 0) {
        const candidate = pendingCandidates.current.shift();
        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        to: incomingCallData.from,
        from: user.id,
        answer
      });
      setIncomingCallData(null);
    } catch (err) {
      console.error('Failed to accept call', err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCallError('Microphone/Camera permission denied. Please allow access in your browser settings.');
      } else {
        setCallError('Failed to accept call. Please check your connection and try again.');
      }
      setTimeout(() => cleanupCall(), 3000);
    }
  };

  const rejectCall = () => {
    if (incomingCallData && user) {
      socket.emit('call:rejected', {
        to: incomingCallData.from,
        from: user.id
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (id || incomingCallData) {
      const targetId = id || incomingCallData?.from;
      socket.emit('call:end', { to: targetId, from: user?.id });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    setIsMutedCall(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  };

  const toggleCamera = () => {
    setIsCameraOff(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  };

  const switchCamera = async () => {
    if (callType !== 'video' || !localStreamRef.current) return;
    
    const newFacingMode = isFrontCamera ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false // Keep current audio
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      
      localStreamRef.current.addTrack(newVideoTrack);
      setIsFrontCamera(!isFrontCamera);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
      // Update the track in the peer connection
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.error('Failed to switch camera', err);
    }
  };

  const toggleSpeakerphone = () => {
    setIsSpeakerphoneOn(!isSpeakerphoneOn);
    // Note: Browser support for switching between earpiece and speakerphone is limited.
    // This mostly serves as a UI toggle in a web context.
  };

  const handleDownload = async (msg: any) => {
    if (!msg.fileUrl || !user) return;
    
    try {
      const res = await fetch(msg.fileUrl);
      const blob = await res.blob();
      
      let finalBlob = blob;
      if (msg.encryptedAesKey && msg.iv) {
        finalBlob = await decryptFile(blob, msg.encryptedAesKey, msg.iv, user.privateKey);
      }
      
      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = msg.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleSend = async (e?: React.FormEvent, retryMessage?: any) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !retryMessage) || !user || !id) return;
    if (!contact && !group) return;

    const text = retryMessage ? retryMessage.text : inputText;
    const messageId = retryMessage ? retryMessage.id : crypto.randomUUID();
    
    if (!retryMessage) {
      setInputText('');
      setIsTyping(false);
    }

    try {
      if (!retryMessage) {
        addMessage(id, {
          id: messageId,
          from: user.id,
          to: id,
          text,
          timestamp: Date.now(),
          status: 'sending',
          isDisappearing: isViewOnce || !!selfDestructTimer || !!disappearingTimer || isEphemeralMode,
          expiresAt: isEphemeralMode ? Date.now() + 60000 : (disappearingTimer ? Date.now() + disappearingTimer : (isSecretChat ? undefined : Date.now() + 24 * 60 * 60 * 1000)),
          isViewOnce: isViewOnce || isEphemeralMode,
          isAnonymous: privacySettings.anonymousMode,
          senderName: privacySettings.anonymousMode ? tempUsername : undefined,
        });
      } else {
        updateMessage(id, messageId, { status: 'sending' });
      }

      const encryptedMessage = isGroup ? text : await encryptMessage(text, contact!.publicKey);
      const timestamp = Date.now();
      const expiresAt = isEphemeralMode ? timestamp + 60000 : (disappearingTimer ? timestamp + disappearingTimer : (isSecretChat ? undefined : timestamp + 24 * 60 * 60 * 1000));

      const msgData = {
        id: messageId,
        to: id,
        from: user.id,
        encryptedMessage,
        timestamp,
        isDisappearing: isViewOnce || !!selfDestructTimer || !!disappearingTimer || isEphemeralMode,
        isViewOnce: isViewOnce || isEphemeralMode,
        isSecretChat,
        selfDestructTimer,
        expiresAt,
        isGroup,
        isAnonymous: privacySettings.anonymousMode,
        senderName: privacySettings.anonymousMode ? tempUsername : undefined,
      };

      socket.emit('message', msgData);
      
      if (isViewOnce && !isEphemeralMode) setIsViewOnce(false);
      if (!isGroup) updateStreak(id);
      
      // Update to sent
      updateMessage(id, messageId, { status: 'sent' });
    } catch (err) {
      console.error('Encryption or send failed', err);
      updateMessage(id, messageId, { status: 'failed' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id || !contact) return;

    setIsUploading(true);
    const messageId = crypto.randomUUID();

    try {
      // 1. Add placeholder message
      addMessage(id, {
        id: messageId,
        from: user.id,
        to: id,
        text: `Sending ${file.name}...`,
        timestamp: Date.now(),
        status: 'sending',
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        fileName: file.name,
        fileSize: file.size,
        isDisappearing: isViewOnce || !!selfDestructTimer || !!disappearingTimer || isEphemeralMode,
        expiresAt: isEphemeralMode ? Date.now() + 60000 : (disappearingTimer ? Date.now() + disappearingTimer : (isSecretChat ? undefined : Date.now() + 24 * 60 * 60 * 1000)),
        isViewOnce: isViewOnce || isEphemeralMode,
        isAnonymous: privacySettings.anonymousMode,
        senderName: privacySettings.anonymousMode ? tempUsername : undefined,
      });

      // 2. Encrypt file
      const { encryptedFile, encryptedAesKey, iv } = await encryptFile(file, contact.publicKey);

      // 3. Upload encrypted file
      const formData = new FormData();
      formData.append('file', encryptedFile, file.name);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      // 4. Send message with file info
      const timestamp = Date.now();
      const expiresAt = isEphemeralMode ? timestamp + 60000 : (disappearingTimer ? timestamp + disappearingTimer : (isSecretChat ? undefined : timestamp + 24 * 60 * 60 * 1000));

      const msgData = {
        id: messageId,
        to: id,
        from: user.id,
        encryptedMessage: await encryptMessage(`[File: ${file.name}]`, contact.publicKey),
        timestamp,
        isGroup,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        encryptedAesKey,
        iv,
        isDisappearing: isViewOnce || !!selfDestructTimer || !!disappearingTimer || isEphemeralMode,
        isViewOnce: isViewOnce || isEphemeralMode,
        isSecretChat,
        selfDestructTimer,
        expiresAt,
        isAnonymous: privacySettings.anonymousMode,
        senderName: privacySettings.anonymousMode ? tempUsername : undefined,
      };

      socket.emit('message', msgData);
      if (isViewOnce && !isEphemeralMode) setIsViewOnce(false);
      updateMessage(id, messageId, { status: 'sent', fileUrl: url });
    } catch (err) {
      console.error('File send failed', err);
      updateMessage(id, messageId, { status: 'failed' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping && id) {
      setIsTyping(true);
      socket.emit('typing', { to: id, from: user?.id, isGroup });
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages.length % 5 === 0) {
      const recentMessages = chatMessages.slice(-10).map(m => m.text).join('\n');
      noxaAI.detectMood(recentMessages).then(mood => {
        if (mood) setCurrentMood(mood);
      });
    }
  }, [chatMessages.length]);

  const handleSummarize = async () => {
    if (chatMessages.length === 0) return;
    setIsSummarizing(true);
    setShowSummary(true);
    try {
      const history = chatMessages.slice(-50).map(m => ({ sender: m.from === user?.id ? 'Me' : chatName, text: m.text }));
      const summary = await noxaAI.summarizeConversation(history);
      setSummaryText(summary || 'Could not generate summary.');
    } catch (err) {
      setSummaryText('Error generating summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async (messageId: string, text: string) => {
    setIsTranslating(messageId);
    try {
      const translated = await noxaAI.translateMessage(text, 'English'); // Default to English for now
      if (translated) {
        setTranslations(prev => ({ ...prev, [messageId]: translated }));
      }
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setIsTranslating(null);
    }
  };

  const handleToggleLock = () => {
    if (contact?.isLocked) {
      updateContact(id!, { isLocked: false, lockType: 'none', lockSecret: '' });
    } else {
      setShowLockSetup(true);
      setSetupStep('type');
    }
  };

  const handleTypeSelect = (type: AppLockType) => {
    setTempLockType(type);
    setSetupStep('input');
    setTempSecret('');
  };

  const handleSecretInput = (secret: string) => {
    setTempSecret(secret);
    setSetupStep('confirm');
  };

  const handleSecretConfirm = (secret: string) => {
    if (secret === tempSecret) {
      updateContact(id!, { 
        isLocked: true, 
        lockType: tempLockType, 
        lockSecret: secret 
      });
      setShowLockSetup(false);
      setSetupError(false);
    } else {
      setSetupError(true);
      setTimeout(() => setSetupError(false), 1000);
    }
  };

  const theme = useStore((state) => state.theme);

  if (!contact && !group) {
    if (isFetchingProfile) {
      return (
        <div className={clsx(
          "flex-1 flex flex-col items-center justify-center transition-colors duration-200",
          theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
        )}>
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Loading secure chat...</p>
        </div>
      );
    }
    return null;
  }

  const chatInfo = isGroup ? group : contact;
  const chatName = isGroup ? group!.name : (contact!.customName || contact!.displayName || contact!.username);
  const chatAvatar = isGroup ? group!.avatarUrl : contact!.avatarUrl;
  const chatInitial = isGroup ? group!.name.charAt(0).toUpperCase() : (contact!.customName ? contact!.customName.charAt(0).toUpperCase() : contact!.username.charAt(0).toUpperCase());
  const isOnline = isGroup ? false : contact!.isOnline;

  return (
    <div className={clsx(
      "flex-1 flex flex-col h-full relative transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <ChatLockOverlay contactId={id!} />
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold relative overflow-hidden">
              {chatAvatar ? (
                <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                chatInitial
              )}
              {!isGroup && (
                <div className={clsx(
                  "absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-zinc-900 rounded-full z-10 transition-colors",
                  isOnline ? "bg-emerald-500" : "bg-zinc-600"
                )} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-zinc-100">{chatName}</h2>
                {currentMood && (
                  <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-bold border border-indigo-500/20 animate-pulse">
                    {currentMood}
                  </div>
                )}
                {contact?.streakCount && contact.streakCount > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-bold border border-orange-500/20">
                    🔥 {contact.streakCount}
                  </div>
                )}
                {contact?.isMuted && <BellOff className="w-3.5 h-3.5 text-zinc-500" />}
                {isGroup && (
                  <button 
                    onClick={() => setShowGroupSettings(true)}
                    className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-indigo-400"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                {isGroup ? (
                  <span>{group!.members.length} Members</span>
                ) : isOnline ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span>Offline</span>
                )}
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {isGroup ? 'Group' : 'E2EE'}
                </span>
                {isEphemeralMode && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      <Clock className="w-3 h-3" /> Ephemeral
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          {!isGroup && (
            <>
              <button 
                onClick={() => {
                  setCallType('voice');
                  setShowCallConfirm(true);
                }}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setCallType('video');
                  setShowCallConfirm(true);
                }}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={clsx(
              "p-2 rounded-full transition-colors",
              showMenu ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-40 overflow-hidden"
                >
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setShowNicknameModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    <UserCog className="w-4 h-4 text-indigo-400" />
                    Set Nickname
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setCallType('voice');
                      setShowCallConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    Voice Call
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setCallType('video');
                      setShowCallConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    <Video className="w-4 h-4 text-indigo-400" />
                    Video Call
                  </button>
                  {!isGroup && contact && (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        setIsSecretChat(!isSecretChat);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                    >
                      {isSecretChat ? (
                        <>
                          <Shield className="w-4 h-4 text-emerald-400" />
                          Disable Secret Chat
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 text-zinc-400" />
                          Start Secret Chat
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      toggleEphemeralMode();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    {isEphemeralMode ? (
                      <>
                        <Clock className="w-4 h-4 text-indigo-400" />
                        Disable Ephemeral Messages
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-zinc-400" />
                        Enable Ephemeral Messages
                      </>
                    )}
                  </button>
                  {!isGroup && contact && (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        updateContact(contact.id, { isMuted: !contact.isMuted });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                    >
                      {contact.isMuted ? (
                        <>
                          <Bell className="w-4 h-4 text-emerald-400" />
                          Unmute Notifications
                        </>
                      ) : (
                        <>
                          <BellOff className="w-4 h-4 text-zinc-400" />
                          Mute Notifications
                        </>
                      )}
                    </button>
                  )}
                  {!isGroup && contact && (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        handleToggleLock();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                    >
                      {contact.isLocked ? (
                        <>
                          <Lock className="w-4 h-4 text-amber-400" />
                          Unlock Chat (Disable)
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-zinc-400" />
                          Lock Chat
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setShowAnonymousSettings(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    <Ghost className="w-4 h-4 text-emerald-400" />
                    Anonymous Mode
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      handleSummarize();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-semibold border-b border-zinc-800/50"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Summarize Chat (AI)
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setShowClearConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-rose-500 hover:bg-rose-500/10 transition-colors text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Chat History
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Call Confirmation Modal */}
      <AnimatePresence>
        {showCallConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCallConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className={clsx(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg",
                callType === 'voice' ? "bg-emerald-500/20 text-emerald-500" : "bg-indigo-500/20 text-indigo-500"
              )}>
                {callType === 'voice' ? <Phone className="w-10 h-10" /> : <Video className="w-10 h-10" />}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {callType === 'voice' ? 'Voice Call' : 'Video Call'}
              </h3>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                {callType === 'video' 
                  ? <>Are you sure you want to initiate a video call with <span className="text-zinc-100 font-bold">{contact?.customName || contact?.displayName || contact?.username}</span>?</>
                  : <>Are you sure you want to initiate a voice call with <span className="text-zinc-100 font-bold">{contact?.customName || contact?.displayName || contact?.username}</span>?</>
                }
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCallConfirm(false);
                    startCall(callType);
                  }}
                  className={clsx(
                    "w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg",
                    callType === 'voice' 
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                  )}
                >
                  Call
                </button>
                <button
                  onClick={() => setShowCallConfirm(false)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {callStatus === 'ringing' && incomingCallData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-between py-20 px-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center text-4xl font-bold text-zinc-400 mb-8 relative">
                {incomingCallData.avatarUrl ? (
                  <img src={incomingCallData.avatarUrl} alt="Incoming" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  (incomingCallData.username || incomingCallData.from).charAt(0).toUpperCase()
                )}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-indigo-500 rounded-full -z-10"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {incomingCallData.username || 'Incoming Call'}
              </h2>
              
              {callError ? (
                <ErrorMessage 
                  message={callError} 
                  type={callError.includes('permission') ? 'permission' : 'connection'} 
                  className="mt-4 max-w-xs"
                />
              ) : (
                <p className="text-indigo-400 font-medium italic">Incoming {callType} Call...</p>
              )}
            </div>

            <div className="flex items-center gap-12">
              <button
                onClick={rejectCall}
                className="w-20 h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/40 transition-all transform hover:scale-110 active:scale-95"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button
                onClick={acceptCall}
                className="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-600/40 transition-all transform hover:scale-110 active:scale-95"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calling Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-between py-20 px-6"
          >
            {/* Media Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={clsx(
                  "w-full h-full object-cover transition-opacity duration-500",
                  callType === 'voice' ? "opacity-0" : "opacity-100"
                )}
              />
              
              {callType === 'video' && (
                <div className="absolute top-6 right-6 w-32 aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={clsx(
                      "w-full h-full object-cover",
                      isCameraOff && "hidden"
                    )}
                  />
                  {isCameraOff && (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <EyeOff className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              {callType === 'voice' && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center text-4xl font-bold text-zinc-400 mb-8 relative"
                >
                  {contact?.avatarUrl ? (
                    <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    contact?.username.charAt(0).toUpperCase()
                  )}
                  {callStatus !== 'connected' && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-indigo-500 rounded-full -z-10"
                    />
                  )}
                </motion.div>
              )}
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {contact?.customName || contact?.displayName || contact?.username}
              </h2>
              
              {callError ? (
                <ErrorMessage 
                  message={callError} 
                  type={callError.includes('permission') ? 'permission' : 'connection'} 
                  className="mt-4 max-w-xs"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-indigo-400 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {callStatus === 'connected' ? 'Connected' : `Secure ${callType} Call...`}
                  </p>
                  {callStatus === 'connected' && (
                    <p className="text-zinc-500 text-sm font-mono tracking-wider">
                      {formatDuration(callDuration)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-12 w-full max-w-xs relative z-10">
              <div className="flex items-center justify-center gap-6 w-full">
                <button 
                  onClick={toggleMute}
                  className={clsx(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isMutedCall ? "bg-white text-zinc-950" : "bg-zinc-900 text-white hover:bg-zinc-800"
                  )}
                >
                  {isMutedCall ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <button 
                  onClick={toggleSpeakerphone}
                  className={clsx(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isSpeakerphoneOn ? "bg-white text-zinc-950" : "bg-zinc-900 text-white hover:bg-zinc-800"
                  )}
                >
                  {isSpeakerphoneOn ? <Volume2 className="w-5 h-5" /> : <Volume className="w-5 h-5" />}
                </button>

                {callType === 'video' && (
                  <>
                    <button 
                      onClick={toggleCamera}
                      className={clsx(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                        isCameraOff ? "bg-white text-zinc-950" : "bg-zinc-900 text-white hover:bg-zinc-800"
                      )}
                    >
                      {isCameraOff ? <EyeOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                    
                    <button 
                      onClick={switchCamera}
                      className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={endCall}
                className="w-20 h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/40 transition-all transform hover:scale-110 active:scale-95"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nickname Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNicknameModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Set Nickname</h3>
                <button onClick={() => setShowNicknameModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter custom name..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    autoFocus
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 ml-1">This name is only visible to you.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (id) {
                        useStore.getState().updateContact(id, { customName: nickname.trim() || undefined });
                        setShowNicknameModal(false);
                      }
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Save Nickname
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Anonymous Mode Settings Modal */}
      <AnimatePresence>
        {showAnonymousSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAnonymousSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Ghost className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Anonymous Mode</h3>
                </div>
                <button onClick={() => setShowAnonymousSettings(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-white">Enable Anonymous Mode</p>
                    <p className="text-[10px] text-zinc-500">Hide your real identity in this chat.</p>
                  </div>
                  <button
                    onClick={() => setPrivacySettings({ anonymousMode: !privacySettings.anonymousMode })}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-all relative",
                      privacySettings.anonymousMode ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  >
                    <motion.div
                      animate={{ x: privacySettings.anonymousMode ? 26 : 2 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {privacySettings.anonymousMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Temporary Username</label>
                    <input
                      type="text"
                      value={tempNameInput}
                      onChange={(e) => setTempNameInput(e.target.value)}
                      placeholder="e.g. ShadowWalker"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1 ml-1">This name will be shown to others instead of your real name.</p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (privacySettings.anonymousMode) {
                        setTempUsername(tempNameInput.trim() || 'Anonymous');
                      }
                      setShowAnonymousSettings(false);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Clear Chat?</h3>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Are you sure you want to clear this chat history? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (id) {
                      clearMessages(id);
                      setShowClearConfirm(false);
                    }
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-600/20"
                >
                  Clear History
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteMessageConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteMessageConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Message?</h3>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Are you sure you want to delete this message? This action will replace the message content with a deletion notice.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (id && showDeleteMessageConfirm) {
                      deleteMessage(id, showDeleteMessageConfirm);
                      setShowDeleteMessageConfirm(null);
                    }
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-600/20"
                >
                  Delete for Everyone
                </button>
                <button
                  onClick={() => setShowDeleteMessageConfirm(null)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure Mode Overlay */}
      <AnimatePresence>
        {secureMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md z-10 flex items-center justify-center"
          >
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center max-w-[80%]">
              <EyeOff className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Secure Mode Active</h3>
              <p className="text-sm text-zinc-400">Screen recording detected. Content is hidden to protect privacy.</p>
              <button 
                onClick={() => setSecureMode(false)}
                className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Lock Setup Modal */}
      <AnimatePresence>
        {showLockSetup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setShowLockSetup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Lock className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {setupStep === 'type' && 'Lock Chat'}
                  {setupStep === 'input' && `Set ${tempLockType.toUpperCase()}`}
                  {setupStep === 'confirm' && `Confirm ${tempLockType.toUpperCase()}`}
                </h3>
                <p className="text-sm text-zinc-500 mt-2">
                  {setupStep === 'type' && 'Choose how to lock this conversation'}
                  {setupStep === 'input' && `Enter your new ${tempLockType}`}
                  {setupStep === 'confirm' && 'Enter it one more time to confirm'}
                </p>
              </div>

              {setupStep === 'type' && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'pin', label: 'PIN Code', desc: '4-6 digit numeric code', icon: Shield },
                    { id: 'pattern', label: 'Pattern', desc: 'Connect dots in a sequence', icon: Palette },
                    { id: 'alphabetic', label: 'Password', desc: 'Alphanumeric characters', icon: Key },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id as AppLockType)}
                      className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group text-left"
                    >
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:text-indigo-400 transition-colors">
                        <type.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-zinc-100">{type.label}</div>
                        <div className="text-xs text-zinc-500">{type.desc}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-indigo-400" />
                    </button>
                  ))}
                </div>
              )}

              {setupStep === 'input' && (
                <div className="flex flex-col items-center">
                  {tempLockType === 'pattern' && <PatternLock onComplete={handleSecretInput} />}
                  {tempLockType === 'pin' && <PinLock onComplete={handleSecretInput} />}
                  {tempLockType === 'alphabetic' && <PasswordLock onComplete={handleSecretInput} />}
                </div>
              )}

              {setupStep === 'confirm' && (
                <div className="flex flex-col items-center">
                  {tempLockType === 'pattern' && <PatternLock onComplete={handleSecretConfirm} error={setupError} />}
                  {tempLockType === 'pin' && <PinLock onComplete={handleSecretConfirm} error={setupError} />}
                  {tempLockType === 'alphabetic' && <PasswordLock onComplete={handleSecretConfirm} error={setupError} />}
                  
                  {setupError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-red-500 text-xs font-bold uppercase tracking-widest"
                    >
                      Secrets do not match
                    </motion.p>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (setupStep === 'type') setShowLockSetup(false);
                  else if (setupStep === 'input') setSetupStep('type');
                  else setSetupStep('input');
                }}
                className="w-full mt-8 py-4 text-zinc-500 hover:text-zinc-300 font-bold text-sm transition-colors"
              >
                {setupStep === 'type' ? 'Cancel' : 'Back'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a] relative">
        <div className="text-center my-6">
          <div className="inline-flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            Messages are end-to-end encrypted. No one outside of this chat, not even NOXA, can read or listen to them.
          </div>
        </div>

        {chatMessages.map((msg, index) => {
          const isMe = msg.from === user?.id;
          const showAvatar = !isMe && (index === 0 || chatMessages[index - 1].from !== msg.from);
          
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-4 w-full">
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-full px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={clsx('flex w-full', isMe ? 'justify-end' : 'justify-start')}
            >
              <div className={clsx('flex max-w-[75%] gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                {!isMe && (
                  <div className="w-8 flex-shrink-0 flex items-end">
                    {showAvatar && (
                      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden">
                        {msg.isAnonymous ? (
                          <Ghost className="w-4 h-4 text-emerald-400" />
                        ) : (
                          contact?.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <motion.div
                  layout
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!msg.isDeleted) {
                      setShowReactionPicker(msg.id);
                      setSelectedMessageId(msg.id);
                    }
                  }}
                  onClick={() => {
                    if (!msg.isDeleted) {
                      if (msg.isViewOnce && !isMe && msg.status !== 'read') {
                        updateMessage(id, msg.id, { status: 'read', readAt: Date.now() });
                        socket.emit('viewed', { id: msg.id, from: user.id, to: msg.from, isViewOnce: true });
                        // Delete after 10 seconds
                        setTimeout(() => deleteMessage(id, msg.id), 10000);
                      } else {
                        setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                      }
                    }
                  }}
                  className="flex flex-col"
                >
                  {msg.isAnonymous && !isMe && showAvatar && (
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 ml-1">
                      {msg.senderName || 'Anonymous'}
                    </span>
                  )}
                  {msg.isAnonymous && isMe && (
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 mr-1 text-right">
                      You (Anonymous: {msg.senderName || 'Anonymous'})
                    </span>
                  )}
                  <div className={clsx(
                    'px-4 py-2.5 rounded-2xl relative group cursor-pointer transition-all duration-300',
                    isMe 
                      ? clsx(
                          'bg-indigo-600 text-white rounded-br-sm self-end',
                          msg.status === 'read' && 'shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-400/30',
                          msg.isDeleted && 'bg-zinc-800/50 text-zinc-500 border border-zinc-800'
                        ) 
                      : clsx(
                          'bg-zinc-800 text-zinc-100 rounded-bl-sm self-start',
                          msg.isDeleted && 'bg-zinc-900/50 text-zinc-600 border border-zinc-800'
                        ),
                    selectedMessageId === msg.id && 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950'
                  )}>
                  {/* Attachment Rendering */}
                  {msg.type && msg.type !== 'text' && msg.fileUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/20 border border-white/5">
                      {msg.type === 'image' ? (
                        <div className="relative group/img">
                          <img 
                            src={msg.fileUrl} 
                            alt={msg.fileName} 
                            className="max-w-full h-auto max-h-[300px] object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(msg); }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Download className="w-8 h-8 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            {msg.type === 'video' ? <Play className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{msg.fileName}</div>
                            <div className="text-[10px] opacity-60">{(msg.fileSize! / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(msg); }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <p className={clsx(
                    "text-[15px] leading-relaxed break-words",
                    msg.isDeleted && "italic text-sm opacity-60",
                    msg.isViewOnce && !isMe && msg.status !== 'read' && "italic text-zinc-500"
                  )}>
                    {msg.isViewOnce && !isMe && msg.status !== 'read' ? (
                      <span className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        View once message. Click to open.
                      </span>
                    ) : msg.text}
                  </p>
                  
                  {translations[msg.id] && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] italic text-zinc-400">
                      <div className="flex items-center gap-1 mb-1 opacity-50">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Translated</span>
                      </div>
                      {translations[msg.id]}
                    </div>
                  )}
                  
                  <div className={clsx(
                    'flex items-center gap-1.5 mt-1 text-[10px] font-medium',
                    isMe ? 'justify-end text-indigo-100/60' : 'justify-start text-zinc-500'
                  )}>
                    {msg.isDisappearing && <Clock className="w-3 h-3" />}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && !msg.isDeleted && (
                        <span className="flex items-center">
                          <AnimatePresence mode="wait">
                            {msg.status === 'read' ? (
                              <motion.div key="read" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                              </motion.div>
                            ) : msg.status === 'delivered' ? (
                              <motion.div key="delivered" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                                <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                              </motion.div>
                            ) : msg.status === 'sent' ? (
                              <motion.div key="sent" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                                <Check className="w-3.5 h-3.5 text-zinc-400" />
                              </motion.div>
                            ) : msg.status === 'failed' ? (
                              <motion.div key="failed" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              </motion.div>
                            ) : (
                              <motion.div key="sending" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                                <Clock className="w-3 h-3 text-zinc-500 animate-pulse" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </span>
                    )}
                  </div>

                  </div>
                  
                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={clsx(
                      "absolute -bottom-3 flex gap-1 z-10",
                      isMe ? "right-0" : "left-0"
                    )}>
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation();
                            reactToMessage(id!, msg.id, emoji);
                          }}
                          className={clsx(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all",
                            userIds.includes(user!.id)
                              ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <span>{emoji}</span>
                          {userIds.length > 1 && <span>{userIds.length}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction Picker Overlay */}
                  <AnimatePresence>
                    {showReactionPicker === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={clsx(
                          "absolute bottom-full mb-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-full p-1.5 shadow-2xl z-50 flex gap-1",
                          isMe ? "right-0" : "left-0"
                        )}
                      >
                        {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              reactToMessage(id!, msg.id, emoji);
                              setShowReactionPicker(null);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-full transition-colors text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message Details Overlay */}
                  <AnimatePresence>
                    {selectedMessageId === msg.id && !msg.isDeleted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={clsx(
                          "absolute bottom-full mb-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl z-50 min-w-[180px]",
                          isMe ? "right-0" : "left-0"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                          <div className={clsx(
                            "w-2 h-2 rounded-full",
                            msg.status === 'read' ? "bg-sky-400" : msg.status === 'delivered' ? "bg-zinc-400" : "bg-zinc-600"
                          )} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                            {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Sent</span>
                            <span className="text-zinc-100 text-[10px] font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          {msg.status === 'delivered' && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Delivered</span>
                              <span className="text-zinc-100 text-[10px] font-mono">{msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleTimeString() : '—'}</span>
                            </div>
                          )}
                          {msg.status === 'read' && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sky-500 text-[10px] uppercase tracking-wider font-bold">Read</span>
                              <span className="text-sky-400 text-[10px] font-mono">{msg.readAt ? new Date(msg.readAt).toLocaleTimeString() : '—'}</span>
                            </div>
                          )}
                          
                          {isMe && msg.status === 'failed' && (
                            <div className="pt-2 mt-2 border-t border-zinc-800">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSend(undefined, msg);
                                  setSelectedMessageId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry Send
                              </button>
                            </div>
                          )}
                          
                          {isMe && (
                            <div className="pt-2 mt-2 border-t border-zinc-800">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteMessageConfirm(msg.id);
                                  setSelectedMessageId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Message
                              </button>
                            </div>
                          )}

                          <div className="pt-2 mt-2 border-t border-zinc-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTranslate(msg.id, msg.text);
                                setSelectedMessageId(null);
                              }}
                              disabled={!!isTranslating}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                            >
                              {isTranslating === msg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              Translate to English
                            </button>
                          </div>
                          
                          <div className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionPicker(msg.id);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Smile className="w-3.5 h-3.5" />
                              React
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
        {remoteTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-zinc-500 text-xs pl-12 py-1"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="font-medium italic">{(contact?.displayName || contact?.username || 'Someone')} is typing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setIsViewOnce(!isViewOnce)}
            className={clsx(
              "p-3 transition-colors rounded-xl",
              isViewOnce ? "bg-amber-500/20 text-amber-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
            title="View Once"
          >
            <EyeOff className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsSecretChat(!isSecretChat)}
            className={clsx(
              "p-3 transition-colors rounded-xl",
              isSecretChat ? "bg-emerald-500/20 text-emerald-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
            title="Secret Chat"
          >
            <Lock className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsViewOnce(!isViewOnce)}
            className={clsx(
              "p-3 transition-colors rounded-xl",
              isViewOnce ? "bg-indigo-500/20 text-indigo-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
            title="View Once"
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSelfDestructTimer(prev => prev === 5000 ? null : 5000)}
            className={clsx(
              "p-3 transition-colors rounded-xl",
              selfDestructTimer ? "bg-rose-500/20 text-rose-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
            title="Self Destruct (5s)"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-3 text-zinc-400 hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-800 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl flex items-end focus-within:border-indigo-500/50 focus-within:bg-zinc-800 transition-all">
            <button type="button" className="p-3 text-zinc-400 hover:text-zinc-200 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={handleTypingChange}
              placeholder="Message securely..."
              className="flex-1 bg-transparent border-none py-3 px-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-0 text-[15px]"
              autoComplete="off"
            />
            <button 
              type="button" 
              onClick={() => setDisappearingTimer(disappearingTimer ? null : 60000)}
              className={clsx(
                "p-3 transition-colors",
                disappearingTimer ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
      {/* AI Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowSummary(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Chat Summary</h3>
                    <p className="text-xs text-zinc-500">Generated by Aria AI</p>
                  </div>
                </div>
                <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-zinc-400 animate-pulse">Aria is reading your messages...</p>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{summaryText}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-full mt-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GroupSettingsModal
        isOpen={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        groupId={id!}
      />
    </div>
  );
}
