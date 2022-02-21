import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3 } from "three";

let renderer;
let controls, water, sun, mesh;

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  20000
);
camera.position.set(30, 30, 100);

const scene = new THREE.Scene();
function collisonDetection(object1, object2) {
  return (
    Math.abs(object1.position.x - object2.position.x) <= 10 &&
    Math.abs(object1.position.z - object2.position.z) <= 5
  );
}

const loader = new GLTFLoader();

class Boat {
  constructor() {
    loader.load("assets/models/playerShip/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(4, 4, 4); // scale here
      gltf.scene.position.set(0, 4, 0);
      gltf.scene.rotation.y = 1.5;
      // console.log(gltf.size)
      this.boat = gltf.scene;
      this.speed = {
        vel: 0,
        rot: 0,
      };
    });
  }

  stop() {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rot;
      this.boat.translateZ(this.speed.vel);
      // console.log(this.boat.position);
    }
  }
}

class Enemy {
  constructor(front) {
    loader.load("assets/models/enemy/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      this.front = new THREE.Vector3(front.x, front.y, front.z);
      gltf.scene.scale.set(0.003, 0.003, 0.003); // scale here
      gltf.scene.position.set(300, 4, 300);
      // gltf.scene.rotation.y = 1.5;
      // console.log(gltf.size)
      this.enemy = gltf.scene;
      console.log(this.enemy.position);
      this.speed = {
        vel: 0.001,
        rot: 10,
      };
    });
  }

  stop() {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update() {
    if (this.enemy && boat.boat) {
      let boatPos = new THREE.Vector3(
        boat.boat.position.x,
        boat.boat.position.y,
        boat.boat.position.z
      );

      let enemyPos = new THREE.Vector3(
        this.enemy.position.x,
        this.enemy.position.y,
        this.enemy.position.z
      );

      // console.log(enemyPos)
      let diff = boatPos.sub(enemyPos);

      // console.log(diff)
      diff.multiplyScalar(this.speed.vel);
      this.front.copy(diff);
      this.front.normalize();
      this.enemy.position.add(diff);
      // this.enemy.rotation.y = (angle);
      const enem = this.enemy.localToWorld(new THREE.Vector3(0.0, 0.0, 1.0));
      enem.normalize();
      // console.log(enem)
      diff.normalize();
      const cosine = diff.dot(enem);
      const arccosine = Math.acos(cosine);
      this.enemy.rotation.y = arccosine;

      // console.log(enem)
    }
  }
}

class Fuel {
  constructor() {
    loader.load("assets/models/fuel-coin/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(12, 12, 10); // scale here
      gltf.scene.position.set(15, 0, 5);
      // gltf.scene.rotation.y = 1.5;

      this.fuel = gltf.scene;
    });
  }
}

const fuel = new Fuel();
const boat = new Boat();

const enemy = new Enemy(new THREE.Vector3(0, 4, 0));
// scene.add(enemy.enemy);

async function checkCollision() {
  if (collisonDetection(boat.boat, fuel.fuel)) {
    console.log("collision");
  }
}

class Chest {
  constructor(position = new THREE.Vector3(30, 2, 0)) {
    this.chest = new THREE.Group();
    this.color = 0xffffff;
    this.main = new THREE.Mesh(
      new THREE.BoxBufferGeometry(5, 5, 5),
      new THREE.MeshLambertMaterial({ color: this.color })
    );
    this.main.position.set(position.x, position.y, position.z);
    this.chest.add(this.main);
    scene.add(this.chest);
  }
}

class Bullet {
  constructor(position) {
    this.velociyt = -1.5;
    this.distance = 
    
  }
}
const chest = new Chest();

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  sun = new THREE.Vector3();
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "assets/images/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  let ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;
  const parameters = {
    elevation: 2,
    azimuth: 180,
  };
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(89 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky).texture;
  }
  updateSun();
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  const waterUniforms = water.material.uniforms;
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", function (e) {
    if (e.key == "w") {
      boat.speed.vel = 1;
    }
    if (e.key == "s") {
      boat.speed.vel = -1;
    }
    if (e.key == "d") {
      boat.speed.rot = -0.1;
    }
    if (e.key == "a") {
      boat.speed.rot = 0.1;
    }
  });
  window.addEventListener("keyup", function (e) {
    boat.stop();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  boat.update();
  enemy.update();
}

function render() {
  // water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}