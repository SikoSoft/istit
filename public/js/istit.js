import config from './config.js';
import assets from './assets.js';
import localPlayer from './localPlayer.js';
import remotePlayer from './remotePlayer.js';
import input from './input.js';
import mp from './mp.js';
import render from './render.js';
import viewport from './viewport.js';
import leaderBoard from './leaderBoard.js';
import MAGIC_NUM from './magicNum.js';

export default class istit {
  constructor() {
    window.istit = this;
    this.version = '1.3.0';
    this.config = new config(this);
    this.assets = new assets(this);
    this.runTime = 0;
    this.startTime = 0;
    this.paused = false;
    this.ended = false;
    this.wait = false;
    this.levels = {};
    this.players = [];
    this.volume = this.config.defVolume;
    this.showingNamePrompt = false;
  }

  init(canvasId) {
    this.canvasId = canvasId;
    this.input = new input(this);
    this.mp = new mp(this);
    this.leaderBoard = new leaderBoard(this);
    this.render = new render(this);
    this.viewport = new viewport(this);
    this.registerLocalPlayer(0);
    this.player = this.players[0];
    this.run();
  }

  registerLocalPlayer(inputDevice = 0) {
    const p = new localPlayer(this);
    if (inputDevice > -1) {
      p.registerInput(inputDevice);
    }
    this.players.push(p);
    return this.players.length - 1;
  }

  registerRemotePlayer() {
    this.players.push(new remotePlayer(this));
    return this.players.length - 1;
  }

  unregisterPlayer(player) {
    this.players = this.players.filter(p => p !== player);
  }

  run() {
    this.load().then(() => {
      this.input.init();
      this.render.init();
      this.viewport.init();
      this.getLevelScores(MAGIC_NUM.MAX_LEVELS);
      this.lastTick = new Date().getTime();
      this.startTime = new Date().getTime();
      this.wait = true;
      setInterval(() => {
        this.update();
      }, 0);
      setInterval(() => {
        this.render.draw();
      }, 0);
    });
  }

  parseMiliSeconds(ms) {
    let x = ms / MAGIC_NUM.MILISECONDS;
    const seconds = Math.floor(x % MAGIC_NUM.SECONDS);
    x /= MAGIC_NUM.SECONDS;
    const minutes = Math.floor(x % MAGIC_NUM.MINUTES);
    x /= MAGIC_NUM.MINUTES;
    const hours = Math.floor(x % MAGIC_NUM.HOURS);
    x /= MAGIC_NUM.HOURS;
    const days = Math.floor(x);
    return [days, hours, minutes, seconds];
  }

  start() {
    this.reset();
    this.players.forEach(player => {
      player.start();
    });
  }

  restart() {
    if (this.mp.sessionEnded || this.mp.wait) {
      this.mp.endSession();
    }
    this.render.resize();
    this.paused = false;
    this.start();
  }

  reset() {
    this.input.reset();
    this.render.init();
    this.wait = false;
    this.ended = false;
    this.runTime = 0;
    this.lastTick = new Date().getTime();
    this.startTime = new Date().getTime();
    this.leaderBoard.isShowing = false;
    this.players.forEach(player => {
      player.reset();
    });
  }

  end(isWinner) {
    if (!this.ended) {
      this.ended = new Date().getTime();
      if (this.mp.session > -1) {
        this.mp.isWinner = isWinner || false;
        if (!isWinner) {
          this.mp.sendGameEnd();
        }
        this.mp.endSession();
      }
    }
  }

  load() {
    return new Promise(resolve => {
      this.config
        .load()
        .then(() => {
          return this.assets.loadStrings();
        })
        .then(() => {
          return this.assets.loadImages();
        })
        .then(() => {
          return this.assets.loadSounds();
        })
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.log('Encountered an error while loading!', error); //eslint-disable-line
        });
    });
  }

  pause() {
    if (this.mp.session === -1) {
      if (!this.ended) {
        this.paused = !this.paused;
      }
    }
  }

  inPlay() {
    if (this.ended || this.paused || this.mp.wait || this.wait) {
      return false;
    }
    return true;
  }

  update() {
    const now = new Date().getTime();
    if (this.mp.countingDown) {
      const remaining = Math.ceil(
        (this.mp.countUntil - now) / MAGIC_NUM.MILISECONDS
      );
      if (remaining !== this.lastCountDown) {
        this.assets.playSound('countDown');
      }
      this.lastCountDown = remaining;
    }
    if (this.inPlay()) {
      this.lastDelta = now - this.lastTick;
      if (this.mp.session === -1) {
        this.runTime += this.lastDelta;
      }
      this.players.forEach(player => {
        player.update();
      });
    }
    if (this.leaderBoard.isShowing) {
      let sysPer =
        (this.config.animateCycle.sysUp - (this.player.animateTo.sysUp - now)) /
        this.config.animateCycle.sysUp;
      let lbPer = 0;
      if (sysPer > 1) {
        sysPer = 1;
        lbPer =
          (this.config.animateCycle.lbShow -
            (this.player.animateTo.sysUp +
              this.config.animateCycle.lbShow -
              now)) /
          this.config.animateCycle.lbShow;
        if (lbPer > 1) {
          lbPer = 1;
        }
      }
      this.render.sysY = this.render.sysYDef - sysPer * this.render.sysYDif;
      this.render.lbLeftX =
        this.render.lbLeftXDef + lbPer * this.render.lbLeftXDif;
      this.render.lbRightX =
        this.render.lbRightXDef + lbPer * this.render.lbRightXDif;
      this.render.lbPer = lbPer;
    } else if (
      !this.showingNamePrompt &&
      this.ended &&
      now > this.ended + MAGIC_NUM.END_LB_DELAY &&
      this.leaderBoard.use()
    ) {
      this.leaderBoard.queue(true);
    }
    this.lastTick = new Date().getTime();
    this.input.process();
  }

  randomPiece() {
    let wSum = 0;
    for (let key in this.config.pieces) {
      wSum += this.config.pieces[key].weight;
    }
    let seed = Math.floor(Math.random() * wSum + 1);
    for (let key in this.config.pieces) {
      const w = this.config.pieces[key].weight;
      if (seed <= w) {
        return key * 1;
      } else {
        seed -= w;
      }
    }
    return 1;
  }

  getLevelScores(mLevel) {
    let score;
    let lastScore = 0;
    this.levels[1] = 0;
    for (let l = 2; l <= mLevel; l++) {
      score =
        lastScore +
        this.config.levelIncreaseThreshold +
        Math.floor(lastScore * this.config.levelIncreaseMultiplier);
      this.levels[l] = score;
      lastScore = score;
    }
    return this.levels;
  }

  random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  getPieceDimension(t, o, d) {
    const blocks = this.config.pieces[t].orientations[o];
    let min = 9,
      max = 0;
    for (let i = 0; i < MAGIC_NUM.BLOCKS; i++) {
      let n = blocks[i][d];
      if (n < min) {
        min = n;
      }
      if (n > max) {
        max = n;
      }
    }
    return max - min + 1;
  }

  prepareLocalMP() {
    const availableDevice = this.input.getAvailableDevice();
    if (availableDevice) {
      this.registerLocalPlayer(MAGIC_NUM.PLAYER_TYPE_LOCAL, availableDevice);
      this.render.resize();
    }
  }
}
