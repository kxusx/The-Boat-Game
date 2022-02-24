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
let BSIZE = 500
let bounds = [BSIZE, -BSIZE, BSIZE, -BSIZE]

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
      this.boat = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      }
      this.view = "top"
    })
    this.bullet = {
      geom: new THREE.CylinderGeometry(1, 0.1, 2, 32),
      mat: new THREE.MeshBasicMaterial({ color: 0xDC143C }),
      cooldown: 50,
      lastShot: 0
    };
    this.lasers = new Array();
    this.vels = new Array();
    this.times = new Array();
    this.health = 1000;
    this.score = 0;
    this.treasure=0;
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


      let toDel = new Array();
      for (let i = 0; i < this.lasers.length; i++) {
        this.lasers[i].position.set(this.lasers[i].position.x + this.vels[i][0] * 4, this.lasers[i].position.y + this.vels[i][1] * 2, this.lasers[i].position.z + this.vels[i][2] * 4);
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

      if (this.boat.position.x >= bounds[2] ||
        this.boat.position.x <= bounds[3] ||
        this.boat.position.z >= bounds[0] ||
        this.boat.position.z <= bounds[1]) {
        bounds[0] = this.boat.position.z + BSIZE
        bounds[1] = this.boat.position.z - BSIZE
        bounds[2] = this.boat.position.x + BSIZE
        bounds[3] = this.boat.position.x - BSIZE
        console.log(boat.boat.position)
        generateEnemies()
        generateCoin()
      }

      if (enemys.length == 0) {
        generateEnemies()
      }
    }
  }

  shoot() {

    if (new Date().getTime() - this.bullet.lastShot < this.bullet.cooldown)
      return;
    this.bullet.lastShot = new Date().getTime();
    var shot = new THREE.Mesh(this.bullet.geom, this.bullet.mat);
    shot.position.set(this.boat.position.x, this.boat.position.y + 4, this.boat.position.z + 5);

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
class Coin {
  constructor(_scene) {
    scene.add(_scene)
    _scene.scale.set(10, 10, 10)
    // _scene.position.set(0,1,0);
    // if(Math.random() > .6){
    let x = random(bounds[3], bounds[2])
    let y = 1
    let z = random(bounds[1], bounds[0])
    _scene.position.set(x, 1, z);
    // _scene.position.set(random(-500, 500), 1, random(-500, 500))
    // }else{
    //   _scene.position.set(random(-500, 500), -.5, random(-1000, 1000))
    // }

    this.coin = _scene
  }
}

let coinModel = null
let coins = []
const COIN_COUNT = 100

function generateCoin(){
  for(let i = 0; i < COIN_COUNT; i++){
    let coin = new Coin(coinModel.clone())
    coins.push(coin)
  }
}


async function createCoin() {
  if (!coinModel) {
    coinModel = await loadModel("models/coin/scene.gltf")
  }
  return new Coin(coinModel.clone())
}

// ----------------------------------------------------------------------------------

class Enemy {
  constructor(_scene) {

    scene.add(_scene);
    _scene.scale.set(0.75, 0.75, 0.75); // scale here
    let x = random(bounds[3], bounds[2])
    let y = 1
    let z = random(bounds[1], bounds[0])
    _scene.position.set(x, 1, z);
    // _scene.position.set(random(-300, 300), 1, random(-300, 300));
    // gltf.scene.rotation.y = 1.5;

    this.enemy = _scene;

    this.speed = {
      vel: 0.001,
      rot: 10,
    };

    this.bullet = {
      geom: new THREE.CylinderGeometry(1, 0.1, 2, 32),
      mat: new THREE.MeshBasicMaterial({ color: 0xFFC0CB }),
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


      diff.multiplyScalar(this.speed.vel);
      // this.front.copy(diff);
      // this.front.normalize();
      this.enemy.position.add(diff);
      // this.enemy.rotation.y = (angle);
      this.enemy.lookAt(boat.boat.position)

      let toDel = new Array();
      for (let i = 0; i < this.lasers.length; i++) {
        // this.lasers[i].position.set(this.lasers[i].position.x+this.vels[i][0], this.lasers[i].position.y+this.vels[i][1], this.lasers[i].position.z+this.vels[i][2]);
        this.lasers[i].position.set(this.lasers[i].position.x + this.xs[i] * 0.01, this.lasers[i].position.y + 0, this.lasers[i].position.z + this.zs[i] * 0.01);
        if (new Date().getTime() - this.times[i] > 5000) {
          scene.remove(this.lasers[i]);
          toDel.push(i);
        }
      }
      for (var i = 0; i < toDel.length; i++) {
        this.lasers.splice(toDel[i], 1);
        this.vels.splice(toDel[i], 1);
        this.times.splice(toDel[i], 1);
        this.xs.splice(toDel[i], 1);
        this.zs.splice(toDel[i], 1);
      }


    }
  }
  shoot() {
    if (this.enemy) {
      if (new Date().getTime() - this.bullet.lastShot < this.bullet.cooldown)
        return;
      this.bullet.lastShot = new Date().getTime();
      var shot = new THREE.Mesh(this.bullet.geom, this.bullet.mat);
      shot.position.set(this.enemy.position.x, this.enemy.position.y + 4, this.enemy.position.z + 5);
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
let enemys = []
const ENEMY_COUNT = 4

function generateEnemies() {
  if(enemyModel){
  for (let i = 0; i < ENEMY_COUNT; i++) {
    const enemy = new Enemy(enemyModel.clone())
    console.log(enemy)
    enemys.push(enemy)
  }}
}
let initialTime =0
async function createEnemy() {
  if (!enemyModel) {
    enemyModel = await loadModel("models/enemy/scene.gltf")
    initialTime= new Date().getTime()
  }
  return new Enemy(enemyModel.clone())
}


init();
animate();

async function init() {
//  
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

  for (let i = 0; i < COIN_COUNT; i++) {
    const coin = await createCoin()
    coins.push(coin)
  }

  //  generateEnemies()
  for (let i = 0; i < ENEMY_COUNT; i++) {
    const enemy = await createEnemy()
    console.log(enemy)
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
    if (e.key == "ArrowUp") {
      boat.view = "top";
    }
    // set the bird eye view for boat
    if (e.key == "ArrowDown") {
      boat.view = "third";
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

function isCoinColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 15 &&
    Math.abs(obj1.position.z - obj2.position.z) < 10
  )
}

function checkCoinCollisions() {
  if (boat.boat) {
    coins.forEach(coin => {
      if (coin.coin) {

        if (isCoinColliding(boat.boat, coin.coin)) {
          scene.remove(coin.coin)
          coins.splice(coins.indexOf(coin), 1)
          boat.score+=1
          boat.treasure+=1
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

function isPlayerBulletColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 10 &&
    Math.abs(obj1.position.z - obj2.position.z) < 10
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
          boat.health -= 100
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

          if (isPlayerBulletColliding(laser, boat.boat)) {
            boat.health -= 1
            scene.remove(laser)
          }
        })
      }
    })
  }
}

function isEnemyBulletColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 10 &&
    Math.abs(obj1.position.z - obj2.position.z) < 10
  )
}

function checkEnemyBulletCollisions() {
  if (boat.boat) {
    boat.lasers.forEach(laser => {
      enemys.forEach(enemy => {
        if (enemy.enemy) {
          if (isEnemyBulletColliding(laser, enemy.enemy)) {
            scene.remove(laser)
            scene.remove(enemy.enemy)
            enemys[enemys.indexOf(enemy)].removeEnemyBullets()
            enemys.splice(enemys.indexOf(enemy), 1)
            boat.score += 1000
          }
        }
      })
    })
  }
}
function changeCameraAngle() {
  if (boat.boat) {
    if (boat.view == "third") {
      camera.position.set(
        boat.boat.position.x - 50,
        boat.boat.position.y + 20,
        boat.boat.position.z
      );
    } else if (boat.view == "top") {
      camera.position.set(
        boat.boat.position.x,
        boat.boat.position.y + 400,
        boat.boat.position.z);
    }
    camera.lookAt(boat.boat.position);
  }
}

function HUD(){
  document.getElementById("score").innerHTML = Math.round(boat.score);
  document.getElementById("treasure").innerHTML= Math.round(boat.treasure);
  document.getElementById("health").innerHTML= Math.round(boat.health);
  let currTime = new Date().getTime()
  document.getElementById("timeDone").innerHTML= Math.round((currTime-initialTime)/1000)
  if(boat.health <= 0){
    alert("Game Over")
    // window.location.reload()
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
  checkCoinCollisions();
  checkEnemyCollisions();
  checkPlayerBulletCollisions();
  changeCameraAngle();
  checkEnemyBulletCollisions();
  HUD();
}

function render() {

  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);

}