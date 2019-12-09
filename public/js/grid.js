import MAGIC_NUM from './magicNum.js';

export default class grid {
  constructor(player) {
    this.player = player;
    this.weightHistory = [];
  }

  init() {
    this.reset();
  }

  reset() {
    this.rows = this.player.g.config.vTiles;
    this.columns = this.player.g.config.hTiles;
    this.matrix = [];
    for (let r = 0; r < this.rows; r++) {
      this.matrix[r] = [];
      for (let c = 0; c < this.columns; c++) {
        this.matrix[r][c] = 0;
      }
    }
  }

  set(matrix) {
    this.matrix = matrix;
  }

  handleGridChange() {
    if (this.player.g.mp.session > -1) {
      this.player.g.mp.sendState();
    }
    this.weightHistory.push({
      time: new Date().getTime(),
      weight: this.getCompoundedWeight()
    });
    const now = new Date().getTime();
    const expiry = now - this.player.g.config.safetyTime;
    for (let i = this.weightHistory.length - 1; i >= 0; i--) {
      if (this.weightHistory[i].time < expiry) {
        this.weightHistory.splice(i, 1);
      }
    }
  }

  collides(
    cAdjust,
    rAdjust,
    oAdjust = this.player.fallingPiece.position,
    type
  ) {
    let collidesWith = false;
    let tmpC = -1;
    let tmpR = -1;
    const blocks = this.getFallingBlocks(oAdjust, type);
    for (let b = 0; b < blocks.length; b++) {
      tmpC = blocks[b].c + cAdjust;
      tmpR = blocks[b].r + rAdjust;
      if (tmpC < 0) {
        collidesWith = 'left';
      } else if (tmpC > this.columns - 1) {
        collidesWith = 'right';
      } else if (tmpR > this.rows - 1) {
        collidesWith = 'bottom';
      }
      if (
        tmpC > -1 &&
        tmpC < this.columns &&
        tmpR > -1 &&
        tmpR < this.rows &&
        this.matrix[tmpR][tmpC] !== 0
      ) {
        collidesWith = 'bottom';
      }
    }
    return collidesWith;
  }

  getFallingBlocks(
    p = this.player.fallingPiece.position,
    t = this.player.fallingPiece.type
  ) {
    if (this.player.fallingPiece.type === -1) {
      return [];
    }
    let r = 0;
    let c = 0;
    const blocks = [];
    for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
      c =
        this.player.fallingPiece.c +
        this.player.g.config.pieces[t].orientations[p][b][0] -
        1;
      r =
        this.player.fallingPiece.r +
        this.player.g.config.pieces[t].orientations[p][b][1] -
        1;
      blocks[b] = {
        r,
        c
      };
    }
    return blocks;
  }

  getGhostBlocks() {
    const ghost = [];
    const blocks = this.getFallingBlocks();
    let mostDif = this.rows,
      tmpDif = 0;
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let h = this.getClosestToTopInColumn(c);
      tmpDif = h - blocks[i].r - 1;
      if (tmpDif < mostDif) {
        mostDif = tmpDif;
      }
    }
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let r = blocks[i].r;
      let newR = r + mostDif;
      ghost.push({
        c,
        r: newR
      });
    }
    return ghost;
  }

  getCompleteLines() {
    return this.matrix.reduce((solidRows, row, v) => {
      return row.every(cell => cell > 0) ? solidRows.concat(v) : solidRows;
    }, []);
  }

  destroyLines() {
    const lines = this.player.linesToClear;
    const numLines = lines.length;
    for (let l = 0; l < numLines; l++) {
      let line = lines[l];
      for (let r = 0; r < this.rows; r++) {
        if (r === line) {
          for (let c = 0; c < this.columns; c++) {
            this.matrix[r][c] = 0;
          }
        }
      }
      for (let r = this.rows - 1; r >= 0; r--) {
        if (r < line) {
          for (let c = 0; c < this.columns; c++) {
            let tmpVal = this.matrix[r][c];
            this.matrix[r][c] = 0;
            this.matrix[r + 1][c] = tmpVal;
            if (typeof this.player.special[r + ':' + c] !== 'undefined') {
              this.player.special[r + 1 + ':' + c] = this.player.special[
                r + ':' + c
              ];
              delete this.player.special[r + ':' + c];
            }
          }
        }
      }
    }
    let isCleared = true;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        if (this.matrix[r][c]) {
          isCleared = false;
          break;
        }
      }
      if (!isCleared) {
        break;
      }
    }
    if (isCleared && this.player.okForClearBonus) {
      this.player.adjustScore(this.player.g.config.clearBonus, {
        text: 'all clear'
      });
    }
    this.player.linesToClear = [];
    if (this.player.g.mp.session > -1) {
      this.player.g.mp.sendLines(numLines);
    } else if (this.player.g.players.length > 1) {
      this.player.g.players.forEach(player => {
        if (this.player !== player) {
          player.grid.getLines(numLines);
        }
      });
    }
    this.handleGridChange();
  }

  clearLines(lines) {
    const msg = this.player.g.assets.strings.linesClearedX.replace(
      '{lines}',
      lines.length
    );
    const hotPiece = this.player.getHotPiece(lines);
    if (lines.length === MAGIC_NUM.BLOCKS) {
      this.player.adjustScore(MAGIC_NUM.POINTS_MAX_LINES, {
        text: msg,
        r: hotPiece.r,
        c: hotPiece.c
      });
      this.player.chainCount++;
      if (this.player.chainCount > 1) {
        this.player.adjustScore(
          MAGIC_NUM.POINTS_MAX_LINES * this.player.chainCount,
          {
            text: this.player.g.assets.strings.istitChain,
            r: hotPiece.r,
            c: hotPiece.c
          }
        );
      }
    } else {
      this.player.chainCount = 0;
      this.player.adjustScore(lines.length * MAGIC_NUM.POINTS_LINE, {
        text: msg,
        r: hotPiece.r,
        c: hotPiece.c
      });
    }
    for (let i = 0; i < lines.length; i++) {
      for (let s in this.player.special) {
        for (let c = 0; c < this.columns; c++) {
          if (typeof this.player.special[lines[i] + ':' + c] !== 'undefined') {
            delete this.player.special[lines[i] + ':' + c];
            this.player.adjustScore(
              this.player.g.config.specialBonus,
              {
                text: this.player.g.assets.strings.goldenBlock
              },
              false
            );
          }
        }
      }
    }
    this.player.g.assets.playSound('clearLine');
    this.player.g.assets.playSound('lines' + lines.length);
    this.player.lines += lines.length;
    this.player.linesToClear = lines;
    this.player.animateTo.lineBreak =
      new Date().getTime() + this.player.g.config.animateCycle.lineBreak;
  }

  getLines(num) {
    this.player.linesToGet += num;
    this.player.g.assets.playSound('newLine');
    this.player.animateTo.lineAdd =
      new Date().getTime() + this.player.g.config.animateCycle.lineAdd;
  }

  insertLines() {
    for (let i = 0; i < this.player.linesToGet; i++) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.columns; c++) {
          let tmpVal = this.matrix[r][c];
          this.matrix[r][c] = 0;
          if (r > 0) {
            this.matrix[r - 1][c] = tmpVal;
          }
        }
      }
      const empty = this.player.g.random(1, this.columns);
      for (let li = 0; li < this.columns; li++) {
        if (li !== empty) {
          this.matrix[this.rows - 1][li] = 8;
        }
      }
    }
    this.player.linesToGet = 0;
    this.handleGridChange();
  }

  getClosestToTopInColumn(c) {
    for (let r = 0; r < this.rows; r++) {
      if (this.matrix[r][c]) {
        return r;
      }
    }
    return this.rows;
  }

  getCompoundedWeight() {
    let numFilled = 0,
      total = 0;
    for (let c = 0; c < this.columns; c++) {
      for (let r = 0; r < this.rows; r++) {
        total++;
        if (this.matrix[r][c]) {
          numFilled++;
        }
      }
    }
    return numFilled / total;
  }

  rowIsCleared(r) {
    for (let i = 0; i < this.player.linesToClear.length; i++) {
      if (this.player.linesToClear[i] === r) {
        return true;
      }
    }
    return false;
  }
}
