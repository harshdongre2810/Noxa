import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { socket } from '../lib/socket';
import { decryptMessage, encryptMessage } from '../lib/crypto';

export default function SocketManager() {
  const user = useStore((state) => state.user);
  const contacts = useStore((state) => state.contacts);
  const addMessage = useStore((state) => state.addMessage);
  const updateMessage = useStore((state) => state.updateMessage);
  const markMessagesAsRead = useStore((state) => state.markMessagesAsRead);
  const markMessagesAsDelivered = useStore((state) => state.markMessagesAsDelivered);
  const setContactStatus = useStore((state) => state.setContactStatus);
  const cleanupExpiredMessages = useStore((state) => state.cleanupExpiredMessages);

  useEffect(() => {
    if (!user) return;

    const cleanupInterval = setInterval(() => {
      cleanupExpiredMessages();
    }, 1000);

    socket.connect();
    socket.emit('register', user.id);
    socket.emit('get_online_users');

    const handleMessage = async (data: any) => {
      try {
        let decryptedText = data.encryptedMessage;
        if (!data.isGroup) {
          decryptedText = await decryptMessage(data.encryptedMessage, user.privateKey);
        }
        
        const targetId = data.isGroup ? data.to : data.from;

        // Add message to store
        addMessage(targetId, {
          id: data.id || crypto.randomUUID(),
          from: data.from,
          to: data.to,
          text: decryptedText,
          timestamp: data.timestamp,
          status: 'delivered',
          isDisappearing: data.isDisappearing || data.isViewOnce || !!data.selfDestructTimer,
          isViewOnce: data.isViewOnce,
          selfDestructTimer: data.selfDestructTimer,
          expiresAt: data.expiresAt,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          encryptedAesKey: data.encryptedAesKey,
          iv: data.iv,
        });

        // Emit delivered receipt (encrypted if possible)
        if (!data.isGroup) {
          const sender = contacts[data.from];
          let encryptedId = data.id;
          if (sender?.publicKey) {
            try {
              encryptedId = await encryptMessage(data.id, sender.publicKey);
            } catch (e) {
              console.error('Failed to encrypt delivery receipt', e);
            }
          }
          socket.emit('delivered', { to: data.from, from: user.id, encryptedId });
        }
      } catch (err) {
        console.error('Global decryption failed', err);
      }
    };

    const handleRead = async (data: any) => {
      const targetId = data.isGroup ? data.to : data.from;
      let messageId = data.encryptedId;
      
      if (data.encryptedId && !data.isGroup) {
        try {
          messageId = await decryptMessage(data.encryptedId, user.privateKey);
        } catch (e) {
          console.error('Failed to decrypt read receipt', e);
        }
      }

      if (messageId) {
        updateMessage(targetId, messageId, { status: 'read', readAt: Date.now() });
      } else {
        markMessagesAsRead(targetId);
      }
    };

    const handleDelivered = async (data: any) => {
      const targetId = data.isGroup ? data.to : data.from;
      let messageId = data.encryptedId;

      if (data.encryptedId && !data.isGroup) {
        try {
          messageId = await decryptMessage(data.encryptedId, user.privateKey);
        } catch (e) {
          console.error('Failed to decrypt delivery receipt', e);
        }
      }

      if (messageId) {
        updateMessage(targetId, messageId, { status: 'delivered', deliveredAt: Date.now() });
      } else {
        markMessagesAsDelivered(targetId);
      }
    };

    const handleUserStatus = (data: { userId: string, status: 'online' | 'offline' }) => {
      setContactStatus(data.userId, data.status === 'online');
    };

    const handleOnlineUsers = (userIds: string[]) => {
      userIds.forEach(id => setContactStatus(id, true));
    };

    const handleScreenshot = (data: any) => {
      const targetId = data.from;
      addMessage(targetId, {
        id: crypto.randomUUID(),
        from: 'system',
        to: user.id,
        text: `${data.username} took a screenshot!`,
        timestamp: Date.now(),
        status: 'sent',
        type: 'system'
      });
    };

    const handleViewed = (data: any) => {
      const targetId = data.from;
      updateMessage(targetId, data.id, { status: 'read', readAt: Date.now() });
    };

    socket.on('message', handleMessage);
    socket.on('read', handleRead);
    socket.on('delivered', handleDelivered);
    socket.on('user_status', handleUserStatus);
    socket.on('online_users', handleOnlineUsers);
    socket.on('screenshot', handleScreenshot);
    socket.on('viewed', handleViewed);

    return () => {
      clearInterval(cleanupInterval);
      socket.off('message', handleMessage);
      socket.off('read', handleRead);
      socket.off('delivered', handleDelivered);
      socket.off('user_status', handleUserStatus);
      socket.off('online_users', handleOnlineUsers);
      socket.off('screenshot', handleScreenshot);
      socket.off('viewed', handleViewed);
      socket.disconnect();
    };
  }, [user, addMessage, markMessagesAsRead, markMessagesAsDelivered, setContactStatus]);

  return null;
}
