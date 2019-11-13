export default class input {
  constructor(g) {
    this.g = g;
    this.keyState = {};
    this.floodTimers = {};
    this.gamePadDetected = false;
    this.useGamePad = false;
    this.keyMap = {
      pause: 80,
      drop: 32,
      left: 37,
      rotate: 38,
      right: 39,
      down: 40,
      hold: 72,
      alt: 18,
      inputToggle: 90
    };
    this.buttonMap = {
      pause: 9,
      drop: 3,
      left: 14,
      rotate: 0,
      right: 15,
      down: 13,
      hold: 5
    };
    this.actionMap = {
      pause: () => {
        this.g.pause();
      },
      drop: () => {
        this.g.placeFallingPieceAtBottom();
      },
      left: () => {
        this.g.movePiece(-1);
      },
      rotate: () => {
        this.g.rotatePiece();
      },
      right: () => {
        this.g.movePiece(1);
      },
      down: () => {
        this.g.adjustFallingHeightOffset();
      },
      hold: () => {
        this.g.toggleHold();
      }
    };
    this.lastButtonState = {};
  }

  init() {
    this.floodWait = {};
    this.lastFloodWait = {};
    Object.keys(this.keyMap).forEach(key => {
      this.floodWait[key] = this.g.config.coolDown[key];
      this.lastFloodWait[key] = 0;
    });
    window.addEventListener(
      'keydown',
      e => {
        this.handleKeyDown(e);
      },
      false
    );
    window.addEventListener(
      'keyup',
      e => {
        this.handleKeyUp(e);
      },
      false
    );
    window.addEventListener('gamepadconnected', e => {
      console.log('gamepad connected', e.gamepad);
      this.gamePadDetected = true;
      this.lastButtonState = {};
      Object.keys(this.buttonMap).forEach(button => {
        this.lastButtonState[button] = false;
      });
    });
  }

  reset() {
    for (let key in this.keyState) {
      this.keyState[key] = false;
    }
    for (let key in this.lastFloodWait) {
      this.lastFloodWait[key] = 0;
    }
  }

  isLocked() {
    const now = new Date().getTime();
    if (now < this.g.animateTo.lineBreak || now < this.g.animateTo.lineAdd) {
      return true;
    }
    return false;
  }

  process() {
    if (this.isLocked() || this.g.ended) {
      return false;
    }
    if (
      this.keyState[this.keyMap.alt] &&
      this.keyState[this.keyMap.inputToggle] &&
      this.floodSafe('inputToggle')
    ) {
      this.useGamePad = !this.useGamePad;
      this.setFloodTimer('inputToggle');
    } else if (this.gamePadDetected && this.useGamePad) {
      const gamePad = navigator.getGamepads()[0];
      const buttonState = {};
      Object.keys(this.buttonMap).forEach(button => {
        const isPressed = gamePad.buttons[this.buttonMap[button]].pressed;
        buttonState[button] = isPressed;
        if (this.lastButtonState[button] && !isPressed) {
          this.lastFloodWait[button] = 0;
        }
        if (isPressed && this.floodSafe(button)) {
          this.actionMap[button]();
          this.setFloodTimer(button);
        }
      });
      this.lastButtonState = buttonState;
    } else {
      Object.keys(this.keyMap).forEach(key => {
        if (this.keyState[this.keyMap[key]] && this.floodSafe(key)) {
          typeof this.actionMap[key] === 'function' && this.actionMap[key]();
          this.setFloodTimer(key);
        }
      });
    }
  }

  floodSafe(key) {
    return !this.floodTimers[key];
  }

  setFloodTimer(key) {
    let floodTime = this.floodWait[key];
    if (this.lastFloodWait[key]) {
      floodTime =
        this.lastFloodWait[key] -
        this.lastFloodWait[key] * this.g.config.keyDecay;
    } else {
      floodTime = this.floodWait[key];
    }
    if (floodTime < this.g.config.minKeyRepeat) {
      floodTime = this.g.config.minKeyRepeat;
    }
    this.lastFloodWait[key] = floodTime;
    this.floodTimers[key] = setTimeout(() => {
      delete this.floodTimers[key];
    }, floodTime);
  }

  handleKeyDown(e) {
    if (!this.keyState[e.keyCode]) {
      if (this.g.paused && e.keyCode != this.keyMap.pause && !this.g.ended) {
        return;
      }
      this.keyState[e.keyCode] = new Date().getTime();
    }
    if (
      e.keyCode != 116 &&
      e.keyCode != 123 &&
      typeof e.preventDefault != 'undefined'
    ) {
      e.preventDefault();
      return false;
    }
    return false;
  }

  handleKeyUp(e) {
    this.keyState[e.keyCode] = false;
    let commandName = '';
    Object.keys(this.keyMap).forEach(key => {
      if (this.keyMap[key] == e.keyCode) {
        commandName = key;
      }
    });
    if (commandName) {
      this.lastFloodWait[commandName] = 0;
    }
    for (let mi = 37; mi <= 40; mi++) {
      if (this.keyState[mi]) {
        e.preventDefault();
        this.handleKeyDown({ keyCode: mi });
      }
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  }
}
