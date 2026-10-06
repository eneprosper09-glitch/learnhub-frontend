import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function CourseChat({ courseId }) {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, sendTyping, onNewMessage, onTyping } =
    useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load conversation for this course
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get(`/conversations/course/${courseId}/group`)
      .then((r) => {
        if (cancelled) return;
        setConversation(r.data.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Chat is not available yet');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // Once we have a conversation, load messages and join the socket room
  useEffect(() => {
    if (!conversation) return;
    let cancelled = false;
    joinConversation(conversation._id);

    api
      .get(`/conversations/${conversation._id}/messages?limit=50`)
      .then((r) => {
        if (cancelled) return;
        setMessages(r.data.data || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      leaveConversation(conversation._id);
    };
  }, [conversation, joinConversation, leaveConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!conversation) return;
    const off = onNewMessage((payload) => {
      if (String(payload?.conversationId) !== String(conversation._id)) return;
      const msg = payload.message;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    });
    return () => off?.();
  }, [conversation, onNewMessage]);

  // Typing
  useEffect(() => {
    if (!conversation) return;
    const off = onTyping((payload) => {
      if (String(payload?.conversationId) !== String(conversation._id)) return;
      if (String(payload.userId) === String(user?._id)) return;
      setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.isTyping }));
    });
    return () => off?.();
  }, [conversation, onTyping, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onDraftChange = (value) => {
    setDraft(value);
    if (!conversation) return;
    sendTyping(conversation._id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversation._id, false);
    }, 1500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversation) return;
    setSending(true);
    try {
      const { data } = await api.post(
        `/conversations/${conversation._id}/messages`,
        { body: text }
      );
      setMessages((prev) =>
        prev.some((m) => m._id === data.data._id) ? prev : [...prev, data.data]
      );
      setDraft('');
      sendTyping(conversation._id, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black-50 border border-black-100 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-display font-bold text-lg text-black-900 mb-1">
          Course chat
        </h3>
        <p className="text-black-500 text-sm max-w-md mx-auto">{error}</p>
        <p className="text-xs text-black-400 mt-3">
          Only the course instructor can open the group chat for the first time.
        </p>
      </div>
    );
  }

  const typingNames = Object.entries(typingUsers)
    .filter(([, v]) => v)
    .map(([id]) => conversation?.participants?.find((p) => String(p._id) === id)?.name || 'Someone');

  return (
    <div className="bg-white border border-black-200 rounded-2xl overflow-hidden flex flex-col h-[600px]">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-black-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-black-900 text-white flex items-center justify-center text-lg flex-shrink-0">
            👥
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-black-900 truncate">
              {conversation.name || 'Course group chat'}
            </div>
            <div className="text-xs text-black-500">
              {conversation.participants?.length || 0} members
            </div>
          </div>
        </div>
        <Link
          to="/messages"
          className="text-xs font-semibold text-black-700 hover:text-black-900 whitespace-nowrap"
        >
          Open in Messages →
        </Link>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-black-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-sm text-black-500">
            No messages yet. Say hello to the group.
          </div>
        ) : (
          messages.map((m) => {
            const mine = String(m.sender?._id) === String(user?._id);
            return (
              <div key={m._id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
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
                  {!mine && (
                    <div className="text-[10px] font-bold text-black-500 mb-1 uppercase tracking-wider">
                      {m.sender?.name}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
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

      {/* TYPING */}
      {typingNames.length > 0 && (
        <div className="px-5 py-1 text-xs text-black-500 italic">
          {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* COMPOSER */}
      <form onSubmit={sendMessage} className="border-t border-black-100 p-3 flex gap-2">
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
          disabled={sending || !draft.trim()}
          className="px-5 py-2.5 rounded-xl bg-black-900 hover:bg-black-800 text-white font-semibold disabled:opacity-50 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}