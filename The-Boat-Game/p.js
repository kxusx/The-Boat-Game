import './style.css'

import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PlaneGeometry, ShortType, Vector3 } from 'three';

let container, stats; // dont need
let camera, scene, renderer;
let controls, water, sun, mesh;
const pi = 3.14159265;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

const loader = new GLTFLoader();

async function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene)
    })
  })
}

class Boat {
  constructor() {
    loader.load("models/player/scene.gltf", (gltf) => {
      scene.add(gltf.scene)
      gltf.scene.scale.set(0.005, 0.005, 0.005) // scale here
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.rotation.y = 1.75
      console.log("E");


      this.boat = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      }
    })
    this.bullet = {
      geom: new THREE.CylinderGeometry(1, 0.1, 2, 32),
      mat: new THREE.MeshBasicMaterial({ color: 0xDC143C }),
      cooldown: 500,
      lastShot: 0
    };
    this.lasers = new Array();
    this.vels = new Array();
    this.times = new Array();
  }

  stop() {
    this.speed.vel = 0
    this.speed.rot = 0
  }

  update() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rot
      this.boat.translateZ(this.speed.vel)
      let prev = new Vector3(0, -1, 0);
      prev.applyAxisAngle(new Vector3(0, 1, 0), this.boat.rotation.y);

      // this.position.x = this.boat.position.x
      // this.position.y = this.boat.position.y
      // this.position.z = this.boat.position.z
    }

    let toDel = new Array();
    for (let i = 0; i < this.lasers.length; i++) {
      this.lasers[i].position.set(this.lasers[i].position.x + this.vels[i][0], this.lasers[i].position.y + this.vels[i][1], this.lasers[i].position.z + this.vels[i][2]);
      if (new Date().getTime() - this.times[i] > 5000) {
        scene.remove(this.lasers[i]);
        toDel.push(i);
      }
    }
    for (var i = 0; i < toDel.length; i++) {
      this.lasers.splice(toDel[i], 1);
      this.vels.splice(toDel[i], 1);
      this.times.splice(toDel[i], 1);
    }
  }

  shoot() {
    // console.log("shoot")
    if (new Date().getTime() - this.bullet.lastShot < this.bullet.cooldown)
      return;
    this.bullet.lastShot = new Date().getTime();
    var shot = new THREE.Mesh(this.bullet.geom, this.bullet.mat);
    shot.position.set(this.boat.position.x, this.boat.position.y + 4, this.boat.position.z + 5);
    // console.log(this.boat.rotation.y)
    shot.rotation.x = -pi / 2
    shot.rotation.z = this.boat.rotation.y

    this.lasers.push(shot);
    this.vels.push([Math.sin(this.boat.rotation.y), 0, Math.cos(this.boat.rotation.y)])
    this.times.push(new Date().getTime())
    scene.add(shot);
  }
}
const boat = new Boat()

//----------------------------------------------------------------------------------
class Trash {
  constructor(_scene) {
    scene.add(_scene)
    _scene.scale.set(10, 10, 10)
    // _scene.position.set(0,1,0);
    // if(Math.random() > .6){
    _scene.position.set(random(-500, 500), 1, random(-500, 500))
    // }else{
    //   _scene.position.set(random(-500, 500), -.5, random(-1000, 1000))
    // }

    this.trash = _scene
  }
}

let boatModel = null
// demoss this by making a flag
async function createTrash() {
  if (!boatModel) {
    boatModel = await loadModel("models/coin/scene.gltf")
  }
  return new Trash(boatModel.clone())
}

let trashes = []
const TRASH_COUNT = 100
// ----------------------------------------------------------------------------------

class Enemy {
  constructor(_scene) {

    scene.add(_scene);
    _scene.scale.set(0.75, 0.75, 0.75); // scale here
    _scene.position.set(random(-500, 500), 1, random(-500, 500));
    // gltf.scene.rotation.y = 1.5;
    // console.log(gltf.size)
    this.enemy = _scene;

    this.speed = {
      vel: 0.001,
      rot: 10,
    };

    this.bullet = {
      geom: new THREE.CylinderGeometry(1, 0.1, 2, 32),
      mat: new THREE.MeshBasicMaterial({ color: 0x0000FF }),
      cooldown: 2500,
      lastShot: 0
    };
    this.lasers = new Array();
    this.vels = new Array();
    this.times = new Array();
    this.xs = new Array();
    this.zs = new Array();
  }

  stop() {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update() {
    if (this.enemy && boat.boat) {
      let diff = new THREE.Vector3(
        boat.boat.position.x - this.enemy.position.x,
        boat.boat.position.y - this.enemy.position.y,
        boat.boat.position.z - this.enemy.position.z
      );

      // console.log(diff)
      diff.multiplyScalar(this.speed.vel);
      // this.front.copy(diff);
      // this.front.normalize();
      this.enemy.position.add(diff);
      // this.enemy.rotation.y = (angle);
      const enem = this.enemy.localToWorld(new THREE.Vector3(0.0, 0.0, 1.0));
      enem.normalize();
      // console.log(enem)
      diff.normalize();
      const cosine = diff.dot(enem);
      const arccosine = Math.acos(cosine);
      this.enemy.rotation.y = arccosine;

      let toDel = new Array();
      for (let i = 0; i < this.lasers.length; i++) {
        // this.lasers[i].position.set(this.lasers[i].position.x+this.vels[i][0], this.lasers[i].position.y+this.vels[i][1], this.lasers[i].position.z+this.vels[i][2]);
        this.lasers[i].position.set(this.lasers[i].position.x + this.xs[i] * 0.01, this.lasers[i].position.y + 0, this.lasers[i].position.z + this.zs[i] * 0.01);
        if (new Date().getTime() - this.times[i] > 5000) {
          scene.remove(this.lasers[i]);
          toDel.push(i);
        }
      }
      console.log(toDel.length)
      for (var i = 0; i < toDel.length; i++) {
        this.lasers.splice(toDel[i], 1);
        this.vels.splice(toDel[i], 1);
        this.times.splice(toDel[i], 1);
        this.xs.splice(toDel[i], 1);
        this.zs.splice(toDel[i], 1);
      }

      // console.log(enem)
    }
  }
  shoot() {
    if (this.enemy) {
      if (new Date().getTime() - this.bullet.lastShot < this.bullet.cooldown)
        return;
      this.bullet.lastShot = new Date().getTime();
      var shot = new THREE.Mesh(this.bullet.geom, this.bullet.mat);
      shot.position.set(this.enemy.position.x, this.enemy.position.y + 4, this.enemy.position.z + 5);
      console.log("enemy shooted")
      shot.rotation.x = -pi / 2
      shot.rotation.z = this.enemy.rotation.y

      this.lasers.push(shot);
      this.vels.push([Math.sin(this.enemy.rotation.y), 0, Math.cos(this.enemy.rotation.y)])
      this.times.push(new Date().getTime())
      this.xs.push(boat.boat.position.x - this.enemy.position.x)
      this.zs.push(boat.boat.position.z - this.enemy.position.z)

      scene.add(shot);
    }
  }

  removeEnemyBullets() {
    for (var i = 0; i < this.lasers.length; i++) {
      scene.remove(this.lasers[i]);
    }
  }
}

let enemyModel = null
// demoss this by making a flag
async function createEnemy() {
  if (!enemyModel) {
    enemyModel = await loadModel("models/enemy/scene.gltf")
  }
  return new Enemy(enemyModel.clone())
}

let enemys = []
const ENEMY_COUNT = 2

init();
animate();

async function init() {

  // container = document.getElementById('container'); // dont need

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  //

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

  //

  sun = new THREE.Vector3();

  // Water

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add(water);

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

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

  for (let i = 0; i < TRASH_COUNT; i++) {
    const trash = await createTrash()
    trashes.push(trash)
  }

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const enemy = await createEnemy()
    enemys.push(enemy)
  }

  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', function (e) {
    if (e.key == "w") {
      boat.speed.vel = 1
    }
    if (e.key == "s") {
      boat.speed.vel = -1
    }
    if (e.key == "d") {
      boat.speed.rot = -0.05
    }
    if (e.key == "a") {
      boat.speed.rot = 0.05
    }
    if (e.key == " ") {
      boat.shoot()
    }
  })

  window.addEventListener('keyup', function (e) {
    boat.stop()
  })



}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function isTrashColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 15 &&
    Math.abs(obj1.position.z - obj2.position.z) < 10
  )
}

function checkTrashCollisions() {
  if (boat.boat) {
    trashes.forEach(trash => {
      if (trash.trash) {
        console.log("e")
        if (isTrashColliding(boat.boat, trash.trash)) {
          scene.remove(trash.trash)
        }
      }
    })
  }
}

function isEnemyColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 20 &&
    Math.abs(obj1.position.z - obj2.position.z) < 20
  )
}

function checkEnemyCollisions() {
  if (boat.boat) {
    enemys.forEach(enemy => {
      if (enemy.enemy) {
        if (isEnemyColliding(boat.boat, enemy.enemy)) {
          scene.remove(enemy.enemy)
          enemys[enemys.indexOf(enemy)].removeEnemyBullets()
          enemys.splice(enemys.indexOf(enemy), 1)
        }
      }
    })
  }
}

function checkPlayerBulletCollisions() {
  if (boat.boat) {
    enemys.forEach(enemy => {
      if (enemy.enemy) {
        enemy.lasers.forEach(laser => {
          if (laser.laser) {
            if (isTrashColliding(laser.laser, boat.boat)) {
              scene.remove(laser.laser)
              boat.removePlayerBullet()
              enemys[enemys.indexOf(enemy)].removeEnemyBullet()
              enemys.splice(enemys.indexOf(enemy), 1)
            }
          }
        })
      }
    })
  }
}


function animate() {

  requestAnimationFrame(animate);
  render();
  boat.update();
  for (let i = 0; i < enemys.length; i++) {
    enemys[i].update()
    enemys[i].shoot()
  }
  checkTrashCollisions();
  checkEnemyCollisions();




}

function render() {

  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);

}