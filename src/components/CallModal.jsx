import { useEffect, useRef, useState } from 'react';
import { useCall, CallState } from '../context/CallContext';

export default function CallModal() {
  const { state, kind, peer, acceptCall, rejectCall } = useCall();
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const visible = state === CallState.Incoming;

  // Reset the timer whenever the modal opens.
  useEffect(() => {
    if (!visible) {
      setSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible]);

  // Soft ring tone using Web Audio. No asset file needed.
  useEffect(() => {
    if (!visible) {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
      return;
    }

    let stopped = false;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    const ping = (when) => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.15, when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + 0.4);
    };

    const loop = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      ping(t);
      ping(t + 0.5);
      setTimeout(loop, 2000);
    };

    // Browsers require a user gesture to start audio; if it fails,
    // the ring just stays silent, which is acceptable.
    ctx.resume?.().then(loop).catch(() => {});

    return () => {
      stopped = true;
      try {
        ctx.close();
      } catch {}
      audioCtxRef.current = null;
    };
  }, [visible]);

  if (!visible) return null;

  const initials = (peer?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Incoming call"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-black-900 text-white flex items-center justify-center font-display font-extrabold text-2xl overflow-hidden">
            {peer?.avatarUrl ? (
              <img
                src={peer.avatarUrl}
                alt={peer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="mt-4 text-xs font-bold tracking-widest text-black-500 uppercase">
            Incoming {kind === 'video' ? 'video' : 'voice'} call
          </div>
          <div className="mt-1 font-display font-extrabold text-2xl text-black-900 truncate">
            {peer?.name || 'Unknown'}
          </div>
          <div className="mt-1 text-sm text-black-500 tabular-nums">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-black-100">
          <button
            type="button"
            onClick={rejectCall}
            className="py-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={acceptCall}
            className="py-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}