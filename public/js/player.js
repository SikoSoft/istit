export default class player {
  constructor(g) {
    this.g = g;
    this.reset();
    this.name = 'Player';
    this.lastRank = -1;
  }

  reset() {
    this.score = 0;
    this.level = 0;
    this.lines = 0;
    this.grid = [];
    this.special = {};
    this.resetGrid();
    this.resetFallingPiece();
  }

  state() {
    let copy = {};
    Object.keys(this).forEach(key => {
      if (key !== 'g' && typeof this[key] !== 'function') {
        copy[key] = this[key];
      }
    });
    return copy;
  }

  resetGrid() {
    for (let h = 0; h < this.g.config.hTiles; h++) {
      this.grid[h] = [];
      for (let v = 0; v < this.g.config.vTiles; v++) {
        this.grid[h][v] = 0;
      }
    }
  }

  resetFallingPiece() {
    this.fallingPiece = {
      start: 0,
      x: 0,
      y: 0,
      lastY: 0,
      type: -1,
      position: 1,
      elapsed: 0,
      placed: false
    };
  }

  setFallingPiece(properties) {
    this.fallingPiece = { ...this.fallingPiece, ...properties };
  }

  dropPiece(properties) {
    this.setFallingPiece({
      ...properties,
      lastY: properties.y,
      offset: 0,
      position: 1,
      placed: false,
      elapsed: 0
    });
  }
}
