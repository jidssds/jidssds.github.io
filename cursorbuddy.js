(function(){
  class Companion {
    constructor(options = {}) {
      if (options.element instanceof HTMLElement) {
        this.el = options.element;
      } else if (typeof options.image === 'string') {
        this.el = document.createElement('img');
        this.el.src = options.image;
        this.el.alt = options.alt ?? 'Cursor companion';
        this.el.className = 'cursor-companion';
        document.body.appendChild(this.el);
      } else {
        this.el = document.createElement('div');
        this.el.className = 'cursor-companion-default';
        this.el.style.width = '30px';
        this.el.style.height = '30px';
        this.el.style.borderRadius = '50%';
        this.el.style.background = 'rgba(0,150,255,0.6)';
        this.el.style.position = 'absolute';
        this.el.style.pointerEvents = 'none';
        document.body.appendChild(this.el);
      }

      this.followSpeed = options.followSpeed ?? 0.15;
      this.offset = options.offset ?? { x: 0, y: 0 };

      this.hoverEffects = this.#normalizeEffect(options.hoverEffects, { defaultType: 'bounce', defaultIntensity: 1.1, defaultDuration: 180 });
      this.clickEffects = this.#normalizeEffect(options.clickEffects, { defaultType: 'squash', defaultIntensity: 0.85, defaultDuration: 150 });
      this.idleEffects = this.#normalizeEffect(options.idleEffects, { defaultType: 'float', defaultIntensity: 5, defaultDuration: 2000 });

      this.position = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this._running = false;
      this._idleOffset = 0;

      this._onMouseMove = this.#onMouseMove.bind(this);
      this._onMouseEnter = this.#onMouseEnter.bind(this);
      this._onClick = this.#onClick.bind(this);
    }

    #normalizeEffect(value, defaults) {
      if (!value) return null;
      if (value === true) return { ...defaults };
      if (typeof value === 'object') return { type: value.type ?? defaults.defaultType, intensity: value.intensity ?? defaults.defaultIntensity, duration: value.duration ?? defaults.defaultDuration };
      return null;
    }

    #onMouseMove(e) {
      this.target.x = e.clientX + this.offset.x;
      this.target.y = e.clientY + this.offset.y;
    }

    #onMouseEnter() {
      if (this.hoverEffects) this.#runEffect(this.hoverEffects);
    }

    #onClick() {
      if (this.clickEffects) this.#runEffect(this.clickEffects);
    }

    #runEffect(effect) {
      if (!effect) return;
      const el = this.el;
      const { type, intensity, duration } = effect;
      switch(type) {
        case 'bounce':
          el.style.transition = `transform ${duration}ms ease-out`;
          el.style.transform = `scale(${intensity})`;
          setTimeout(() => el.style.transform = 'scale(1)', duration);
          break;
        case 'squash':
          el.style.transition = `transform ${duration}ms ease-out`;
          el.style.transform = `scale(${intensity}, ${2-intensity})`;
          setTimeout(() => el.style.transform = 'scale(1,1)', duration);
          break;
        case 'spin':
          el.style.transition = `transform ${duration}ms ease-out`;
          el.style.transform = `rotate(360deg)`;
          setTimeout(() => el.style.transform = 'rotate(0deg)', duration);
          break;
        case 'wiggle':
          el.style.transition = `transform ${duration}ms ease-out`;
          el.style.transform = `rotate(${intensity*10}deg)`;
          setTimeout(() => el.style.transform = `rotate(${-intensity*10}deg)`, duration);
          setTimeout(() => el.style.transform = 'rotate(0deg)', duration*2);
          break;
        case 'float':
          break;
        default: break;
      }
    }

    start() {
      if (this._running) return;
      this._running = true;
      document.addEventListener('mousemove', this._onMouseMove);
      this.el.addEventListener('mouseenter', this._onMouseEnter);
      this.el.addEventListener('click', this._onClick);
      requestAnimationFrame(this.#animate.bind(this));
    }

    #animate() {
      if (!this._running) return;
      this.position.x += (this.target.x - this.position.x) * this.followSpeed;
      this.position.y += (this.target.y - this.position.y) * this.followSpeed;

      if (this.idleEffects) {
        this._idleOffset += 0.05;
        const floatY = Math.sin(this._idleOffset) * this.idleEffects.intensity;
        this.el.style.transform = `translate(${this.position.x}px, ${this.position.y + floatY}px)`;
      } else {
        this.el.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
      }

      requestAnimationFrame(this.#animate.bind(this));
    }

    stop() {
      this._running = false;
      document.removeEventListener('mousemove', this._onMouseMove);
      this.el.removeEventListener('mouseenter', this._onMouseEnter);
      this.el.removeEventListener('click', this._onClick);
    }
  }

  let companions = [];

  function init() {
    window.CursorCompanion = {
      add(options) {
        const c = new Companion(options);
        c.start();
        companions.push(c);
        return c;
      },
      remove(companion) {
        const index = companions.indexOf(companion);
        if (index > -1) {
          companions[index].stop();
          companions.splice(index,1);
        }
      },
      removeAll() {
        companions.forEach(c => c.stop());
        companions.length = 0;
      },
      pauseAll() {
        companions.forEach(c => c.stop());
      },
      resumeAll() {
        companions.forEach(c => c.start());
      },
      list() {
        return companions.slice();
      }
    };
  }

  if (document.readyState === "loading") {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
