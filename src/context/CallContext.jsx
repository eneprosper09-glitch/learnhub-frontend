import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const CallContext = createContext(null);

// Call states
//   idle        — nothing happening
//   outgoing    — we initiated, waiting for the other side to accept
//   incoming    — someone is ringing us, we haven't decided yet
//   connecting  — we accepted (or they did), LiveKit is connecting
//   connected   — we're in the room, media flowing
//   ended       — terminal state for a moment before reset to idle
export const CallState = {
  Idle: 'idle',
  Outgoing: 'outgoing',
  Incoming: 'incoming',
  Connecting: 'connecting',
  Connected: 'connected',
  Ended: 'ended',
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const {
    onCallIncoming,
    onCallAccepted,
    onCallRejected,
    onCallCancelled,
    onGroupCallStarted,
    onGroupCallEnded,
    emitCallInvite,
    emitCallAccept,
    emitCallReject,
    emitCallCancel,
  } = useSocket();

  // State exposed to the UI.
  const [state, setState] = useState(CallState.Idle);
  const [kind, setKind] = useState('audio'); // 'audio' | 'video'
  const [peer, setPeer] = useState(null); // { _id, name, avatarUrl? } for direct
  const [groupInfo, setGroupInfo] = useState(null); // { courseId, courseTitle } for group
  const [isGroup, setIsGroup] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  // Media state.
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Remote participant info for group calls.
  const [remoteParticipants, setRemoteParticipants] = useState([]);

  // Refs — kept outside React state because LiveKit objects are not
  // React-friendly and we don't want re-renders on every event.
  const roomRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const audioTrackRef = useRef(null);
  const timerRef = useRef(null);
  const incomingFromRef = useRef(null); // userId of the peer ringing us

  // ---------- Cleanup helpers ----------

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    stopTimer();
    setDuration(0);
    setPeer(null);
    setGroupInfo(null);
    setIsGroup(false);
    setRemoteParticipants([]);
    setError('');
    setMicEnabled(true);
    setCameraEnabled(false);
    incomingFromRef.current = null;
  }, [stopTimer]);

  const disconnectRoom = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      room.localParticipant?.trackPublications?.forEach((pub) => {
        pub.track?.stop?.();
      });
      await room.disconnect();
    } catch (err) {
      console.warn('Room disconnect error', err?.message || err);
    }
    roomRef.current = null;
    localVideoTrackRef.current = null;
    audioTrackRef.current = null;
  }, []);

  const endCallInternal = useCallback(
    async ({ notify = null } = {}) => {
      // notify: { toUserId, event: 'cancel' | 'reject' }
      if (notify?.toUserId && notify.event) {
        if (notify.event === 'cancel') emitCallCancel(notify.toUserId);
        if (notify.event === 'reject') emitCallReject(notify.toUserId);
      }
      await disconnectRoom();
      setState(CallState.Ended);
      resetAll();
      // Reset to idle shortly after, so UI can show a brief "call ended".
      setTimeout(() => {
        setState((s) => (s === CallState.Ended ? CallState.Idle : s));
      }, 400);
    },
    [disconnectRoom, emitCallCancel, emitCallReject, resetAll]
  );

  // ---------- Socket listeners ----------

  useEffect(() => {
    if (!user) return;

    const offIncoming = onCallIncoming((payload) => {
      const { from, kind: incomingKind, roomName } = payload || {};
      if (!from?._id) return;

      // If we're already in a call, auto-reject the new invite.
      setState((current) => {
        if (current !== CallState.Idle && current !== CallState.Ended) {
          emitCallReject(from._id);
          return current;
        }
        incomingFromRef.current = from._id;
        setKind(incomingKind || 'audio');
        setPeer({
          _id: from._id,
          name: from.name || 'Unknown',
          avatarUrl: from.avatarUrl || null,
        });
        setIsGroup(false);
        setGroupInfo(null);
        setError('');
        return CallState.Incoming;
      });
    });

    const offAccepted = onCallAccepted(() => {
      setState((current) => {
        if (current !== CallState.Outgoing) return current;
        return CallState.Connecting;
      });
    });

    const offRejected = onCallRejected(() => {
      setState((current) => {
        if (current !== CallState.Outgoing && current !== CallState.Connecting) {
          return current;
        }
        toast.error('Call declined');
        return CallState.Ended;
      });
      resetAll();
      setTimeout(() => {
        setState((s) => (s === CallState.Ended ? CallState.Idle : s));
      }, 400);
    });

    const offCancelled = onCallCancelled(() => {
      setState((current) => {
        if (current !== CallState.Incoming) return current;
        return CallState.Idle;
      });
      resetAll();
    });

    return () => {
      offIncoming?.();
      offAccepted?.();
      offRejected?.();
      offCancelled?.();
    };
  }, [
    user,
    onCallIncoming,
    onCallAccepted,
    onCallRejected,
    onCallCancelled,
    emitCallReject,
    resetAll,
  ]);

  // Group call start/end notices. These are informational — they let the UI
  // show a banner in the group chat. Joining is a manual action.
  useEffect(() => {
    if (!user) return;
    const offStarted = onGroupCallStarted((payload) => {
      // no-op by default; CourseChat subscribes separately for its banner.
    });
    const offEnded = onGroupCallEnded((payload) => {
      // If we're currently in this group call, disconnect.
      setState((current) => {
        if (
          current === CallState.Connected &&
          isGroup &&
          groupInfo?.courseId &&
          String(payload?.courseId) === String(groupInfo.courseId)
        ) {
          // Kick out of the room.
          disconnectRoom();
          resetAll();
          return CallState.Idle;
        }
        return current;
      });
    });
    return () => {
      offStarted?.();
      offEnded?.();
    };
  }, [
    user,
    onGroupCallStarted,
    onGroupCallEnded,
    isGroup,
    groupInfo?.courseId,
    disconnectRoom,
    resetAll,
  ]);

  // Duration timer while connected.
  useEffect(() => {
    if (state === CallState.Connected) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [state, stopTimer]);

  // ---------- LiveKit room connection ----------

  const connectToRoom = useCallback(
    async ({ token, url, withVideo }) => {
      setState(CallState.Connecting);
      setError('');

      try {
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 640, height: 360 },
          },
        });
        roomRef.current = room;

        // Attach local tracks when they publish.
        room.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (publication.source === Track.Source.Camera) {
            localVideoTrackRef.current = publication.track;
          }
          if (publication.source === Track.Source.Microphone) {
            audioTrackRef.current = publication.track;
          }
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          setRemoteParticipants((prev) => {
            if (prev.some((p) => p.identity === participant.identity)) return prev;
            return [
              ...prev,
              {
                identity: participant.identity,
                name: participant.name || participant.identity,
                hasVideo: false,
                hasAudio: false,
              },
            ];
          });
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setRemoteParticipants((prev) =>
            prev.filter((p) => p.identity !== participant.identity)
          );
        });

        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          setRemoteParticipants((prev) => {
            const idx = prev.findIndex((p) => p.identity === participant.identity);
            const update = {
              identity: participant.identity,
              name: participant.name || participant.identity,
              hasVideo:
                track.kind === Track.Kind.Video
                  ? true
                  : prev[idx]?.hasVideo || false,
              hasAudio:
                track.kind === Track.Kind.Audio
                  ? true
                  : prev[idx]?.hasAudio || false,
            };
            if (idx === -1) return [...prev, update];
            const next = [...prev];
            next[idx] = update;
            return next;
          });
        });

        room.on(RoomEvent.Disconnected, () => {
          setState((current) => {
            if (
              current === CallState.Connected ||
              current === CallState.Connecting
            ) {
              return CallState.Ended;
            }
            return current;
          });
          resetAll();
          setTimeout(() => {
            setState((s) => (s === CallState.Ended ? CallState.Idle : s));
          }, 400);
        });

        await room.connect(url, token);

        // Publish mic always; publish camera only if video call (or group).
        await room.localParticipant.setMicrophoneEnabled(true);
        setMicEnabled(true);

        if (withVideo) {
          await room.localParticipant.setCameraEnabled(true);
          setCameraEnabled(true);
        } else {
          setCameraEnabled(false);
        }

        setState(CallState.Connected);
      } catch (err) {
        console.error('LiveKit connect failed', err);
        setError(err?.message || 'Failed to connect to call');
        toast.error('Failed to connect to call');
        await disconnectRoom();
        resetAll();
        setState(CallState.Idle);
      }
    },
    [disconnectRoom, resetAll]
  );

  // ---------- Public API ----------

  // Call an instructor (or an instructor calling a student). Uses the
  // direct-call token endpoint, then rings the other side via socket.
  const startDirectCall = useCallback(
    async (targetUser, callKind = 'audio') => {
      if (!targetUser?._id) return;
      if (state !== CallState.Idle && state !== CallState.Ended) {
        toast.error('You are already in a call');
        return;
      }
      if (String(targetUser._id) === String(user?._id)) return;

      setKind(callKind);
      setPeer({
        _id: targetUser._id,
        name: targetUser.name || 'User',
        avatarUrl: targetUser.avatarUrl || null,
      });
      setIsGroup(false);
      setGroupInfo(null);
      setState(CallState.Outgoing);
      setError('');

      try {
        const { data } = await api.post('/calls/direct/token', {
          userId: targetUser._id,
        });
        const { token, url } = data.data;

        // Ring the other side. If they're offline we won't know until
        // they don't answer, so we don't fail on ack here.
        const inviteAck = await emitCallInvite(targetUser._id, callKind);
        if (!inviteAck?.ok) {
          // Deliverable to server but the target had no socket. We still
          // try to join the room — they may come online.
          console.warn('Invite ack:', inviteAck);
        }

        // Pre-connect to the room so accepting is instant for them and
        // we don't have to reconnect after the accepted event.
        await connectToRoom({
          token,
          url,
          withVideo: callKind === 'video',
        });
      } catch (err) {
        const msg = err?.response?.data?.message || 'Call failed';
        setError(msg);
        toast.error(msg);
        resetAll();
        setState(CallState.Idle);
      }
    },
    [state, user?._id, emitCallInvite, connectToRoom, resetAll]
  );

  // Accept an incoming direct call.
  const acceptCall = useCallback(async () => {
    const fromId = incomingFromRef.current;
    if (!fromId) return;
    if (state !== CallState.Incoming) return;

    setState(CallState.Connecting);
    try {
      const { data } = await api.post('/calls/direct/token', { userId: fromId });
      const { token, url } = data.data;

      emitCallAccept(fromId);

      await connectToRoom({
        token,
        url,
        withVideo: kind === 'video',
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to accept call';
      setError(msg);
      toast.error(msg);
      emitCallReject(fromId);
      await endCallInternal();
    }
  }, [state, kind, emitCallAccept, emitCallReject, connectToRoom, endCallInternal]);

  // Reject an incoming direct call.
  const rejectCall = useCallback(() => {
    const fromId = incomingFromRef.current;
    if (!fromId) return;
    emitCallReject(fromId);
    resetAll();
    setState(CallState.Idle);
  }, [emitCallReject, resetAll]);

  // Hang up / leave whatever call we're in.
  const endCall = useCallback(async () => {
    // If we're the caller and the peer hasn't accepted yet, cancel.
    if (state === CallState.Outgoing && peer?._id) {
      await endCallInternal({ notify: { toUserId: peer._id, event: 'cancel' } });
      return;
    }
    // If we're ringing and don't want to answer.
    if (state === CallState.Incoming && incomingFromRef.current) {
      emitCallReject(incomingFromRef.current);
      resetAll();
      setState(CallState.Idle);
      return;
    }
    // Otherwise just tear down.
    await endCallInternal();
  }, [state, peer?._id, endCallInternal, emitCallReject, resetAll]);

  // ---------- Group calls ----------

  const startOrJoinGroupCall = useCallback(
    async ({ courseId, courseTitle, withVideo = true }) => {
      if (state !== CallState.Idle && state !== CallState.Ended) {
        toast.error('You are already in a call');
        return;
      }
      setKind(withVideo ? 'video' : 'audio');
      setIsGroup(true);
      setGroupInfo({ courseId, courseTitle: courseTitle || '' });
      setPeer(null);
      setError('');
      setState(CallState.Outgoing);

      try {
        const { data } = await api.post('/calls/group/token', { courseId });
        const { token, url } = data.data;
        await connectToRoom({ token, url, withVideo });
      } catch (err) {
        const msg = err?.response?.data?.message || 'Failed to join group call';
        setError(msg);
        toast.error(msg);
        resetAll();
        setState(CallState.Idle);
      }
    },
    [state, connectToRoom, resetAll]
  );

  const endGroupCall = useCallback(
    async (courseId) => {
      try {
        await api.post('/calls/group/end', { courseId });
      } catch (err) {
        console.warn('endGroupCall error', err?.message);
      }
      await endCallInternal();
    },
    [endCallInternal]
  );

  // ---------- Media controls ----------

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch (err) {
      toast.error('Failed to toggle mic');
    }
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraEnabled;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCameraEnabled(next);
    } catch (err) {
      toast.error('Failed to toggle camera');
    }
  }, [cameraEnabled]);

  // ---------- Cleanup on unmount / logout ----------

  useEffect(() => {
    return () => {
      disconnectRoom();
      stopTimer();
    };
  }, [disconnectRoom, stopTimer]);

  useEffect(() => {
    if (!user) {
      disconnectRoom();
      resetAll();
      setState(CallState.Idle);
    }
  }, [user, disconnectRoom, resetAll]);

  // Getter for the local video track. Consumers that want to render the
  // local preview should call this and attach it to a <video> element.
  const getLocalVideoTrack = useCallback(() => localVideoTrackRef.current, []);
  const getLocalAudioTrack = useCallback(() => audioTrackRef.current, []);
  const getRoom = useCallback(() => roomRef.current, []);

  const value = useMemo(
    () => ({
      state,
      kind,
      peer,
      groupInfo,
      isGroup,
      duration,
      error,
      micEnabled,
      cameraEnabled,
      remoteParticipants,
      startDirectCall,
      acceptCall,
      rejectCall,
      endCall,
      startOrJoinGroupCall,
      endGroupCall,
      toggleMic,
      toggleCamera,
      getLocalVideoTrack,
      getLocalAudioTrack,
      getRoom,
    }),
    [
      state,
      kind,
      peer,
      groupInfo,
      isGroup,
      duration,
      error,
      micEnabled,
      cameraEnabled,
      remoteParticipants,
      startDirectCall,
      acceptCall,
      rejectCall,
      endCall,
      startOrJoinGroupCall,
      endGroupCall,
      toggleMic,
      toggleCamera,
      getLocalVideoTrack,
      getLocalAudioTrack,
      getRoom,
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};