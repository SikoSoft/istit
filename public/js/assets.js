export default class assets {
  constructor(g) {
    this.g = g;
    this.strings = {};
    this.images = {};
    this.sounds = {};
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
      if (this.g.config.theme.frameTexture) {
        numImages++;
        this.images.frameTexture = new Image();
        this.images.frameTexture.src = this.g.config.theme.frameTexture;
        this.images.frameTexture.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
        this.images.frameTexture.onerror = reject;
      }
      for (let l in this.g.config.theme.bgImages) {
        numImages++;
        this.images.bg[l] = new Image();
        this.images.bg[l].src = this.g.config.theme.bgImages[l];
        this.images.bg[l].onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
      }
      if (numImages === 0) {
        resolve();
      }
    });
  }

  loadSounds() {
    return new Promise((resolve, reject) => {
      let soundsLoaded = 0,
        numSounds = 0;
      this.sounds = {};
      for (let snd in this.g.config.theme.sounds) {
        numSounds++;
        this.sounds[snd] = new Audio(this.g.config.theme.sounds[snd]);
        this.sounds[snd].volume = this.g.config.defVolume;
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

  playSound(sound) {
    if (typeof this.sounds[sound] !== 'undefined') {
      this.sounds[sound].currentTime = 0;
      this.sounds[sound].play();
    }
  }
}
