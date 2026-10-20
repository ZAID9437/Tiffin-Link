/**
 * TiffinLink Real-Time Audio Notification Synthesizer
 * High-gain Web Audio API alerts for Kitchen Orders & Courier Requests
 * Zero external mp3 dependencies, 100% reliable, auto-unlocked on user gesture.
 */

let audioCtx = null;
let deliveryTimer = null;
let isDeliveryAlertActive = false;
let kitchenTimer = null;
let isKitchenAlertActive = false;

// Track active oscillator nodes to stop them immediately without dangling tones
const activeOscillators = new Set();

// Debounce & deduplication timestamps
let lastKitchenAlertTime = 0;
let lastDeliveryAlertTime = 0;

const STORAGE_KEY = 'tiffinlink_sound_enabled';

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val !== 'false';
};

export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    stopDeliveryRequestSound();
    stopKitchenAlertSound();
  }
};

const stopAllActiveOscillators = () => {
  activeOscillators.forEach(osc => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {}
  });
  activeOscillators.clear();
};

const getAudioContext = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext init warning:', e);
    return null;
  }
};

// Automatic user interaction unlock for browser autoplay policies
if (typeof window !== 'undefined') {
  const unlockAudio = async () => {
    try {
      await getAudioContext();
    } catch (e) {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

/**
 * Play pleasant multi-tone chime for Kitchen Providers when a new customer order arrives
 */
export const playKitchenOrderSound = async () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Commercial kitchen POS double-bell chime:
    // Ding-Ding-Dong!
    const tones = [
      { freq: 587.33, start: 0, dur: 0.35, gain: 0.25 },
      { freq: 880.00, start: 0.12, dur: 0.45, gain: 0.3 },
      { freq: 1174.66, start: 0.26, dur: 0.6, gain: 0.35 },
      // Second bell for clear presence
      { freq: 880.00, start: 0.65, dur: 0.35, gain: 0.28 },
      { freq: 1174.66, start: 0.78, dur: 0.7, gain: 0.35 }
    ];

    tones.forEach(({ freq, start, dur, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // Warm, resonant bell tone
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(vol, now + start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      activeOscillators.add(osc);
      osc.onended = () => {
        activeOscillators.delete(osc);
      };

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (err) {
    console.warn('Kitchen chime error:', err);
  }
};

/**
 * Play recurring kitchen chime for Providers when a new meal request or order arrives
 * Repeats every 2.5 seconds until explicitly accepted or declined
 */
export const playKitchenAlertLoop = () => {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  // Deduplicate triggers within 600ms (prevent double-ringing from twin socket events)
  if (isKitchenAlertActive && (now - lastKitchenAlertTime < 600)) {
    return;
  }
  lastKitchenAlertTime = now;

  stopKitchenAlertSound();

  isKitchenAlertActive = true;
  playKitchenOrderSound();

  kitchenTimer = setInterval(() => {
    if (!isKitchenAlertActive || !isSoundEnabled()) {
      stopKitchenAlertSound();
      return;
    }
    playKitchenOrderSound();
  }, 2500);
};

/**
 * Stop kitchen alert chime immediately (when provider accepts or declines the request)
 */
export const stopKitchenAlertSound = () => {
  isKitchenAlertActive = false;
  if (kitchenTimer) {
    clearInterval(kitchenTimer);
    kitchenTimer = null;
  }
  stopAllActiveOscillators();
};

/**
 * Play repeating urgent alert chime for Delivery Drivers when a new delivery request is broadcast
 */
export const playDeliveryRequestSound = async (durationSeconds = 60, onComplete) => {
  if (!isSoundEnabled()) return;

  const nowMs = Date.now();
  // Prevent double-ringing within 750ms when twin socket broadcasts arrive
  if (isDeliveryAlertActive && (nowMs - lastDeliveryAlertTime < 750)) {
    return;
  }
  lastDeliveryAlertTime = nowMs;

  stopDeliveryRequestSound();

  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    isDeliveryAlertActive = true;
    let iteration = 0;
    const hasLimit = typeof durationSeconds === 'number' && durationSeconds > 0 && isFinite(durationSeconds);
    const maxIterations = hasLimit ? Math.max(1, Math.round(durationSeconds / 1.1)) : Infinity;

    const playPulse = () => {
      if (!isDeliveryAlertActive || iteration >= maxIterations) {
        stopDeliveryRequestSound();
        if (onComplete) onComplete();
        return;
      }

      iteration++;
      const now = ctx.currentTime;

      // Urgent two-tone delivery alert (A5 -> C6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      activeOscillators.add(osc1);
      osc1.onended = () => activeOscillators.delete(osc1);
      osc1.start(now);
      osc1.stop(now + 0.28);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.14);
      gain2.gain.setValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      activeOscillators.add(osc2);
      osc2.onended = () => activeOscillators.delete(osc2);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.48);

      deliveryTimer = setTimeout(playPulse, 1100);
    };

    playPulse();
  } catch (err) {
    console.warn('Delivery alert sound error:', err);
  }
};

/**
 * Stop delivery alert chime immediately (when driver accepts, declines, or navigates away)
 */
export const stopDeliveryRequestSound = () => {
  isDeliveryAlertActive = false;
  if (deliveryTimer) {
    clearTimeout(deliveryTimer);
    deliveryTimer = null;
  }
  stopAllActiveOscillators();
};
