class Player {
    constructor (game, options) {
        this.game = game;
        this.local = true;
        // this.options = type;
        this.anims = [ 'run2', 'idle', 'jump'];
        this.animations = {}
        this.init(game, options);
        

    }

    init(game, options) {
        // event listeners
        window.addEventListener('keydown', this.move.bind(this));
        window.addEventListener('keyup', this.stopMove.bind(this));
        let model = 'characterMedium';
        let skin;
        if (options == undefined) {
            const skins = ['criminalMale', 'cyborgFemale', 'skaterFemale', 'skaterMale'];
            skin = skins[Math.floor(Math.random()*skins.length)];
        } else if (typeof options == 'object') {
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
        console.log('path ', `static/Model/${model}.fbx`);
        loader.load( `static/Model/${model}.fbx`, function ( object ) {
            console.log('loading');
            
			object.mixer = new THREE.AnimationMixer( object );
			player.root = object;
			player.mixer = object.mixer;
			
			object.name = "Person";
					
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					child.castShadow = true;
					child.receiveShadow = true;		
				}
			} );
			
			
			const textureLoader = new THREE.TextureLoader();
			const texturePath = `static/Skins/${skin}.png`;
            console.log('PATH ', texturePath);
			textureLoader.load(`static/Skins/${skin}.png`, function(texture){
                console.log('loading texture');
                object.traverse( function ( child ) {
					if ( child.isMesh ){
                        console.log('child', child);
                        console.log('texture', texture);
                        child.material = new THREE.MeshBasicMaterial({
                            map: texture,
                            skinning: true
                        })
					}
				} );
			});
			
			player.object = new THREE.Object3D();
			player.object.position.set(3122, 0, -173);
			player.object.rotation.set(0, 2.6, 0);
			
			player.object.add(object);
            player.loadAnim(loader);
            console.log('should have called');
			if (player.deleted===undefined) {
                console.log('adding player to scene');
                game.scene.add(player.object);
                player.object.position.copy(new THREE.Vector3(0, 0, 0));
                console.log('POSITION ',player.object.position);
            }
			
			if (player.local){
				game.createCameras();
				game.sun.target = game.player.object;
				game.animations.Idle = object.animations[0];
				if (player.initSocket!==undefined) player.initSocket();
			}else{
				const geometry = new THREE.BoxGeometry(100,300,100);
				const material = new THREE.MeshBasicMaterial({visible:false});
				const box = new THREE.Mesh(geometry, material);
				box.name = "Collider";
				box.position.set(0, 150, 0);
				player.object.add(box);
				player.collider = box;
				player.object.userData.id = player.id;
				player.object.userData.remotePlayer = true;
				const players = game.initialisingPlayers.splice(game.initialisingPlayers.indexOf(this), 1);
				game.remotePlayers.push(players[0]);
			}
			if (this.animations.idle!==undefined) player.action = "idle";
		} );

    }

    move (event) {
        this.action = 'run2';
        const dt = this.game.clock.getDelta();
        if (event.key == 'a' || event.key == 'A' || event.key == 'ArrowLeft'){
            console.log('move left');
            this.moveLeft(dt);
        };
        
        if (event.key == 'd' || event.key == 'D' || event.key == 'ArrowRight'){
            console.log('move right');
            this.moveRight(dt);
        };
        if (event.key == 'w' || event.key == 'W' || event.key == 'ArrowUp'){
            console.log('move forward');
            this.moveForward(dt);
        }
        if (event.key == 's' || event.key == 'S' || event.key == 'ArrowDown'){
            console.log('move backward');
            this.moveBackward(dt);
        };
    }

    moveLeft (dt) {
        const pos = this.object.position.clone();
        const speed = (this.action=='Running') ? 500 : 300;
        this.object.translateX(dt*speed);
    }
    moveRight (dt) {
        const pos = this.object.position.clone();
        const speed = (this.action=='Running') ? 800 : 300;
        this.object.translateX(dt*-speed);
    }

    moveForward (dt) {
        const pos = this.object.position.clone();
        const speed = (this.action=='Running') ? 800 : 300;
        this.object.translateZ(dt*speed);
    }
    moveBackward (dt) {
        const pos = this.object.position.clone();
        const speed = (this.action=='Running') ? 800 : 400;
        this.object.translateZ(dt*-speed);
    }

    loadAnim(loader){
        const scope = this;
        console.log('load anim called', loader);
        let anim = this.anims.pop();
        console.log('ANIMATION PATH', `static/Animations/${anim}.fbx`);
        loader.load(`static/Animations/${anim}.fbx`, function(object) {
            scope.animations[anim] = object.animations[0];
            if (scope.anims.length > 0 ){
                scope.loadAnim(loader);
            } else {
                delete scope.anims;
                scope.action = 'idle';
                console.log('action is set');
                scope.game.animate();
            }
        })
    }

    set action(name){
        console.log('THIS ', this.animations);
        console.log('THIS action name', this.actionName);
		//Make a copy of the clip if this is a remote player
		if (this.actionName == name) return;
		const clip = (this.local) ? this.animations[name] : THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(this.animations[name])); 
		console.log('CLIP ', clip);
        const action = this.mixer.clipAction( clip );
        action.time = 0;
		this.mixer.stopAllAction();
		this.actionName = name;
		this.actionTime = Date.now();
		
		action.fadeIn(0.5);	
		action.play();
        console.log('playing!!!', action);
	}
	
	get action(){
		return this.actionName;
	}

    stopMove(){
        this.action = 'idle';
    }
}
