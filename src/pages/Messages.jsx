import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const timeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
};

// Mirror of backend/src/services/cloudinary.service.js CHAT_MIME_MAP.
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const VIDEO_MAX = 50 * 1024 * 1024;
const OTHER_MAX = 10 * 1024 * 1024;

const formatBytes = (n) => {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// Mirrors the backend's canSendMedia rule.
export const canSendMediaInConversation = (conversation, currentUserId) => {
  if (!conversation) return false;
  if (conversation.type === 'group') return true;
  if (conversation.type === 'direct') {
    const participants = conversation.participants || [];
    return participants.some((p) => {
      if (!p || typeof p !== 'object') return false;
      if (String(p._id) === String(currentUserId)) return false;
      return p.role === 'instructor' || p.role === 'admin';
    });
  }
  return false;
};

export default function Messages() {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, sendTyping, onNewMessage, onTyping } =
    useSocket();
  const { state: callState, startDirectCall } = useCall();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('c') || null;

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [sending, setSending] = useState(false);

  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: conversationsRes, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const conversations = Array.isArray(conversationsRes) ? conversationsRes : [];

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeId) || null,
    [conversations, activeId]
  );

  const mediaAllowed = canSendMediaInConversation(activeConversation, user?._id);

  // Determine the peer of a direct conversation.
  const directPeer = useMemo(() => {
    if (!activeConversation || activeConversation.type !== 'direct') return null;
    return (
      activeConversation.participants?.find(
        (p) => String(p._id) !== String(user?._id)
      ) || null
    );
  }, [activeConversation, user?._id]);

  // Whether a call button should show for this conversation.
  const canCall =
    activeConversation?.type === 'direct' &&
    directPeer &&
    (directPeer.role === 'instructor' || directPeer.role === 'admin');

  const conversationTitle = (c) => {
    if (!c) return '';
    if (c.type === 'group') return c.name || c.course?.title || 'Course chat';
    const other = c.participants?.find((p) => String(p._id) !== String(user?._id));
    return other?.name || 'Direct message';
  };

  const conversationSubtitle = (c) => {
    if (!c) return '';
    if (c.type === 'group') return `${c.participants?.length || 0} members`;
    const other = c.participants?.find((p) => String(p._id) !== String(user?._id));
    return other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : '';
  };

  // Reset composer attachment when switching conversations.
  useEffect(() => {
    setPendingAttachment(null);
    setUploading(false);
  }, [activeId]);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);

    api
      .get(`/conversations/${activeConversation._id}/messages?limit=50`)
      .then((r) => {
        if (cancelled) return;
        setMessages(r.data.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || 'Failed to load messages');
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    if (activeConversation) {
      joinConversation(activeConversation._id);
      api
        .put(`/conversations/${activeConversation._id}/read`)
        .then(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }))
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (activeConversation) leaveConversation(activeConversation._id);
    };
  }, [activeConversation, joinConversation, leaveConversation, queryClient]);

  useEffect(() => {
    const off = onNewMessage((payload) => {
      const { conversationId, message } = payload || {};
      if (!conversationId || !message) return;

      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (String(conversationId) !== String(activeId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });
    return () => off?.();
  }, [onNewMessage, queryClient, activeId]);

  useEffect(() => {
    const off = onTyping((payload) => {
      const { conversationId, userId, isTyping } = payload || {};
      if (String(conversationId) !== String(activeId)) return;
      if (String(userId) === String(user?._id)) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    });
    return () => off?.();
  }, [onTyping, activeId, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId, pendingAttachment]);

  const openConversation = (id) => {
    setParams({ c: id }, { replace: true });
  };

  const onDraftChange = (value) => {
    setDraft(value);
    if (!activeConversation) return;
    sendTyping(activeConversation._id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeConversation._id, false);
    }, 1500);
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeConversation || !mediaAllowed) return;

    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? VIDEO_MAX : OTHER_MAX;

    if (!ALLOWED_MIMES.has(file.type)) {
      toast.error(`Unsupported file type: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > limit) {
      toast.error(
        isVideo
          ? `Video must be under ${formatBytes(VIDEO_MAX)}`
          : `File must be under ${formatBytes(OTHER_MAX)}`
      );
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(
        `/conversations/${activeConversation._id}/attachments`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (!data?.data) {
        toast.error('Upload failed');
        return;
      }
      setPendingAttachment(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!activeConversation) return;
    if (!text && !pendingAttachment) return;

    setSending(true);
    const attachmentToSend = pendingAttachment;
    try {
      const payload = {};
      if (text) payload.body = text;
      if (attachmentToSend) payload.attachments = [attachmentToSend];

      const { data } = await api.post(
        `/conversations/${activeConversation._id}/messages`,
        payload
      );
      setMessages((prev) =>
        prev.some((m) => m._id === data.data._id) ? prev : [...prev, data.data]
      );
      setDraft('');
      setPendingAttachment(null);
      sendTyping(activeConversation._id, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
      if (attachmentToSend) setPendingAttachment(attachmentToSend);
    } finally {
      setSending(false);
    }
  };

  const typingNames = Object.entries(typingUsers)
    .filter(([, isTyping]) => isTyping)
    .map(([id]) => {
      const p = activeConversation?.participants?.find((x) => String(x._id) === id);
      return p?.name || 'Someone';
    });

  const startCall = (kind) => {
    if (!directPeer) return;
    if (callState !== 'idle' && callState !== 'ended') {
      toast.error('You are already in a call');
      return;
    }
    startDirectCall(
      { _id: directPeer._id, name: directPeer.name, avatarUrl: directPeer.avatarUrl },
      kind
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-black-900 rounded-3xl px-6 md:px-10 py-8 text-white">
        <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">
          Inbox
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Messages</h1>
        <p className="text-white/70 text-sm mt-1">
          Chat with your instructors and classmates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        <div className="lg:col-span-1 bg-white border border-black-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-black-100">
            <div className="text-sm font-semibold text-black-900">
              Conversations
            </div>
            <div className="text-xs text-black-500 mt-0.5">
              {conversations.length} total
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-6">
                <Spinner />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-black-500">
                No conversations yet. Open a course chat or start a direct message from
                someone's profile.
              </div>
            ) : (
              conversations.map((c) => {
                const active = c._id === activeId;
                return (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c._id)}
                    className={`w-full text-left px-4 py-3 border-b border-black-50 transition flex items-start gap-3 ${
                      active ? 'bg-black-900 text-white' : 'hover:bg-black-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : c.type === 'group'
                          ? 'bg-black-900 text-white'
                          : 'bg-black-100 text-black-700'
                      }`}
                    >
                      {c.type === 'group' ? '👥' : initials(conversationTitle(c))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`font-semibold text-sm truncate ${
                            active ? 'text-white' : 'text-black-900'
                          }`}
                        >
                          {conversationTitle(c)}
                        </div>
                        <div
                          className={`text-[10px] flex-shrink-0 ${
                            active ? 'text-white/60' : 'text-black-400'
                          }`}
                        >
                          {timeAgo(c.lastMessageAt || c.createdAt)}
                        </div>
                      </div>
                      <div
                        className={`text-xs truncate mt-0.5 ${
                          active ? 'text-white/70' : 'text-black-500'
                        }`}
                      >
                        {c.lastMessage || conversationSubtitle(c) || 'No messages yet'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-black-200 rounded-2xl overflow-hidden flex flex-col">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="font-display font-bold text-lg text-black-900 mb-1">
                Select a conversation
              </h2>
              <p className="text-sm text-black-500 max-w-sm">
                Choose a chat from the list on the left, or visit a course you are enrolled
                in and open its Chat tab.
              </p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-black-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-black-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {activeConversation.type === 'group'
                      ? '👥'
                      : initials(conversationTitle(activeConversation))}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-black-900 truncate">
                      {conversationTitle(activeConversation)}
                    </div>
                    <div className="text-xs text-black-500">
                      {activeConversation.type === 'group'
                        ? `${activeConversation.participants?.length || 0} members`
                        : conversationSubtitle(activeConversation)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canCall && (
                    <>
                      <button
                        type="button"
                        onClick={() => startCall('audio')}
                        disabled={callState !== 'idle' && callState !== 'ended'}
                        className="w-9 h-9 rounded-full border border-black-200 text-black-700 hover:bg-black-50 disabled:opacity-40 transition flex items-center justify-center"
                        title="Voice call"
                        aria-label="Voice call"
                      >
                        📞
                      </button>
                      <button
                        type="button"
                        onClick={() => startCall('video')}
                        disabled={callState !== 'idle' && callState !== 'ended'}
                        className="w-9 h-9 rounded-full border border-black-200 text-black-700 hover:bg-black-50 disabled:opacity-40 transition flex items-center justify-center"
                        title="Video call"
                        aria-label="Video call"
                      >
                        📹
                      </button>
                    </>
                  )}

                  {activeConversation.type === 'group' && activeConversation.course && (
                    <Link
                      to={`/courses/${
                        activeConversation.course._id || activeConversation.course
                      }`}
                      className="text-xs font-semibold text-black-700 hover:text-black-900 whitespace-nowrap"
                    >
                      View course →
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-black-50/50">
                {loadingMessages ? (
                  <div className="py-10 flex justify-center">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-sm text-black-500">
                    No messages yet. Say hello.
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = String(m.sender?._id) === String(user?._id);
                    const hasAttachments =
                      Array.isArray(m.attachments) && m.attachments.length > 0;
                    return (
                      <div
                        key={m._id}
                        className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            mine
                              ? 'bg-black-900 text-white'
                              : 'bg-white border border-black-200 text-black-700'
                          }`}
                        >
                          {initials(m.sender?.name)}
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            mine
                              ? 'bg-black-900 text-white'
                              : 'bg-white border border-black-200 text-black-800'
                          }`}
                        >
                          {!mine && activeConversation.type === 'group' && (
                            <div className="text-[10px] font-bold text-black-500 mb-1 uppercase tracking-wider">
                              {m.sender?.name}
                            </div>
                          )}

                          {m.body ? (
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {m.body}
                            </div>
                          ) : null}

                          {hasAttachments && (
                            <div className={`${m.body ? 'mt-2' : ''} space-y-2`}>
                              {m.attachments.map((a, i) => (
                                <AttachmentView
                                  key={i}
                                  attachment={a}
                                  mine={mine}
                                />
                              ))}
                            </div>
                          )}

                          <div
                            className={`text-[10px] mt-1 ${
                              mine ? 'text-white/60' : 'text-black-400'
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {typingNames.length > 0 && (
                <div className="px-5 py-1 text-xs text-black-500 italic">
                  {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <form
                onSubmit={sendMessage}
                className="border-t border-black-100"
              >
                {pendingAttachment && (
                  <div className="flex items-center gap-2 border-b border-black-100 bg-black-50 px-3 py-2">
                    <div className="min-w-0 flex-1 text-xs text-black-700">
                      <div className="truncate font-semibold">
                        {pendingAttachment.name}
                      </div>
                      <div className="text-black-500">
                        {formatBytes(pendingAttachment.size)} · will send with your next
                        message
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-black-500 hover:bg-black-100 hover:text-black-900"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {!mediaAllowed && activeConversation.type === 'direct' && (
                  <div className="border-b border-black-100 bg-black-50 px-3 py-1.5 text-[11px] text-black-500">
                    Attachments are disabled in student-to-student chats.
                  </div>
                )}

                <div className="p-3 flex gap-2">
                  {mediaAllowed && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFilePicked}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || sending}
                        className="shrink-0 px-3 py-2.5 rounded-xl border border-black-300 text-black-700 hover:bg-black-50 disabled:opacity-50 transition"
                        aria-label="Attach a file"
                      >
                        {uploading ? '…' : '📎'}
                      </button>
                    </>
                  )}

                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="flex-1 border border-black-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black-900"
                  />
                  <button
                    type="submit"
                    disabled={
                      sending ||
                      uploading ||
                      (!draft.trim() && !pendingAttachment)
                    }
                    className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentView({ attachment, mine }) {
  const { type, url, name, size } = attachment || {};

  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={name || 'image'}
          className="max-h-64 w-auto rounded-lg border border-black-200 bg-white"
          loading="lazy"
        />
      </a>
    );
  }

  if (type === 'video') {
    return (
      <video
        controls
        src={url}
        className="max-h-64 w-full max-w-xs rounded-lg border border-black-200 bg-black"
      />
    );
  }

  if (type === 'audio') {
    return (
      <audio controls src={url} className="w-full max-w-xs">
        Your browser does not support audio playback.
      </audio>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
        mine
          ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
          : 'border-black-200 bg-white text-black-800 hover:bg-black-50'
      }`}
    >
      <span className="text-base">📎</span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{name || 'file'}</span>
        {size ? <span className="opacity-70">{formatBytes(size)}</span> : null}
      </span>
    </a>
  );
}