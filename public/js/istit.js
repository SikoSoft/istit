import config from './config.js';
import player from './player.js';
import input from './input.js';
import mp from './mp.js';
import render from './render.js';
import viewport from './viewport.js';
import leaderBoard from './leaderBoard.js';

export default class istit {
  constructor() {
    window.istit = this;
    this.version = '1.2.0';
    this.config = new config(this);
    this.strings = {};
    this.runTime = 0;
    this.startTime = 0;
    this.paused = false;
    this.ended = false;
    this.wait = false;
    this.time = 0;
    this.levels = {};
    this.images = {};
    this.volume = this.config.defVolume;
    this.showingNamePrompt = false;
  }

  init(canvasId) {
    this.canvasId = canvasId;
    this.halfPI = Math.PI / 2;
    this.halfTile = this.config.tile / 2;
    this.player = new player(this);
    this.opponent = new player(this);
    this.input = new input(this);
    this.mp = new mp(this);
    this.leaderBoard = new leaderBoard(this);
    this.render = new render(this);
    this.viewport = new viewport(this);
    this.run();
  }

  run() {
    this.load().then(() => {
      this.input.init();
      this.render.init();
      this.viewport.init();
      this.getLevelScores(50);
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
    let x = ms / 1000;
    const seconds = Math.floor(x % 60);
    x /= 60;
    const minutes = Math.floor(x % 60);
    x /= 60;
    const hours = Math.floor(x % 24);
    x /= 24;
    const days = Math.floor(x);
    return [days, hours, minutes, seconds];
  }

  start() {
    this.reset();
    this.player.dropPiece();
  }

  restart() {
    if (this.mp.sessionEnded || this.mp.wait) {
      this.mp.endSession();
    }
    this.render.resizeForSP();
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
    this.player.reset();
    this.opponent.reset();
  }

  end(isWinner) {
    if (!this.ended) {
      this.ended = new Date().getTime();
      if (this.mp.session > -1) {
        this.mp.isWinner = isWinner || false;
        if (!isWinner) {
          this.mp.sendEnd();
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
          return this.loadStrings();
        })
        .then(() => {
          return this.loadImages();
        })
        .then(() => {
          return this.loadSounds();
        })
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.log('Encountered an error while loading!', error);
        });
    });
  }

  loadStrings() {
    return new Promise((resolve, reject) => {
      fetch('strings.json')
        .then(data => data.json())
        .then(json => {
          this.strings = json;
          resolve(json);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadImages() {
    return new Promise((resolve, reject) => {
      let imagesLoaded = 0,
        numImages = 0;
      this.images.bg = {};
      if (this.config.theme.frameTexture) {
        numImages++;
        this.images.frameTexture = new Image();
        this.images.frameTexture.src = this.config.theme.frameTexture;
        this.images.frameTexture.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
        this.images.frameTexture.onerror = reject;
      }
      for (let l in this.config.theme.bgImages) {
        numImages++;
        this.images.bg[l] = new Image();
        this.images.bg[l].src = this.config.theme.bgImages[l];
        this.images.bg[l].onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
      }
      if (numImages == 0) {
        resolve();
      }
    });
  }

  loadSounds() {
    return new Promise((resolve, reject) => {
      let soundsLoaded = 0,
        numSounds = 0;
      this.sounds = {};
      for (let snd in this.config.theme.sounds) {
        numSounds++;
        this.sounds[snd] = new Audio(this.config.theme.sounds[snd]);
        this.sounds[snd].volume = this.config.defVolume;
        this.sounds[snd].onloadeddata = () => {
          soundsLoaded++;
          if (soundsLoaded === numSounds) {
            resolve();
          }
        };
        this.sounds[snd].onerror = reject;
      }
    });
  }

  pause() {
    if (this.mp.session == -1) {
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
    if (this.mp.countingDown) {
      const remaining = Math.ceil(
        (this.mp.countUntil - new Date().getTime()) / 1000
      );
      if (remaining != this.lastCountDown) {
        if (typeof this.sounds['countDown'] != 'undefined') {
          this.sounds['countDown'].currentTime = 0;
          this.sounds['countDown'].play();
        }
      }
      this.lastCountDown = remaining;
    }
    if (this.inPlay()) {
      this.lastDelta = new Date().getTime() - this.lastTick;
      if (this.mp.session == -1) {
        this.runTime += this.lastDelta;
      }
      if (
        new Date().getTime() > this.player.animateTo.lineBreak &&
        new Date().getTime() > this.player.animateTo.lineAdd
      ) {
        if (this.player.linesToClear.length > 0) {
          this.player.destroyLines();
        }
        if (this.player.linesToGet > 0) {
          this.player.insertLines();
        }
      }
      this.player.adjustFallingHeight();
      if (
        this.runTime > this.player.dropAt &&
        this.player.fallingPiece.start < this.player.dropAt
      ) {
        this.player.dropPiece();
      }
      for (let i = this.player.messages.length - 1; i >= 0; i--) {
        let m = this.player.messages[i];
        if (this.runTime > m.expiration) {
          this.player.messages.splice(i, 1);
        }
      }
      if (this.runTime > this.nextSpecialTime) {
        this.spawnSpecial();
        this.nextSpecialTime = this.runTime + this.config.specialInterval;
      }
      for (let i in this.player.special) {
        if (this.runTime > this.player.special[i]) {
          delete this.player.special[i];
        }
      }
      if (this.runTime > this.nextSpecialJitterTime) {
        let joa = [-1, 0, 1];
        this.xSpecialJitter = joa[this.random(1, joa.length) - 1];
        this.ySpecialJitter = joa[this.random(1, joa.length) - 1];
        this.nextSpecialJitterTime = this.runTime + this.config.specialJitter;
      }
    }
    const now = new Date().getTime();
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
      now > this.ended + 100 &&
      this.leaderBoard.use()
    ) {
      this.leaderBoard.queue(true);
    }
    this.lastTick = new Date().getTime();
    this.input.process();
  }

  adjustTime(dif) {
    this.time += dif;
  }

  spawnSpecial() {
    let num = 0,
      low = this.config.vTiles;
    for (let c = 0; c < this.config.hTiles; c++) {
      num = this.player.getClosestToTopInColumn(c);
      if (num < low) {
        low = num;
      }
    }
    const perRow = this.config.vTiles / (this.config.vTiles - low);
    let chance = 0;
    const rows = [];
    for (let r = low; r < this.config.vTiles; r++) {
      chance += perRow;
      const percent = chance / this.config.vTiles;
      const rand = this.random(1, 100);
      if (rand <= percent * 100) {
        rows.push(r);
      }
    }
    const rowIndex = this.random(1, rows.length) - 1;
    const r = rows[rowIndex];
    const cells = [];
    for (let c = 0; c < this.config.hTiles; c++) {
      if (this.player.grid[c][r]) {
        cells.push(c);
      }
    }
    const columnIndex = this.random(1, cells.length) - 1;
    const c = cells[columnIndex];
    if (r && c) {
      this.player.special[r + ':' + c] =
        this.runTime + this.config.specialDuration;
    }
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

  getGhostBlocks() {
    const ghost = [];
    const blocks = this.player.getFallingBlocks();
    let mostDif = this.config.vTiles,
      tmpDif = 0;
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let h = this.player.getClosestToTopInColumn(c);
      tmpDif = h - blocks[i].r - 1;
      if (tmpDif < mostDif) {
        mostDif = tmpDif;
      }
    }
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let r = blocks[i].r;
      let newR = r + mostDif;
      ghost.push({ c: c, r: newR });
    }
    return ghost;
  }

  getPieceOffset(x, y) {
    const xOffset = x * this.config.tile;
    const yOffset = y * this.config.tile;
    return [xOffset, yOffset];
  }

  getLevelScores(mLevel) {
    let score;
    let lastScore = 0;
    this.levels[1] = 0;
    for (let l = 2; l <= mLevel; l++) {
      if (l == 2) {
        score = this.config.levelIncreaseThreshold;
      } else {
        score =
          lastScore +
          this.config.levelIncreaseThreshold +
          Math.floor(lastScore * this.config.levelIncreaseMultiplier);
      }
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
    for (let i = 0; i < 4; i++) {
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
}
