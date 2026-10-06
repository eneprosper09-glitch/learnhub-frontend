import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const instance = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    instance.on('connect', () => {
      console.log('🔌 Socket connected');
      setConnected(true);
    });

    instance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    instance.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
      setConnected(false);
    });

    socketRef.current = instance;
    setSocket(instance);

    return () => {
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  // ---------------- Conversations ----------------

  const joinConversation = (conversationId) => {
    if (!socketRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      socketRef.current.emit('conversation:join', { conversationId }, (res) => {
        resolve(!!res?.ok);
      });
    });
  };

  const leaveConversation = (conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('conversation:leave', { conversationId });
  };

  const sendTyping = (conversationId, isTyping) => {
    if (!socketRef.current) return;
    socketRef.current.emit('conversation:typing', { conversationId, isTyping });
  };

  const onNewMessage = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('message:new', handler);
    return () => socketRef.current?.off('message:new', handler);
  };

  const onTyping = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('conversation:typing', handler);
    return () => socketRef.current?.off('conversation:typing', handler);
  };

  // ---------------- Call signaling ----------------
  //
  // These emit/relay small notifications for 1-to-1 calls and group-call
  // start/stop events. The actual audio/video never touches this socket —
  // it goes through LiveKit. See backend/src/socket/index.js for the
  // server side of these events.

  const emitCallInvite = (toUserId, kind) => {
    if (!socketRef.current) return Promise.resolve({ ok: false });
    return new Promise((resolve) => {
      socketRef.current.emit(
        'call:invite',
        { toUserId, kind: kind === 'video' ? 'video' : 'audio' },
        (res) => resolve(res || { ok: false })
      );
    });
  };

  const emitCallAccept = (toUserId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('call:accept', { toUserId });
  };

  const emitCallReject = (toUserId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('call:reject', { toUserId });
  };

  const emitCallCancel = (toUserId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('call:cancel', { toUserId });
  };

  const onCallIncoming = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('call:incoming', handler);
    return () => socketRef.current?.off('call:incoming', handler);
  };

  const onCallAccepted = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('call:accepted', handler);
    return () => socketRef.current?.off('call:accepted', handler);
  };

  const onCallRejected = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('call:rejected', handler);
    return () => socketRef.current?.off('call:rejected', handler);
  };

  const onCallCancelled = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('call:cancelled', handler);
    return () => socketRef.current?.off('call:cancelled', handler);
  };

  // Group-call start/end notices. These are emitted into the group
  // conversation room, so the handler receives events for conversations
  // the client is currently joined to.
  const onGroupCallStarted = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('group-call:started', handler);
    return () => socketRef.current?.off('group-call:started', handler);
  };

  const onGroupCallEnded = (handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('group-call:ended', handler);
    return () => socketRef.current?.off('group-call:ended', handler);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        // conversations
        joinConversation,
        leaveConversation,
        sendTyping,
        onNewMessage,
        onTyping,
        // calls
        emitCallInvite,
        emitCallAccept,
        emitCallReject,
        emitCallCancel,
        onCallIncoming,
        onCallAccepted,
        onCallRejected,
        onCallCancelled,
        onGroupCallStarted,
        onGroupCallEnded,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};