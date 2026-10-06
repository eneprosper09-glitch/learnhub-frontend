import { useEffect, useRef } from 'react';
import { Track } from 'livekit-client';
import { useCall, CallState } from '../context/CallContext';

// Bind a LiveKit track to a <video> or <audio> element.
function attachTrack(el, track) {
  if (!el || !track) return () => {};
  try {
    track.attach(el);
  } catch (err) {
    console.warn('attachTrack failed', err?.message || err);
  }
  return () => {
    try {
      track.detach(el);
    } catch {}
  };
}

// One video tile. Subscribes to a remote participant's camera track if present.
function ParticipantTile({ room, participantIdentity, name, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    const participant = isLocal
      ? room.localParticipant
      : room.getParticipantByIdentity(participantIdentity);
    if (!participant) return;

    // Initial: attach existing camera track if already subscribed.
    const existing = participant.getTrackPublication(Track.Source.Camera);
    const existingTrack = existing?.track;
    let detach = existingTrack ? attachTrack(videoRef.current, existingTrack) : () => {};

    const onSub = (track, pub, p) => {
      if (p.identity !== participant.identity) return;
      if (track.source !== Track.Source.Camera) return;
      detach?.();
      detach = attachTrack(videoRef.current, track);
    };
    const onUnsub = (track, pub, p) => {
      if (p.identity !== participant.identity) return;
      if (track.source !== Track.Source.Camera) return;
      try {
        track.detach(videoRef.current);
      } catch {}
    };

    room.on('trackSubscribed', onSub);
    room.on('trackUnsubscribed', onUnsub);

    return () => {
      room.off('trackSubscribed', onSub);
      room.off('trackUnsubscribed', onUnsub);
      detach?.();
    };
  }, [room, participantIdentity, isLocal]);

  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur">
        {name || 'User'} {isLocal ? '(you)' : ''}
      </div>
    </div>
  );
}

// Remote audio — hidden <audio> element per participant that has a mic.
function ParticipantAudio({ room, participantIdentity }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    const participant = room.getParticipantByIdentity(participantIdentity);
    if (!participant) return;

    const existing = participant.getTrackPublication(Track.Source.Microphone);
    const existingTrack = existing?.track;
    let detach = existingTrack ? attachTrack(audioRef.current, existingTrack) : () => {};

    const onSub = (track, pub, p) => {
      if (p.identity !== participant.identity) return;
      if (track.source !== Track.Source.Microphone) return;
      detach?.();
      detach = attachTrack(audioRef.current, track);
    };

    room.on('trackSubscribed', onSub);

    return () => {
      room.off('trackSubscribed', onSub);
      detach?.();
    };
  }, [room, participantIdentity]);

  return <audio ref={audioRef} autoPlay />;
}

const formatDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function CallScreen() {
  const {
    state,
    kind,
    peer,
    groupInfo,
    isGroup,
    duration,
    micEnabled,
    cameraEnabled,
    remoteParticipants,
    toggleMic,
    toggleCamera,
    endCall,
    endGroupCall,
    getRoom,
  } = useCall();

  const room = getRoom();

  const visible =
    state === CallState.Connected ||
    state === CallState.Connecting ||
    state === CallState.Outgoing;

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const isConnecting =
    state === CallState.Connecting || state === CallState.Outgoing;

  const statusText = () => {
    if (state === CallState.Outgoing) return 'Ringing…';
    if (state === CallState.Connecting) return 'Connecting…';
    return formatDuration(duration);
  };

  const title = isGroup
    ? groupInfo?.courseTitle || 'Group call'
    : peer?.name || 'Call';

  const subtitle = isGroup
    ? `Group call · ${remoteParticipants.length + 1} in room`
    : kind === 'video'
    ? 'Video call'
    : 'Voice call';

  // Local participant for the grid.
  const localName = 'You';

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
        <div className="min-w-0">
          <div className="font-display font-bold text-lg truncate">{title}</div>
          <div className="text-xs text-white/60 tabular-nums">
            {subtitle} · {statusText()}
          </div>
        </div>
        <button
          type="button"
          onClick={isGroup ? () => endGroupCall(groupInfo?.courseId) : endCall}
          className="shrink-0 rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold"
        >
          End
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isConnecting ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-4 animate-pulse">
              {kind === 'video' ? '📹' : '📞'}
            </div>
            <div className="text-white/70 text-sm">{statusText()}</div>
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              remoteParticipants.length === 0
                ? 'grid-cols-1 max-w-3xl mx-auto'
                : remoteParticipants.length === 1
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            <ParticipantTile
              room={room}
              participantIdentity={room?.localParticipant?.identity}
              name={localName}
              isLocal
            />

            {remoteParticipants.map((p) => (
              <div key={p.identity}>
                <ParticipantTile
                  room={room}
                  participantIdentity={p.identity}
                  name={p.name}
                  isLocal={false}
                />
                <ParticipantAudio room={room} participantIdentity={p.identity} />
              </div>
            ))}

            {remoteParticipants.length === 0 && !isGroup && (
              <div className="text-center text-white/60 text-sm mt-2">
                Waiting for {peer?.name || 'the other side'} to join…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-white/10 px-5 py-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${
            micEnabled ? 'bg-white/15 hover:bg-white/25' : 'bg-red-600 hover:bg-red-700'
          }`}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={micEnabled ? 'Mute' : 'Unmute'}
        >
          {micEnabled ? '🎤' : '🔇'}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${
            cameraEnabled
              ? 'bg-white/15 hover:bg-white/25'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          title={cameraEnabled ? 'Camera off' : 'Camera on'}
        >
          {cameraEnabled ? '📹' : '🚫'}
        </button>

        <button
          type="button"
          onClick={isGroup ? () => endGroupCall(groupInfo?.courseId) : endCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-xl"
          aria-label="End call"
          title="End call"
        >
          ✕
        </button>
      </div>
    </div>
  );
}