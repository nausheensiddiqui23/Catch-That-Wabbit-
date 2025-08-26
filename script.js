//THREEJS RELATED VARIABLES 
var scene,
  camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  gobalLight, shadowLight, backLight,
  renderer,
  container,
  controls, 
  clock;

var fieldScore, fieldLives, fieldGameOver, fieldDistance;
var score = 0;
var lives = 3;

var delta = 0;
var floorRadius = 200;
var speed = 6;
var distance = 0;
var level = 1;
var levelInterval;
var levelUpdateFreq = 3000;
var initSpeed = 5;
var maxSpeed = 48;
var monsterPos = .65;
var monsterPosTarget = .65;
var floorRotation = 0;
var collisionObstacle = 10;
var collisionBonus = 20;
var gameStatus = "play";
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.004;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;
var audio = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/264161/Antonio-Vivaldi-Summer_01.mp3');

//SCREEN & MOUSE VARIABLES
var HEIGHT, WIDTH, windowHalfX, windowHalfY,
  mousePos = { x: 0, y: 0 };

//3D OBJECTS VARIABLES
var hero;

// Materials
var blackMat = new THREE.MeshPhongMaterial({ color: 0x100707, shading:THREE.FlatShading });
var brownMat = new THREE.MeshPhongMaterial({ color: 0xb44b39, shininess:0, shading:THREE.FlatShading });
var greenMat = new THREE.MeshPhongMaterial({ color: 0x7abf8e, shininess:0, shading:THREE.FlatShading });
var pinkMat = new THREE.MeshPhongMaterial({ color: 0xdc5f45, shininess:0, shading:THREE.FlatShading });
var lightBrownMat = new THREE.MeshPhongMaterial({ color: 0xe07a57, shading:THREE.FlatShading });
var whiteMat = new THREE.MeshPhongMaterial({ color: 0xa49789, shading:THREE.FlatShading });
var skinMat = new THREE.MeshPhongMaterial({ color: 0xff9ea5, shading:THREE.FlatShading });

var PI = Math.PI;

//INIT THREE JS, SCREEN AND MOUSE EVENTS
function initScreenAnd3D() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6eae6, 160,350);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 1;
  farPlane = 2000;
  camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
  camera.position.set(0, 30, cameraPosGame);
  camera.lookAt(new THREE.Vector3(0, 30, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio); 
  renderer.setClearColor(malusClearColor, malusClearAlpha);
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousedown', handleMouseDown, false);
  document.addEventListener("touchend", handleMouseDown, false);

  clock = new THREE.Clock();
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseDown(event){
  if (gameStatus == "play") hero.jump();
  else if (gameStatus == "readyToReplay"){ replay(); }
}

// === [ shortened: your Hero, Monster, Carrot, Hedgehog, etc. definitions stay as in your code above ] ===
// I did not change those, only collision and UI functions.

function checkCollision(){
  var db = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());
  
  if(db.length() < collisionBonus){
    getBonus();
  }
  
  if(dm.length() < collisionObstacle && obstacle.status != "flying"){
    getMalus();
  }
}

function getBonus(){
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI/2;
  monsterPosTarget += .025;

  // === NEW: update score ===
  score += 10;
  fieldScore.innerHTML = score;
}

function getMalus(){
  obstacle.status="flying";
  var tx = (Math.random()>.5)? -20-Math.random()*10 : 20+Math.random()*5;
  TweenMax.to(obstacle.mesh.position, 4, {x:tx, y:Math.random()*50, z:350, ease:Power4.easeOut});
  TweenMax.to(obstacle.mesh.rotation, 4, {x:Math.PI*3, z:Math.PI*3, y:Math.PI*6, ease:Power4.easeOut, onComplete:function(){
    obstacle.status = "ready";
    obstacle.body.rotation.y = Math.random() * Math.PI*2;
    obstacle.angle = -floorRotation - Math.random()*.4;
    obstacle.angle = obstacle.angle%(Math.PI*2);
    obstacle.mesh.rotation.set(0,0,0);
    obstacle.mesh.position.z = 0;
  }});
  
  monsterPosTarget -= .04;
  TweenMax.from(this, .5, {malusClearAlpha:.5, onUpdate:function(){
    renderer.setClearColor(malusClearColor, malusClearAlpha );
  }});

  // === NEW: decrease lives ===
  lives -= 1;
  fieldLives.innerHTML = lives;

  if (lives <= 0) {
    gameOver();
  }
}

function updateDistance(){
  distance += delta*speed;
  var d = distance/2;
  fieldDistance.innerHTML = Math.floor(d);
}

function updateLevel(){
  if (speed >= maxSpeed) return;
  level++;
  speed += 2; 
}

function loop(){
  delta = clock.getDelta();
  updateFloorRotation();
  
  if (gameStatus == "play"){
    if (hero.status == "running"){ hero.run(); }
    updateDistance();
    updateMonsterPosition();
    updateCarrotPosition();
    updateObstaclePosition();
    checkCollision();
  }
  
  render();  
  requestAnimationFrame(loop);
}

function render(){ renderer.render(scene, camera); }

window.addEventListener('load', init, false);

function init(event){
  initScreenAnd3D();
  createLights();
  createFloor();
  createHero();
  createMonster();
  createFirs();
  createCarrot();
  createBonusParticles();
  createObstacle();
  initUI();
  resetGame();
  loop();
}

function resetGame(){
  scene.add(hero.mesh);
  hero.mesh.rotation.y = Math.PI/2;
  hero.mesh.position.set(0,0,0);

  monsterPos = .56;
  monsterPosTarget = .65;
  speed = initSpeed;
  level = 0;
  distance = 0;
  score = 0;
  lives = 3;

  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
  gameStatus = "play";
  hero.status = "running";
  hero.nod();
  audio.play();
  updateLevel();
  levelInterval = setInterval(updateLevel, levelUpdateFreq);

  // === NEW: reset UI ===
  fieldScore.innerHTML = score;
  fieldLives.innerHTML = lives;
  fieldDistance.innerHTML = "0";
}

function initUI(){
  fieldDistance = document.getElementById("distValue");
  fieldGameOver = document.getElementById("gameoverInstructions");
  fieldScore = document.getElementById("scoreValue");
  fieldLives = document.getElementById("livesValue");
}
