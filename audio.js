class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = GameState.settings.volume;
            this.enabled = true;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    setVolume(val) {
        if (this.masterGain) this.masterGain.gain.value = val;
    }

    playTone(freq, type, duration, vol = 0.1, slideTo = null) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 0.05) {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Lowpass filter for muffled sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    // Presets
    playStep() { this.playNoise(0.1, 0.02); }
    playKeyPickup() { this.playTone(800, 'sine', 0.3, 0.1, 1200); }
    playScare() { 
        this.playTone(100, 'sawtooth', 0.5, 0.3, 30); 
        this.playNoise(0.5, 0.2);
    }
    playHeartbeat(dist) {
        if (!this.enabled || dist > 15) return;
        const vol = (15 - dist) / 15 * 0.5;
        this.playTone(60, 'sine', 0.15, vol, 10);
    }
    playAmbience() {
        if (!this.enabled) return;
        // Continuous drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 50;
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
    }
}

const AudioSys = new AudioSystem();
