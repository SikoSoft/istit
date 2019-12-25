import player from './player.js';
import MAGIC_NUM from './magicNum.js';

export default class remotePlayer extends player {
  constructor(g) {
    super(g);
    this.type = MAGIC_NUM.PLAYER_TYPE_REMOTE;
  }

  setState(state) {
    this.grid.set(state.grid);
    this.level = state.level;
    this.lines = state.lines;
    this.score = state.score;
  }

  setHoldPiece(piece) {
    this.holdPiece = piece;
  }
}
