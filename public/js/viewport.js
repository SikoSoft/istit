export default class viewport {
  constructor(g) {
    this.g = g;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.fullScreen = false;
    this.g.render.canvas.addEventListener('click', e => {
      this.toggleFullScreen();
    });
    [
      'fullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
      'webkitfullscreenchange'
    ].forEach(event => {
      document.addEventListener(event, e => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if (this.fullScreen) {
          const idealTileHeight = Math.floor(
            this.height / (this.g.config.vTiles + 1)
          );
          console.log('idealTileHeight', this.fullScreen, idealTileHeight);
          this.g.config.process({ tile: idealTileHeight });
        } else {
          this.g.config.process({ tile: this.defTile });
        }
        this.g.render.init();
      });
    });
  }

  init() {
    this.defTile = this.g.config.tile;
  }

  toggleFullScreen() {
    this.fullScreen ? this.closeFullScreen() : this.openFullScreen();
  }

  openFullScreen() {
    if (this.fullScreen) {
      return;
    }
    const doc = document.documentElement;
    if (doc.requestFullscreen) {
      doc.requestFullscreen();
    } else if (doc.mozRequestFullScreen) {
      doc.mozRequestFullScreen();
    } else if (doc.webkitRequestFullscreen) {
      doc.webkitRequestFullscreen();
    } else if (doc.msRequestFullscreen) {
      window.top.document.body.msRequestFullscreen();
    }
    this.fullScreen = true;
  }

  closeFullScreen() {
    if (!this.fullScreen) {
      return;
    }
    const doc = document;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      window.top.document.msExitFullscreen();
    }
    this.fullScreen = false;
  }
}
