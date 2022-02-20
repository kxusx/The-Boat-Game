class Boat {
    constructor(){
      loader.load("models/player/scene.gltf",(gltf)=>{
        scene.add( gltf.scene )
        gltf.scene.scale.set(0.005,0.005,0.005) // scale here
        gltf.scene.position.set(0,0,0);
        gltf.scene.rotation.y = 1.75
  
        this.boat = gltf.scene
        this.speed = {
          vel: 0,
          rot: 0
        }
      })
    }
  
    stop(){ 
      this.speed.vel = 0
      this.speed.rot = 0
    }
  
    update(){
      if(this.boat){
        this.boat.rotation.y += this.speed.rot
        this.boat.translateZ(this.speed.vel)
      }
    }
  }