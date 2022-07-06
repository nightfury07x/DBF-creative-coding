import Floor from "./world/floor.js";

export default class Game {
  constructor() {
    this.cameras;
    this.camera;
    this.scene;
    this.renderer;

    this.assetsPath = "../assets/";

    this.container = document.createElement("div");
    // this.container.style.height = "10vh";
    // this.container.style.width = "10vw";
    document.body.appendChild(this.container);

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    const loader = new THREE.FBXLoader();
    this.rigidBodies = [];

    this.clock = new THREE.Clock();

    this.setAmmo();
    this.setRenderer();
    this.setCamera();
    this.setLights();
    // this.setOrbitControls();
    // this.loadEnvironment(loader);

    this.animate();
  }

  async setAmmo() {
    this.physics = await Ammo();

    this.tmpTrans = new Ammo.btTransform();

    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      solver,
      collisionConfiguration
    );
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));

    this.createBox(100, 300);
    this.createBox(100, 400);
    this.createBox(70, 200);
    this.setWorld();
    this.loadPlayer();
  }

  createBox(x, height) {
    let pos = { x: x, y: height, z: 0 };
    let radius = 50;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 100;

    const geometry = new THREE.BoxGeometry(50, 50, 50);

    const material = new THREE.MeshLambertMaterial({ color: "#81ecec" });
    const ball = new THREE.Mesh(geometry, material);

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    this.scene.add(ball);

    //Ammo js Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(50 * 0.5, 50 * 0.5, 50 * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(body);

    ball.userData.physicsBody = body;
    this.rigidBodies.push(ball);
  }

  setRenderer() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.gammaOutPut = true;
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      20000
    );
    this.camera.position.set(112, 100, 1100);
  }

  setLights() {
    this.scene.background = new THREE.Color(0x00a0f0);
    const ambient = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambient);

    // this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const light = new THREE.DirectionalLight(0xaaaaaa);
    light.position.set(30, 100, 40);
    light.target.position.set(0, 0, 0);

    light.castShadow = true;

    const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
    light.shadow.camera.right = light.shadow.camera.top = lightSize;

    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.sun = light;
    this.scene.add(light);
  }

  initLights() {}

  setWorld() {
    let pos = { x: 0, y: 0, z: 0 };
    let scale = { x: 2000, y: 0, z: 2000 };
    let quat = { x: 0, y: 0, z: 0, w: 10 };
    let mass = 0;

    const floor = new Floor();
    this.scene.add(floor);

    var mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(body);

    var grid = new THREE.GridHelper(2000, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.position.y = 0;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  setOrbitControls() {
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.target.set(0, 10, 0);
    this.controls.update();
  }

  loadEnvironment(loader) {
    const game = this;
    loader.load(`${this.assetsPath}fbx/trees/tree4.fbx`, function (object) {
      object.name = "Tree";

      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = null;
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });
      object.position.y = 165;
      // object.position.x = 200;
      game.scene.add(object);
    });
  }

  loadObjects() {
    let pos = { x: 200, y: 400, z: 0 };
    let scale = { x: 50, y: 2, z: 50 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    const geometry = new THREE.BoxGeometry(50, 50, 50);

    const material = new THREE.MeshLambertMaterial({ color: "#81ecec" });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(pos.x, pos.y, pos.z);
    this.scene.add(cube);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(body);

    cube.userData.physicsBody = body;
    this.rigidBodies.push(cube);
  }

  updatePhysics(deltaTime) {
    this.physicsWorld.stepSimulation(deltaTime, 100);

    // Update rigid bodies
    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i];
      let objAmmo = objThree.userData.physicsBody;
      let ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(this.tmpTrans);
        let p = this.tmpTrans.getOrigin();
        let q = this.tmpTrans.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }
  }

  /**
   * CAMERAS
   */
  set activeCamera(object) {
    this.cameras.active = object;
  }

  createCameras() {
    const offset = new THREE.Vector3(0, 80, 0);
    const front = new THREE.Object3D();
    front.position.set(112, 100, 600);
    front.parent = this.player.object;
    const back = new THREE.Object3D();
    back.position.set(0, 400, -1500);
    back.parent = this.player.object;
    const chat = new THREE.Object3D();
    chat.position.set(0, 200, -450);
    chat.parent = this.player.object;
    const wide = new THREE.Object3D();
    wide.position.set(178, 139, 1665);
    wide.parent = this.player.object;
    const overhead = new THREE.Object3D();
    overhead.position.set(0, 400, 0);
    overhead.parent = this.player.object;
    const collect = new THREE.Object3D();
    collect.position.set(40, 82, 94);
    collect.parent = this.player.object;
    this.cameras = { front, back, wide, overhead, collect, chat };
    this.activeCamera = this.cameras.back;
  }

  checkCamera() {
    if (
      this.cameras != undefined &&
      this.cameras.active != undefined &&
      this.player !== undefined &&
      this.player.object !== undefined
    ) {
      const newPosition = new THREE.Vector3();
      this.cameras.active.getWorldPosition(newPosition);
      this.camera.position.lerp(newPosition, 0.04);
    }
    const pos = this.player.object.position.clone();
    // console.log('active', this.camera.position);
    this.camera.lookAt(pos);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  async loadPlayer() {
    this.player = new Player(this);

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    await delay(1000);

    if (this.player.object) {
      const mass = 10;
      const pos = this.player.object.position.clone();
      const quat = { x: 0, y: 0, z: 0, w: 1 };

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(1 * 0.5, 1 * 0.5, 1 * 0.5)
      );
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);

      this.physicsWorld.addRigidBody(body);

      this.player.object.userData.physicsBody = body;
      this.rigidBodies.push(this.player.object);
    }
  }

  animate() {
    const game = this;

    const dt = this.clock.getDelta();
    if (this.player.mixer != undefined) {
      this.player.mixer.update(dt);
    }

    //update player movement;
    this.player.moveUpdate(dt);
    // camera setting
    this.checkCamera();
    // light
    if (this.sun !== undefined) {
      this.sun.position.copy(this.camera.position);
      this.sun.position.y += 10;
    }

    requestAnimationFrame(function () {
      game.animate();
    });

    if (this.physicsWorld) game.updatePhysics(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
