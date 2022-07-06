class Player {
  constructor(game, options) {
    // this.deltaPosition = new THREE.Vector3(0, 0, 0);
    this.game = game;
    this.local = true;
    // this.options = type;
    this.anims = ["run2", "idle", "jump"];
    this.animations = {};
    this.init(game, options);
    this.dirs = [];
    this.obj;
  }

  init(game, options) {
    // event listeners
    window.addEventListener("keydown", this.move.bind(this));
    window.addEventListener("keyup", this.filterKey.bind(this));
    let model = "characterMedium";
    let skin;
    if (options == undefined) {
      const skins = [
        "criminalMale",
        "cyborgFemale",
        "skaterFemale",
        "skaterMale",
      ];
      skin = skins[Math.floor(Math.random() * skins.length)];
    } else if (typeof options == "object") {
      this.local = false;
      this.options = options;
      this.id = options.id;
      skin = options.skin;
    }

    this.model = model;
    this.skin = skin;
    this.game = game;
    const loader = new THREE.FBXLoader();
    const player = this;
    console.log("path ", `static/Model/${model}.fbx`);
    loader.load(`static/Model/${model}.fbx`, function (object) {
      console.log("loading");

      object.mixer = new THREE.AnimationMixer(object);
      player.root = object;
      player.mixer = object.mixer;

      object.name = "Person";

      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const textureLoader = new THREE.TextureLoader();
      const texturePath = `static/Skins/${skin}.png`;
      console.log("PATH ", texturePath);
      textureLoader.load(`static/Skins/${skin}.png`, function (texture) {
        console.log("loading texture");
        object.traverse(function (child) {
          if (child.isMesh) {
            console.log("child", child);
            console.log("texture", texture);
            child.material = new THREE.MeshBasicMaterial({
              map: texture,
              skinning: true,
            });
          }
        });
      });

      player.object = new THREE.Object3D();
      player.object.scale.multiplyScalar(0.25);
      //   player.object.position.set(3122, 0, -173);
      player.object.rotation.set(0, 0, 0);

      player.object.add(object);
      player.loadAnim(loader);
      console.log("should have called");
      if (player.deleted === undefined) {
        console.log("adding player to scene");
        game.scene.add(player.object);
        player.object.position.copy(new THREE.Vector3(0, 0, 0));
        console.log("POSITION ", player.object.position);
      }

      if (player.local) {
        game.createCameras();
        game.sun.target = game.player.object;
        game.animations.Idle = object.animations[0];
        // if (player.initSocket !== undefined) player.initSocket();
      } else {
        const geometry = new THREE.BoxGeometry(100, 300, 100);
        const material = new THREE.MeshBasicMaterial({ visible: false });
        const box = new THREE.Mesh(geometry, material);
        box.name = "Collider";
        box.position.set(0, 150, 0);
        player.object.add(box);
        player.collider = box;
        player.object.userData.id = player.id;
        player.object.userData.remotePlayer = true;
        const players = game.initialisingPlayers.splice(
          game.initialisingPlayers.indexOf(this),
          1
        );
        game.remotePlayers.push(players[0]);
      }
      if (this.animations.idle !== undefined) player.action = "idle";
    });
  }

  move(event) {
    this.checkKey(event);
    // this.moveUpdate(dt);
  }
  moveUpdate(dt) {
    if (this.dirs.length == 0) {
      this.action = "idle";
      return;
    }
    const speed = 300;
    var deltaPosition = new THREE.Vector3(0, 0, 0);
    this.dirs.forEach((dir) => {
      switch (dir) {
        case "left":
          deltaPosition.add(new THREE.Vector3(dt * speed, 0, 0));
          break;
        case "right":
          deltaPosition.add(new THREE.Vector3(dt * -speed, 0, 0));
          break;
        case "forward":
          deltaPosition.add(new THREE.Vector3(0, 0, dt * speed));
          break;
        case "backward":
          deltaPosition.add(new THREE.Vector3(0, 0, dt * -speed));
          break;
        default:
          break;
      }

      if (this.dirs.includes("left") && this.dirs.includes("forward")) {
        this.object.rotation.set(0, Math.PI / 4, 0);
      } else if (this.dirs.includes("right") && this.dirs.includes("forward")) {
        this.object.rotation.set(0, -Math.PI / 4, 0);
      } else if (this.dirs.includes("left") && this.dirs.includes("backward")) {
        this.object.rotation.set(0, (-5 * Math.PI) / 4, 0);
      } else if (
        this.dirs.includes("right") &&
        this.dirs.includes("backward")
      ) {
        this.object.rotation.set(0, (5 * Math.PI) / 4, 0);
      } else if (this.dirs.includes("left")) {
        this.object.rotation.set(0, Math.PI / 2, 0);
      } else if (this.dirs.includes("right")) {
        this.object.rotation.set(0, -Math.PI / 2, 0);
      } else if (this.dirs.includes("forward")) {
        this.object.rotation.set(0, 0, 0);
      } else if (this.dirs.includes("backward")) {
        this.object.rotation.set(0, Math.PI, 0);
      }
    });
    this.object.position.add(deltaPosition);
    // if (deltaPosition.length() == 0) {
    //     this.action = 'idle'
    //     return;
    // }
    this.action = "run2";
  }

  loadAnim(loader) {
    const scope = this;
    let anim = this.anims.pop();
    loader.load(`static/Animations/${anim}.fbx`, function (object) {
      scope.animations[anim] = object.animations[0];
      if (scope.anims.length > 0) {
        scope.loadAnim(loader);
      } else {
        delete scope.anims;
        scope.action = "idle";
        console.log("action is set");
        scope.game.animate();
      }
    });
  }

  set action(name) {
    //Make a copy of the clip if this is a remote player
    if (this.actionName == name) return;
    const clip = this.local
      ? this.animations[name]
      : THREE.AnimationClip.parse(
          THREE.AnimationClip.toJSON(this.animations[name])
        );
    const action = this.mixer.clipAction(clip);
    action.time = 0;
    this.mixer.stopAllAction();
    this.actionName = name;
    this.actionTime = Date.now();

    action.fadeIn(0.5);
    action.play();
  }

  get action() {
    return this.actionName;
  }

  checkKey(event) {
    // if (event.repeat) return;
    if (event.key == "a" || event.key == "A") {
      if (this.dirs.includes("left") == false) {
        this.dirs.push("left");
      }
    } else if (event.key == "d" || event.key == "D") {
      if (this.dirs.includes("right") == false) {
        this.dirs.push("right");
      }
    } else if (event.key == "w" || event.key == "W") {
      if (this.dirs.includes("forward") == false) {
        this.dirs.push("forward");
      }
    } else if (event.key == "s" || event.key == "S") {
      if (this.dirs.includes("backward") == false) {
        this.dirs.push("backward");
      }
    }
  }

  filterKey(event) {
    var filtered = [];
    if (event.key == "a" || event.key == "A" || event.key == "ArrowLeft") {
      filtered = this.dirs.filter((dir) => dir != "left");
    } else if (event.key == "d" || event.key == "D") {
      filtered = this.dirs.filter((dir) => dir != "right");
    } else if (event.key == "w" || event.key == "W" || event.key == "ArrowUp") {
      filtered = this.dirs.filter((dir) => dir != "forward");
    } else if (event.key == "s" || event.key == "S") {
      filtered = this.dirs.filter((dir) => dir != "backward");
    }

    this.dirs = filtered;
    if (this.dirs.length == 0) {
      this.action = "idle";
    }
  }
}
