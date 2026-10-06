import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import api from '../api/client';

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

export default function CourseChat({ courseId, courseInstructorId, courseTitle }) {
  const { user } = useAuth();
  const {
    connected,
    joinConversation,
    leaveConversation,
    sendTyping,
    onNewMessage,
    onTyping,
    onGroupCallStarted,
    onGroupCallEnded,
  } = useSocket();
  const {
    state: callState,
    isGroup,
    groupInfo,
    startOrJoinGroupCall,
    endGroupCall,
  } = useCall();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notOpenYet, setNotOpenYet] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  // Group call banner state.
  const [activeGroupCall, setActiveGroupCall] = useState(null);

  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Load / create the group conversation
  useEffect(() => {
    let cancelled = false;
    async function loadGroup() {
      if (!courseId) return;
      setLoading(true);
      setError('');
      setNotOpenYet(false);
      try {
        const res = await api.get(`/conversations/course/${courseId}/group`);
        if (cancelled) return;
        const conv = res.data?.data;
        setConversation(conv);
        setParticipants(conv?.participants || []);

        const msgRes = await api.get(
          `/conversations/${conv._id}/messages?limit=50`
        );
        if (cancelled) return;
        setMessages(msgRes.data?.data || []);

        // Check if there's an active group call already.
        try {
          const statusRes = await api.get(`/calls/group/status/${courseId}`);
          if (!cancelled && statusRes.data?.data?.active) {
            setActiveGroupCall({
              courseId,
              courseTitle,
              startedAt: statusRes.data.data.startedAt,
              startedBy: statusRes.data.data.startedBy,
            });
          }
        } catch {
          // Non-fatal — just means we didn't get the status.
        }
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message || err.message || 'Failed to load chat';
        if (status === 404) {
          setNotOpenYet(true);
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [courseId, courseTitle]);

  // 2. Join socket room once we have a conversation id
  useEffect(() => {
    if (!conversation?._id) return;
    let active = true;
    joinConversation(conversation._id).catch(() => {});
    return () => {
      active = false;
      if (active) leaveConversation(conversation._id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?._id]);

  // 3. Listen for new messages and typing
  useEffect(() => {
    if (!conversation?._id) return;

    const offMsg = onNewMessage((msg) => {
      if (!msg) return;
      if (String(msg.conversation) !== String(conversation._id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    const offTyping = onTyping((payload) => {
      if (!payload) return;
      const cid = payload.conversationId || payload.conversation;
      if (String(cid) !== String(conversation._id)) return;
      if (String(payload.userId) === String(user?._id)) return;
      setTypingUsers((prev) => {
        if (payload.isTyping) {
          if (prev.find((u) => u.userId === payload.userId)) return prev;
          return [
            ...prev,
            { userId: payload.userId, userName: payload.userName || 'Someone' },
          ];
        }
        return prev.filter((u) => u.userId !== payload.userId);
      });
    });

    return () => {
      offMsg?.();
      offTyping?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?._id, user?._id]);

  // 4. Listen for group-call started / ended events
  useEffect(() => {
    if (!courseId) return;

    const offStarted = onGroupCallStarted((payload) => {
      if (!payload) return;
      if (String(payload.courseId) !== String(courseId)) return;
      setActiveGroupCall({
        courseId: payload.courseId,
        courseTitle: payload.courseTitle || courseTitle,
        startedAt: payload.startedAt,
        startedBy: payload.startedBy,
      });
    });

    const offEnded = onGroupCallEnded((payload) => {
      if (!payload) return;
      if (String(payload.courseId) !== String(courseId)) return;
      setActiveGroupCall(null);
    });

    return () => {
      offStarted?.();
      offEnded?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseTitle]);

  // 5. Auto-scroll
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingUsers.length, pendingAttachment]);

  async function handleFilePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !conversation?._id) return;

    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? VIDEO_MAX : OTHER_MAX;
    if (!ALLOWED_MIMES.has(file.type)) {
      setError(`Unsupported file type: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > limit) {
      setError(
        isVideo
          ? `Video must be under ${formatBytes(VIDEO_MAX)}`
          : `File must be under ${formatBytes(OTHER_MAX)}`
      );
      return;
    }

    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(
        `/conversations/${conversation._id}/attachments`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const meta = res.data?.data;
      if (!meta) {
        setError('Upload failed');
        return;
      }
      setPendingAttachment(meta);
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function clearPendingAttachment() {
    setPendingAttachment(null);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!conversation?._id || sending || uploading) return;
    const body = draft.trim();
    if (!body && !pendingAttachment) return;

    setSending(true);
    setError('');
    setDraft('');
    const attachmentToSend = pendingAttachment;
    setPendingAttachment(null);

    try {
      const payload = {};
      if (body) payload.body = body;
      if (attachmentToSend) payload.attachments = [attachmentToSend];

      const res = await api.post(
        `/conversations/${conversation._id}/messages`,
        payload
      );
      const saved = res.data?.data;
      if (saved) {
        setMessages((prev) =>
          prev.some((m) => m._id === saved._id) ? prev : [...prev, saved]
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send message');
      setDraft(body);
      if (attachmentToSend) setPendingAttachment(attachmentToSend);
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(e) {
    setDraft(e.target.value);
    if (!conversation?._id) return;
    sendTyping(conversation._id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversation._id, false);
    }, 1500);
  }

  const isInstructor =
    user?._id &&
    courseInstructorId &&
    String(user._id) === String(courseInstructorId);

  const inThisCall =
    isGroup &&
    groupInfo?.courseId &&
    String(groupInfo.courseId) === String(courseId) &&
    (callState === 'connected' || callState === 'connecting');

  const callBusy = callState !== 'idle' && callState !== 'ended' && !inThisCall;

  const handleStartGroupCall = () => {
    if (callBusy) return;
    startOrJoinGroupCall({
      courseId,
      courseTitle: courseTitle || conversation?.name || 'Course group call',
      withVideo: true,
    });
  };

  const handleJoinGroupCall = () => {
    if (callBusy) return;
    startOrJoinGroupCall({
      courseId,
      courseTitle: courseTitle || conversation?.name || 'Course group call',
      withVideo: true,
    });
  };

  const handleEndGroupCall = () => {
    endGroupCall(courseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-black-500">
        Loading chat…
      </div>
    );
  }

  if (notOpenYet) {
    return (
      <div className="rounded-xl border border-black-200 p-8 text-center">
        <p className="text-sm font-semibold text-black-900">
          The course group chat is not open yet.
        </p>
        <p className="mt-2 text-xs text-black-500">
          The instructor needs to open the group chat before students can join.
        </p>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-black-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-black-200 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-black-900">
            {courseTitle
              ? `${courseTitle} — Group chat`
              : conversation?.name || 'Group chat'}
          </h3>
          <p className="text-xs text-black-500">
            {participants.length} participant
            {participants.length === 1 ? '' : 's'}
            {connected ? '' : ' · offline'}
          </p>
        </div>

        {isInstructor && !activeGroupCall && !inThisCall && (
          <button
            type="button"
            onClick={handleStartGroupCall}
            disabled={callBusy}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Start group call
          </button>
        )}

        {isInstructor && inThisCall && (
          <button
            type="button"
            onClick={handleEndGroupCall}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            End group call
          </button>
        )}
      </div>

      {/* Group-call banner — visible to everyone when a call is active */}
      {activeGroupCall && !inThisCall && (
        <div className="border-b border-black-200 bg-blue-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-blue-900">
              📹 Group call in progress
            </div>
            <div className="text-xs text-blue-700 truncate">
              Started by {activeGroupCall.startedBy?.name || 'the instructor'}
              {activeGroupCall.startedAt
                ? ` · ${new Date(
                    activeGroupCall.startedAt
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={handleJoinGroupCall}
            disabled={callBusy}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Join
          </button>
        </div>
      )}

      {activeGroupCall && inThisCall && (
        <div className="border-b border-black-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
          You are in the group call. Use the call controls to manage mic, camera, and to
          leave.
        </div>
      )}

      {/* Participants strip */}
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-black-200 px-4 py-2">
          {participants.slice(0, 12).map((p) => {
            const pid = p._id || p;
            const name = p.name || p.email || 'Member';
            const isMe = String(pid) === String(user?._id);
            return (
              <span
                key={String(pid)}
                className="inline-flex items-center gap-1 rounded-full border border-black-200 bg-black-50 px-2 py-0.5 text-xs text-black-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {name}
                {isMe ? ' (you)' : ''}
              </span>
            );
          })}
          {participants.length > 12 && (
            <span className="text-xs text-black-500">
              +{participants.length - 12} more
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        style={{ maxHeight: 420 }}
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-black-500">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const senderId = m.sender?._id || m.sender;
          const isMe = String(senderId) === String(user?._id);
          const senderName = m.sender?.name || m.sender?.email || 'User';
          const hasAttachments = Array.isArray(m.attachments) && m.attachments.length > 0;
          return (
            <div
              key={m._id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white'
                    : 'bg-black-100 text-black-900'
                }`}
              >
                {!isMe && (
                  <div className="mb-0.5 text-[11px] font-semibold opacity-70">
                    {senderName}
                  </div>
                )}

                {m.body ? (
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                ) : null}

                {hasAttachments && (
                  <div className={`${m.body ? 'mt-2' : ''} space-y-2`}>
                    {m.attachments.map((a, i) => (
                      <AttachmentView key={i} attachment={a} isMe={isMe} />
                    ))}
                  </div>
                )}

                <div
                  className={`mt-1 text-[10px] ${
                    isMe ? 'text-blue-100' : 'text-black-500'
                  }`}
                >
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="text-xs italic text-black-500">
            {typingUsers.map((u) => u.userName).join(', ')} typing…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="border-t border-black-200"
      >
        {pendingAttachment && (
          <div className="flex items-center gap-2 border-b border-black-200 bg-black-50 px-3 py-2">
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
              onClick={clearPendingAttachment}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-black-500 hover:bg-black-100 hover:text-black-900"
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}

        {error && conversation && (
          <div className="border-b border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-3">
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
            className="shrink-0 rounded-lg border border-black-200 px-3 py-2 text-sm text-black-700 hover:bg-black-50 disabled:opacity-50"
            aria-label="Attach a file"
          >
            {uploading ? '…' : '📎'}
          </button>

          <input
            type="text"
            value={draft}
            onChange={handleDraftChange}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 rounded-lg border border-black-200 bg-white px-3 py-2 text-sm text-black-900 outline-none focus:border-blue-600"
          />

          <button
            type="submit"
            disabled={
              sending ||
              uploading ||
              (!draft.trim() && !pendingAttachment)
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AttachmentView({ attachment, isMe }) {
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
        isMe
          ? 'border-blue-400 bg-blue-700/40 text-white hover:bg-blue-700/60'
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