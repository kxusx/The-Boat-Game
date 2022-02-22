import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3 } from "three";
let count = 0;

let renderer;
let enemyRadar = 1000.0;
let topZ = 1000,
  bottomZ = -1000,
  rightX = 1000,
  leftX = -1000;
let currCenter = new THREE.Vector3(0, 4, 0);
let controls, water, sun, mesh;
let enemyPosition = [];
let ChestPosition = [];

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  20000
);

camera.position.set(400, 4, 500);
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
      this.view = "c";
      camera.position.set(
        gltf.scene.position.x - 50,
        4,
        gltf.scene.position.z - 2
      );
      this.box = new THREE.Box3();
      camera.lookAt(gltf.scene.position);

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
  updateBoundaries() {
    rightX = this.boat.position.x + 1000;
    leftX = this.boat.position.x - 1000;
    topZ = this.boat.position.z + 1000;
    bottomZ = this.boat.position.z - 1000;
  }

  update() {
    if (this.boat) {
      // console.log(this.boat.position);
      this.boat.rotation.y += this.speed.rot;
      this.boat.translateZ(this.speed.vel);
      // console.log(this.boat.position);
      if (this.boat.position.x >= rightX) {
        this.updateBoundaries();
        generateChests();
        generateEnemies();
      } else if (this.boat.position.x <= leftX) {
        this.updateBoundaries();
        generateChests();
        generateEnemies();
      } else if (this.boat.position.z >= topZ) {
        this.updateBoundaries();
        generateChests();
        generateEnemies();
      } else if (this.boat.position.z <= bottomZ) {
        this.updateBoundaries();
        generateChests();
        generateEnemies();
      }
      this.box.setFromObject(this.boat);
    }
  }
}

class Enemy {
  constructor(front) {
    loader.load("assets/models/enemy/scene.gltf", (gltf) => {
      this.front = new THREE.Vector3(front.x, front.y, front.z);
      gltf.scene.scale.set(0.003, 0.003, 0.003); // scale here
      gltf.scene.position.set(front.x, front.y, front.z);
      // gltf.scene.rotation.y = 1.5;
      // console.log(gltf.size)
      this.enemy = gltf.scene;
      console.log(front);
      console.log(this.enemy.position);
      scene.add(gltf.scene);
      this.speed = {
        vel: 0.001,
        rot: 10,
      };
      this.box = new THREE.Box3().setFromObject(this.enemy);
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
      this.box.setFromObject(this.enemy);
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
// const enemy = new Enemy(new THREE.Vector3(0, 4, 0));
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
    this.box = new THREE.Box3().setFromObject(this.chest);
  }
}
const chest = new Chest();
function randomInRange(minimum, maximum) {
  return Number(
    Math.random() * (Number(maximum) - Number(minimum)) + Number(minimum)
  );
}
init();
animate();
function generateEnemies() {
  if (boat.boat) {
    let boatPos = boat.boat.position;
    console.log(boatPos);
    let margin = 1000;
    let numEnemies = 5;

    for (let i = 0; i < numEnemies; i++) {
      let x, y, z;
      x = randomInRange(leftX, rightX);
      while (Math.abs(x - boatPos.x) < 300) {
        x = randomInRange(leftX - 500, rightX + 500);
      }
      y = boatPos.y;
      z = randomInRange(bottomZ - 500, topZ + 500);
      while (Math.abs(z - boatPos.z) < 300) {
        z = randomInRange(bottomZ - 500, topZ + 500);
      }

      console.log({ x, y, z });
      let enem = new Enemy(new THREE.Vector3(x, y, z));
      enemyPosition.push(enem);
    }
  }
}
function generateChests() {
  if (boat.boat) {
    let boatPos = boat.boat.position;
    console.log(boatPos);
    let margin = 800;
    let numChest = 10;

    for (let i = 0; i < numChest; i++) {
      let x, y, z;

      x = randomInRange(leftX, rightX);
      while (Math.abs(x - boatPos.x) < 300) {
        x = randomInRange(leftX, rightX);
      }

      y = boatPos.y;
      z = randomInRange(bottomZ + 500, topZ + 500);
      while (Math.abs(z - boatPos.z) < 300) {
        z = randomInRange(bottomZ + 500, topZ + 500);
      }
      // console.log({ x, y, z });
      let xD = new Chest(new THREE.Vector3(x, y, z));
      ChestPosition.push(xD);
    }
  }
}

function moveCamera() {
  if (boat.boat) {
    let boatPos = boat.boat.position;
    if (boat.view == "c") {
      camera.position.set(
        boat.boat.position.x - 200,
        boat.boat.position.y,
        boat.boat.position.z
      );
    } else if (boat.view == "b") {
      camera.position.set(boatPos.x, boatPos.y + 300, boatPos.z);
      camera.lookAt(boatPos);
    }
    camera.lookAt(boat.boat.position);
  }
}

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
    if (e.key == "o") {
      boat.view = "o";
      camera.position.set(300, 4, 500);
    }
    // set the bird eye view for boat
    if (e.key == "b") {
      boat.view = "b";
      camera.position.set(
        boat.boat.position.x,
        boat.boat.position.y + 300,
        boat.boat.position.z
      );
      camera.lookAt(boat.boat.position);
    }
    // The Second Camera for the boat
    if (e.key == "c") {
      boat.view = "c";
      camera.position.set(
        boat.boat.position.x -40,
        boat.boat.position.y,
        boat.boat.position.z
      );
      camera.lookAt(boat.boat.position);
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
  if (count === 100) {
    generateChests();
    generateEnemies();
  }
  enemyPosition.forEach((enemy) => {
    enemy.update();
  });
  count = count + 1;
  checkChestCollision();
  checkEnemyCollision();
  moveCamera();
}

function render() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}

generateEnemies();

function boolCollision(obj1, obj2) {
  // compute the bounding boxes for the two objects
  obj1.geometry.computeBoundingBox();
  obj2.geometry.computeBoundingBox();
  obj1.updateWorldMatrix();
  obj2.updateWorldMatrix();
  // get the bounding box of the first object
  var obj1Box = obj1.geometry.boundingBox.clone();
  obj1Box.applyMatrix4(obj1.matrixWorld);
  var obj2Box = obj2.geometry.boundingBox.clone();
  obj2Box.applyMatrix4(obj2.matrixWorld);
  // check for a collision
  // true if collision happens
  // else false
  return obj1Box.intersectsBox(obj2Box);
}

function checkChestCollision() {
  for (let i = 0; i < ChestPosition.length; i++) {
    console.log(boat.box.intersectsBox(ChestPosition[i].box));
    if (
      boat.boat &&
      ChestPosition[i].chest &&
      boat.box.intersectsBox(ChestPosition[i].box)
    ) {
      scene.remove(ChestPosition[i].chest);
    }
  }
}

function checkEnemyCollision() {
  for (let i = 0; i < enemyPosition.length; i++) {
    if (
      boat.boat &&
      enemyPosition[i].enemy &&
      boat.box.intersectsBox(enemyPosition[i].box)
    ) {
      console.log("Enemy Collision");
      scene.remove(enemyPosition[i].enemy);
     }
  }
}