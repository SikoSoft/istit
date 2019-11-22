import MAGIC_NUM from './magicNum.js';

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
      inputToggle: 90,
      f5: 116,
      f12: 123
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
    this.stateActions = {
      waiting: {
        _all: () => {
          this.g.start();
        } 
      },
      paused: {
        pause: () => {
          this.g.pause();
        } 
      },
      gameplay: {
        pause: () => {
          this.g.pause();
        },
        drop: (player) => {
          player.placeFallingPieceAtBottom();
        },
        left: (player) => {
          player.movePiece(-1);
        },
        rotate: (player) => {
          player.rotatePiece();
        },
        right: (player) => {
          player.movePiece(1);
        },
        down: (player) => {
          player.adjustFallingHeightOffset();
        },
        hold: (player) => {
          player.toggleHold();
        }
      },
      gameplayLocked: {},
      ended: {
        _all: () => {
          this.g.restart();
        } 
      }
    };
    this.lastButtonState = {};
    this.devices = [];
    this.setupDevice(MAGIC_NUM.DEVICE_TYPE_KEYBOARD);
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
    window.addEventListener('gamepadconnected', () => {
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

  setupDevice(type) {
    this.devices.push({
      type,
      player: false
    });
    return this.devices.length - 1;
  }

  register(device, player) {
    if (this.devices[device] && this.devices[device].player === false) {
      this.devices[device].player = player;
    }
  }

  isLocked() {
    const now = new Date().getTime();
    if (now < this.g.player.animateTo.lineBreak || now < this.g.player.animateTo.lineAdd) {
      return true;
    }
    return false;
  }

  process() {
    if (this.keyState[this.keyMap.alt]) {
      if (
        this.keyState[this.keyMap.inputToggle] &&
        this.floodSafe('inputToggle')
      ) {
        this.useGamePad = !this.useGamePad;
        this.setFloodTimer('inputToggle');
      }
      return;
    }
    let state = 'gameplayLocked';
    if (this.g.wait) {
      state = 'waiting';
    } else if (this.g.ended) {
      state = 'ended';
    } else if (this.g.paused) {
      state = 'paused';
    } else {
      state = 'gameplay';
    }
    this.devices.forEach(device => {
      if (device.type === MAGIC_NUM.DEVICE_TYPE_XBOX360 && this.gamePadDetected && this.useGamePad) {
        const gamePad = navigator.getGamepads()[0];
        const buttonState = {};
        Object.keys(this.buttonMap).forEach(button => {
          const isPressed = gamePad.buttons[this.buttonMap[button]].pressed;
          buttonState[button] = isPressed;
          if (this.lastButtonState[button] && !isPressed) {
            this.lastFloodWait[button] = 0;
          }
          if (isPressed && this.floodSafe(button)) {
            if (typeof this.stateActions[state][button] === 'function') {
              this.stateActions[state][button](device.player);
            }
            if (typeof this.stateActions[state]._all === 'function') {
              this.stateActions[state]._all(device.player);
            }
            this.setFloodTimer(button);
          }
        });
        this.lastButtonState = buttonState;
      } else {
        Object.keys(this.keyMap).forEach(key => {
          if (this.keyState[this.keyMap[key]] && this.floodSafe(key)) {
            if (typeof this.stateActions[state][key] === 'function') {
              this.stateActions[state][key](device.player);
            }
            if (typeof this.stateActions[state]._all === 'function') {
              this.stateActions[state]._all(device.player);
            }
            this.setFloodTimer(key);
          }
        });
      }
    });
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
      this.keyState[e.keyCode] = new Date().getTime();
    }
    if (
      e.keyCode !== this.keyMap.f5 &&
      e.keyCode !== this.keyMap.f12 &&
      typeof e.preventDefault !== 'undefined'
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
      if (this.keyMap[key] === e.keyCode) {
        commandName = key;
      }
    });
    if (commandName) {
      this.lastFloodWait[commandName] = 0;
    }
    for (let mi = this.keyMap.left; mi <= this.keyMap.down; mi++) {
      if (this.keyState[mi]) {
        e.preventDefault();
        this.handleKeyDown({
          keyCode: mi 
        });
      }
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  }
}
