class Player {
  constructor(game, options) {
    // this.deltaPosition = new THREE.Vector3(0, 0, 0);
    this.game = game;
    this.local = true;
    // this.options = type;
    this.anims = ["run2", "idle", "jump", "back"];
    this.animations = {};
    this.dirs = [];
    this.currDir = new THREE.Vector3(0, 0, 1);
    this.axis = new THREE.Vector3(0, 1, 0);
    this.init(game, options);
  }

  init(game, options) {
    // event listeners
    window.addEventListener("keydown", this.checkKey.bind(this));
    window.addEventListener("keyup", this.filterKey.bind(this));
    let model = "characterMedium";
    let skin;
    if (options == undefined) {
      // means it is local player
      const skins = [
        "criminalMale",
        "cyborgFemale",
        "skaterFemale",
        "skaterMale",
      ];
      skin = skins[Math.floor(Math.random() * skins.length)];
    }
    if (typeof options == "object") {
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
      console.log("object ", object.rotation._x);
      // this.currRotation = object.rotation;
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
      console.log("should have called", player.local);
      if (player.deleted === undefined) {
        console.log("adding player to scene");
        game.scene.add(player.object);
        player.object.position.copy(new THREE.Vector3(0, 0, 0));
        console.log("POSITION ", player.object.position);
      }

      if (player.local) {
        console.log(io);
        game.createCameras();
        // if (player.initSocket !== undefined) player.initSocket();
        player.socket = io.connect();
        // player.socket.emit("init", {
        //   skin: player.skin,
        //   x: player.object.position.x,
        //   y: player.object.position.y,
        //   z: player.object.position.z,
        //   h: player.object.rotation.y,
        //   pb: player.object.rotation.x
        // });
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

  moveUpdate(dt) {
    if (this.dirs.length == 0) {
      this.action = "idle";
      return;
    }
    const speed = 400;
    var angle;
    this.dirs.forEach((dir) => {
      switch (dir) {
        case "left":
          angle = Math.PI / 128;
          this.currDir.applyAxisAngle(this.axis, angle);
          this.object.rotateY(angle);
          break;
        case "right":
          angle = -Math.PI / 128;
          this.currDir.applyAxisAngle(this.axis, angle);
          this.object.rotateY(angle);
          break;
        case "forward":
          this.object.position.add(
            this.currDir.clone().multiplyScalar(dt * speed)
          );
          this.action = "run2";
          break;
        case "backward":
          this.object.position.add(
            this.currDir.clone().multiplyScalar(dt * -speed)
          );
          this.action = "back";
          break;
        default:
          break;
      }
    });
    this.updateSocket();
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
    if (event.key == "a" || event.key == "A") {
      filtered = this.dirs.filter((dir) => dir != "left");
    } else if (event.key == "d" || event.key == "D") {
      filtered = this.dirs.filter((dir) => dir != "right");
    } else if (event.key == "w" || event.key == "W") {
      filtered = this.dirs.filter((dir) => dir != "forward");
    } else if (event.key == "s" || event.key == "S") {
      filtered = this.dirs.filter((dir) => dir != "backward");
    }

    this.dirs = filtered;
    if (this.dirs.length == 0) {
      this.action = "idle";
    }
  }

  updateSocket() {
    if (this.socket !== undefined){
			//console.log(`PlayerLocal.updateSocket - rotation(${this.object.rotation.x.toFixed(1)},${this.object.rotation.y.toFixed(1)},${this.object.rotation.z.toFixed(1)})`);
			this.socket.emit('update', {
				x: this.object.position.x,
				y: this.object.position.y,
				z: this.object.position.z,
				h: this.object.rotation.y,
				pb: this.object.rotation.x,
				action: this.action
			})
		}
  }
}