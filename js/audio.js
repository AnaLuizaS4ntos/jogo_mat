/* ==========================================================================
   AUDIO.JS — Efeitos Sonoros 8-Bit / Chiptune (Sem ruído artificial de IA)
   ========================================================================== */

const SFX = (() => {
  let ac = null;
  let muted = false;

  function init() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume();
      return;
    }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ac = null;
    }
  }

  function tone(freq, type, duration, vol = 0.12, delay = 0, slideTo = null) {
    if (muted || !ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    }

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    init,
    toggleMute() {
      init();
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    jump() {
      init();
      tone(220, 'square', 0.14, 0.09, 0, 520);
    },
    land() {
      init();
      tone(110, 'triangle', 0.07, 0.08, 0, 70);
    },
    pickupNew(count = 1) {
      init();
      const base = 330 + (count % 7) * 45;
      tone(base, 'square', 0.09, 0.1, 0);
      tone(base * 1.25, 'square', 0.14, 0.1, 0.07);
    },
    pickupDup() {
      init();
      tone(240, 'triangle', 0.08, 0.1, 0);
      tone(190, 'triangle', 0.12, 0.1, 0.07);
    },
    hurt() {
      init();
      tone(180, 'sawtooth', 0.12, 0.12, 0, 95);
      tone(130, 'sawtooth', 0.18, 0.12, 0.1, 70);
    },
    mote() {
      init();
      tone(587.33, 'triangle', 0.08, 0.08, 0);
      tone(880, 'triangle', 0.12, 0.08, 0.05);
    },
    blip() {
      init();
      tone(440 + Math.random() * 120, 'square', 0.035, 0.04, 0);
    },
    step(n = 0) {
      init();
      const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      const f = notes[Math.max(0, Math.min(notes.length - 1, n))];
      tone(f, 'square', 0.11, 0.09, 0);
    },
    fanfare() {
      init();
      const notes = [392.0, 493.88, 587.33, 783.99];
      notes.forEach((f, i) => {
        tone(f, 'square', 0.16, 0.11, i * 0.09);
      });
    },
    unlock() {
      init();
      const notes = [293.66, 369.99, 440.0, 587.33];
      notes.forEach((f, i) => {
        tone(f, 'triangle', 0.18, 0.13, i * 0.08);
      });
    }
  };
})();
