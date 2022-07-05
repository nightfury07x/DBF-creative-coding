// import {Player} from 'player';
class Game {
  constructor() {
    this.cameras;
    this.camera;
    this.scene;
    this.renderer;
    this.assetsPath = '/assets'
    this.clock = new THREE.Clock();

    this.container = document.createElement("div");
    this.container.style.height = "100%";
    document.body.appendChild(this.container);

    this.init();
    this.loadModels();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.scene.background = new THREE.Color(0x00a0f0);

    const ambient = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambient);

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
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    this.player = new Player(this);
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
  }

  initLights() {}

  loadModels() {
    const material = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.cube = new THREE.Mesh(geometry, material);
    // this.scene.add(this.cube);
    this.camera.position.z = 3;
  }


  animate() {
    // console.log(this.scene);
    const dt = this.clock.getDelta();
    if (this.player.mixer != undefined) {
      this.player.mixer.update(dt);
    }
    const game = this;
    requestAnimationFrame(function () {
      game.animate();
    });
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
