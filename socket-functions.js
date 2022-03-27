import { getAvatarV, getWaypoint } from "./socket-function-helpers.js";
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

//Functions
export function recallAudience(waypointName, maxDist, enableMotion) {
  //get waypoint
  var waypoint = getWaypoint(waypointName);

  //disable motion
  var characterController = toggleAvatarMotion(enableMotion);

  //Get av position
  var avatarV = getAvatarV();

  //Calculate target vector where dist from avatarV to target is within max distance along line to waypoint
  //get waypointV
  var waypointV = new THREE.Vector3(
    waypoint.el.object3D.position.x,
    waypoint.el.object3D.position.y,
    waypoint.el.object3D.position.z
  );
  //get relativeV
  var relativeV = avatarV.sub(waypointV);
  //normalize unit V
  var unitV = relativeV.normalize();
  //new vector
  var newV = waypointV.add(unitV.multiplyScalar(maxDist));

  //animate avatar position towards waypoint until maxDist
  var cue = {
    action: {
      attr: "object3D",
      anime: {
        targets: "position",
        delay: 0,
        loop: false,
        autoplay: false,
        easing: "easeInOutSine",
        duration: 1000
      },
      timelines: [{ x: newV.x, y: newV.y, z: newV.z }]
    }
  };
  let attrName = "ob-anim__" + waypointName;
  characterController.avatarRig.setAttribute(attrName, cue);
  return newV;
}

export function trackObject(_cue) {
  var avatarV = getAvatarV();
  var objectV = stgSys.mapItem[_cue.action.mapItem].object3D.position;

  //Calculate relativeV
  var relativeV = avatarV.sub(objectV);

  //Calculate coordinates along track
  for (let i = 0; i < _cue.action.timelines.length; i++) {
    var quaternionY = new THREE.Quaternion();
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), _cue.action.timelines[i].ry);
    var quaternionX = new THREE.Quaternion();
    quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), _cue.action.timelines[i].rx);
    var quaternionZ = new THREE.Quaternion();
    quaternionZ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), _cue.action.timelines[i].rz);
    var relative = new THREE.Vector3(relativeV.x, relativeV.y, relativeV.z);
    relative.applyQuaternion(quaternionX);
    relative.applyQuaternion(quaternionY);
    relative.applyQuaternion(quaternionZ);
    relative.multiplyScalar(_cue.action.timelines[i].s);
    var vector = new THREE.Vector3(_cue.action.timelines[i].x, _cue.action.timelines[i].y, _cue.action.timelines[i].z);
    vector.add(relative);

    //Revise _cue.action.timelines with updated coordinates
    vector.easing = _cue.action.timelines[i].easing;
    vector.duration = _cue.action.timelines[i].duration;
    vector.delay = _cue.action.timelines[i].delay;
    _cue.action.timelines[i] = vector;
  }
  console.log(_cue);
  //Initialize Movement
  manipulateAvatar(_cue);
}

export function load360Image(_cue) {
  //load 360 object far below the scene
  var el = document.createElement("a-entity");
  AFRAME.scenes[0].appendChild(el);
  el.setAttribute("media-loader", {
    src: _cue.action.src,
    mediaOptions: { projection: "360-equirectangular" },
    resolve: true
  });
  if (_cue.action.position) {
    el.setAttribute("position", {
      x: _cue.action.position.x,
      y: _cue.action.position.y,
      z: _cue.action.position.z
    });
  }
  if (_cue.action.rotation) {
    el.setAttribute("rotation", {
      x: _cue.action.rotation.x,
      y: _cue.action.rotation.y,
      z: _cue.action.rotation.z
    });
  }
  if (_cue.action.scale) {
    el.setAttribute("scale", {
      x: _cue.action.scale.x,
      y: _cue.action.scale.y,
      z: _cue.action.scale.z
    });
  }
  //map item
  stgSys.mapItem[_cue.name] = el;
}

export function spawn360Gif(_cue) {
  var el = document.createElement("a-entity");
  AFRAME.scenes[0].appendChild(el);
  el.setAttribute("media-loader", {
    src: _cue.action.src,
    mediaOptions: { projection: "360-equirectangular", alphaMode: "mask", alphaCutoff: 0.1 },
    resolve: true
  });
  el.setAttribute("position", {
    x: 0,
    y: -9999,
    z: 0
  });
  stgSys.mapItem[_cue.name] = el;
  el.object3D.matrixAutoUpdate = true;
}

export function play360Gif(_cue) {
  //get 360 object
  var el = stgSys.mapItem[_cue.action.mapItem];
  el.setAttribute("scale", { x: 1, y: 1, z: 1 });
  let trackingInterval = setInterval(() => {
    var avRig = document.querySelector("#avatar-rig");
    if (el.object3D.position !== avRig.object3D.position) {
      var avHeadY = document.querySelector("#avatar-pov-node").object3D.position.y;
      el.setAttribute("position", {
        x: avRig.object3D.position.x,
        y: avRig.object3D.position.y + avHeadY,
        z: avRig.object3D.position.z
      });
    }
    if (el.getAttribute("rotation") !== avRig.getAttribute("rotation")) {
      // console.log(el.getAttribute("rotation"), avRig.getAttribute("rotation"));
      // console.log(el.object3D.rotation, avRig.object3D.rotation);
      el.setAttribute("rotation", {
        x: avRig.getAttribute("rotation").x,
        y:
          avRig.getAttribute("rotation").y + document.querySelector("#avatar-pov-node").getAttribute("rotation").y - 90,
        z: avRig.getAttribute("rotation").z
      });
    }
  }, 5);
  el.object3D.children[0].matrixAutoUpdate = true;
  var elMat = el.object3D.children[0].material;
  setTimeout(() => {
    let fadeInterval = setInterval(() => {
      elMat.opacity -= 1 / (_cue.action.fadeDuration / 10);
      if (elMat.opacity <= 0) {
        clearInterval(fadeInterval);
        clearInterval(trackingInterval);
        console.log("clearing intervals");
        el.object3D.position.y = -9999;
        elMat.opacity = 1;
      }
    }, 10);
  }, _cue.action.fadeDelay);
}

export function manipulate360Image(_cue) {
  var myObj = stgSys.mapItem[_cue.action.mapItem].object3D;
  myObj.matrixAutoUpdate = true;

  _cue.action.anime.targets = _cue.target.aspect;
  var attrName = "ob-anim__" + _cue.name;
  stgSys.mapItem[_cue.action.mapItem].setAttribute(attrName, _cue);
}

export function load360Video(_cue) {
  //load 360 object far below the scene
  var el = document.createElement("a-entity");
  AFRAME.scenes[0].appendChild(el);
  el.setAttribute("media-loader", {
    src: _cue.action.src,
    mediaOptions: { projection: "360-equirectangular", videoPaused: true },
    resolve: true
  });
  el.setAttribute("position", {
    x: 0,
    y: -9999,
    z: 0
  });

  //map item
  stgSys.mapItem[_cue.name] = el;
}

export function play360Cutscene(_cue) {
  //Freeze avatar
  var characterController = AFRAME.scenes[0].systems["hubs-systems"].characterController;
  // characterController.isMotionDisabled = true;

  //get 360 object
  var el = stgSys.mapItem[_cue.action.mapItem];

  //get avatar head position
  var avHeadY = document.querySelector("#avatar-pov-node").object3D.position.y;

  //scale, snap and track 360 object to avatar head
  el.setAttribute("scale", { x: -0.6, y: 0.256, z: 0.6 });
  var avRig = document.querySelector("#avatar-rig");
  let trackingInterval = setInterval(() => {
    var avRig = document.querySelector("#avatar-rig");
    if (el.object3D.position !== avRig.object3D.position) {
      var avHeadY = document.querySelector("#avatar-pov-node").object3D.position.y;
      el.setAttribute("position", {
        x: avRig.object3D.position.x,
        y: avRig.object3D.position.y + avHeadY,
        z: avRig.object3D.position.z
      });
    }
  }, 10);

  //play
  el.setAttribute("video-pause-state", { paused: false });

  //calc timeout time
  var vidDuration = el.object3D.children[2].material.map.image.duration;
  var timeout = vidDuration * 1000 - _cue.action.fadeDuration;

  //set ending for 360 object fade out setting el.object3D.children[4].material.transpare
  var elMat = el.object3D.children[2].material;
  elMat.opacity = 1;
  elMat.transparent = true;
  setTimeout(() => {
    //HACK FOR OCULUS BROWSER
    //NEEDS UPDATE
    if (/OculusBrowser/i.test(window.navigator.userAgent)) {
      var interval = setInterval(() => {
        elMat.opacity -= 1 / (_cue.action.fadeDuration / 10);
        if (elMat.opacity === 0) {
          clearInterval(interval);
          clearInterval(trackingInterval);
        }
      }, 10);
    } else {
      var fadeAnim = AFRAME.ANIME.default.timeline({
        targets: elMat,
        opacity: 0,
        loop: false,
        autoplay: true,
        easing: "linear",
        duration: _cue.action.fadeDuration
      });
      fadeAnim.add({ opacity: 0 });
      setTimeout(() => {
        clearInterval(trackingInterval);
        characterController.isMotionDisabled = false;
      }, _cue.action.fadeDuration);
    }
  }, timeout);
}

//Toggle flight
export function socketToggleFlight(_flight) {
  console.log("flying enabled: ", _flight);
  // A little switch to preserve the settings of the room while still allowing control
  if (window.APP.hubChannel && !window.APP.hubChannel._permissions.fly) {
    window.APP.hubChannel._permissions.fly === true;
    AFRAME.scenes[0].systems["hubs-systems"].characterController.enableFly(_flight);
    window.APP.hubChannel._permissions.fly === false;
  } else {
    AFRAME.scenes[0].systems["hubs-systems"].characterController.enableFly(_flight);
  }
}

//Toggle movement of this user avatar
export function toggleAvatarMotion(movement) {
  console.log("movement disabled: ", movement);
  var characterController = AFRAME.scenes[0].systems["hubs-systems"].characterController;
  characterController.isMotionDisabled = movement;
  return characterController;
}

//Manipulate Avatar
export function manipulateAvatar(_cue) {
  //var characterController = toggleAvatarMotion(false);
  var characterController = AFRAME.scenes[0].systems["hubs-systems"].characterController;
  _cue.action.anime.targets = _cue.target.aspect;
  var attrName = "ob-anim__" + _cue.name;
  characterController.avatarRig.setAttribute(attrName, _cue);
}

//change audio rolloff of specific avatars
export function changeRolloff(_cue) {
  //get select netIds from cue
  var netIds = [];
  for (var j = 0; j < _cue.target.activeAvatars.length; j++) {
    if (_cue.action.names.includes(_cue.target.activeAvatars[j].name)) {
      //console.log(_cue.target.activeAvatars[j]);
      netIds.push(_cue.target.activeAvatars[j].networkedAvId);
    }
  }

  //get avatar heads
  var headNodes = document.querySelectorAll(".Head");
  var heads = Array.from(headNodes);
  // check if first head is self, this is to protect for people in ghost mode who do not have a head for self
  for (var i = 0; i < heads.length; i++) {
    if (heads[i].id === "avatar-head" || heads[i].object3D.parent.parent.parent.parent.parent.parent === null) {
      console.log("avatar head found, skipping...");
    } else {
      var netId = heads[i].object3D.parent.parent.parent.parent.parent.parent.parent.el.getAttribute("networked")
        .networkId;
      if (netIds.includes(netId)) {
        heads[i].object3D.children[1].panner.rolloffFactor = _cue.action.rolloff;
        if (_cue.action.refDistance) {
          heads[i].object3D.children[1].panner.refDistance = _cue.action.refDistance;
        }
      }
    }
  }
}

//avatarChangeBack
export function avatarChangeBack() {
  const store = window.APP.store;
  store.update({ profile: { avatarId: window.localStorage.avatarPreference } }, null, "profile");
  AFRAME.scenes[0].emit("avatar_updated");
  window.localStorage.removeItem("avatarPreference");
}

//manipulate skybox
export function manipulateSkybox360(_cue) {
  let myObj = stgSys.mapItem[_cue.action.mapItem].object3D;
  myObj.matrixAutoUpdate = true;

  _cue.action.anime.targets = _cue.target.aspect;
  var attrName = "ob-anim__" + _cue.name;
  stgSys.mapItem[_cue.action.mapItem].setAttribute(attrName, _cue);
}

export function hopToSpawnPoint() {
  const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
  waypointSystem.moveToSpawnPoint();
}

export function spawnParticleEmitter(_cue) {
  let el = document.createElement("a-entity");
  AFRAME.scenes[0].appendChild(el);
  el.object3D.matrixAutoUpdate = true;
  el.setAttribute("scale", _cue.action.scale);
  el.setAttribute("position", _cue.action.position);
  el.setAttribute("rotation", _cue.action.rotation);
  el.setAttribute("particle-emitter", _cue.action.parameters);

  stgSys.mapItem[_cue.name] = el;
}

//NEEDS UPDATING
export function manipulateParticleEmitter(_cue) {
  let el = stgSys.mapItem[_cue.action.mapItem];
  let aspects = [
    "particleCount",
    "src",
    "ageRandomness",
    "lifetime",
    "lifetimeRandomness",
    "sizeCurve",
    "startSize",
    "endSize",
    "sizeRandomness",
    "colorCurve",
    "startColor",
    "startOpacity",
    "middleColor",
    "middleOpacity",
    "endColor",
    "endOpacity",
    "velocityCurve",
    "startVelocity",
    "endVelocity",
    "angularVelocity"
  ];

  if (aspects.includes(_cue.target.aspect)) {
    let index = aspects.indexOf(_cue.target.aspect);
    if (typeof _cue.action.parameters !== "string") {
      _cue.action.parameters.toString();
    }
    let aspectStr = "{" + aspects[index] + ":" + _cue.action.parameters + "}";
    el.setAttribute("particle-emitter", aspectStr);
  } else {
    _cue.action.anime.targets = _cue.target.aspect;
    var attrName = "ob-anim__" + _cue.name;
    el.setAttribute(attrName, _cue);
  }
}

export function spawnFog(_cue) {
  AFRAME.scenes[0].setAttribute("fog", _cue.action.parameters);
}

export function manipulateFog(_cue) {
  let sceneEl = AFRAME.scenes[0];
  _cue.action.anime.targets = _cue.target.aspect;
  var attrName = "ob-anim__" + _cue.name;
  sceneEl.setAttribute(attrName, _cue);
}

export function deleteSocketObj(_cue) {
  AFRAME.scenes[0].removeChild(stgSys.mapItem[_cue.action.mapItem]);
}

export function cueObjectAnimation(_cue) {
  if (_cue.action.networkedId === "nonNetworked") {
    let el = stgSys.mapItem[_cue.action.mapItem];
    if (_cue.action.pause) {
      el.components["animation-mixer"].pause();
    } else {
      el.components["animation-mixer"].play();
    }
    return;
  }
  let checkInterval = setInterval(() => {
    try {
      let objectArray = Array.from(document.querySelectorAll(".interactable"));
      let el = objectArray.find(x => x.id === _cue.action.networkedId);
      if (_cue.action.pause) {
        el.components["animation-mixer"].pause();
      } else {
        el.components["animation-mixer"].play();
      }
      clearInterval(checkInterval);
    } catch {
      console.log ('error finding animation');
    }
  }, 200);
  
}

export function socketSpawnObject(_cue) {
  // B] Classic 3D objects
  let el = document.createElement("a-entity");
  //el.setAttribute("networked", { template: "#interactable-media" });
  AFRAME.scenes[0].appendChild(el);
  stgSys.mapItem[_cue.name] = el;
  stgSys.mapItem[_cue.name].listAnim = [];

  el.setAttribute("media-loader", { src: _cue.target.src, resolve: true });

  if (_cue.action.applyGravityOnSpawn) {
    el.setAttribute("floaty-object", { modifyGravityOnRelease: false });
    el.setAttribute("body-helper", {
      type: "dynamic",
      gravity: { x: 0, y: -9.8, z: 0 },
      angularDamping: 0.01,
      linearDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
    });
  }

  if (_cue.action.pauseOnSpawn === true) {
    let checkInterval = setInterval(() => {
      if (el.components["animation-mixer"]) {
        el.components["animation-mixer"].pause();
        clearInterval(checkInterval);
      }
    }, 200);
  }

  el.object3D.position.set(_cue.action.pos.x, _cue.action.pos.y, _cue.action.pos.z);
  el.object3D.rotation.set(_cue.action.rot.x, _cue.action.rot.y, _cue.action.rot.z);
  el.object3D.scale.set(_cue.action.scale.x, _cue.action.scale.y, _cue.action.scale.z);

  // if cue action has "pin_it" property, then pin the item
  if (_cue.action.pin_it) {
    // pinning needs to be delayed slightly -- if you do it immediately the item doesn't get loaded on all clients

    // pin_it can be boolean, or an int; if it's an int use as timeout
    let pin_delay = 1000; // default timeout of one second -- some clients/larger objects might need longer to load
    if (typeof _cue.action.pin_it == "number") {
      console.log("Set pinning delay to " + _cue.action.pin_it);
      pin_delay = _cue.action.pin_it;
    }

    setTimeout(function() {
      el.setAttribute("pinnable", { pinned: true });
      console.log("Pinning " + _cue.name);
    }, pin_delay);
  }
}

export function socketManipulateObject(_cue) {
  let el = stgSys.mapItem[_cue.action.mapItem];
  stgSys.mapItem[_cue.action.mapItem].object3D.matrixAutoUpdate = true;
  _cue.action.anime.targets = _cue.target.aspect;
  var attrName = "ob-anim__" + _cue.name;
  el.setAttribute(attrName, _cue);
}

export function socketFadeSkyboxOpacity(_cue) {
  let elMat = stgSys.mapItem[_cue.action.mapItem].object3D.children[0].material;
  stgSys.mapItem[_cue.action.mapItem].object3D.children[0].matrixAutoUpdate = true;
  let fadeInt = setInterval(() => {
    elMat.opacity -= 1 / (_cue.action.fadeDuration / 10);
    if (elMat.opacity <= 0) {
      clearInterval(fadeInt);
      console.log("clearing intervals");
    }
  }, 10);
}

export function changeAnimation(_cue) {
  //Find the element in the space
  if (_cue.action.networkedId === "nonNetworked") {
    try {
      let el = stgSys.mapItem[_cue.action.mapItem];
      const { mixer, animations } = el.components["loop-animation"].mixerEl.components["animation-mixer"];
      el.components["loop-animation"].destroy();
      let clip = animations.find(x => x.name === _cue.action.animName);
      var action = mixer.clipAction(clip, el.object3D);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
      el.components["loop-animation"].currentActions.push(action);
      el.components["animation-mixer"].play();
    } catch {
      console.log("object does not exist on this client");
    }
    return;
  }

  let checkInterval = setInterval(() => {
    //currently a bandaid for timing
    try {
      let objectArray = Array.from(document.querySelectorAll(".interactable"));
      let el = objectArray.find(x => x.id === _cue.action.networkedId);

      const { mixer, animations } = el.components["loop-animation"].mixerEl.components["animation-mixer"];
      el.components["loop-animation"].destroy();
      let clip = animations.find(x => x.name === _cue.action.animName);
      var action = mixer.clipAction(clip, el.object3D);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
      el.components["loop-animation"].currentActions.push(action);
      el.components["animation-mixer"].play();
      clearInterval(checkInterval);
    } catch {
      console.log("error locating animation on object");
    }
  }, 200);
}

export function lockWaypoint(_cue) {
  // Get waypoint
  var waypoint = getWaypoint(_cue.action.waypoint);

  // Disable Motion
  var characterController = toggleAvatarMotion(false);

  // Calculate relative vector between avatar and waypoint object
  var waypointPosition = waypoint.el.object3D.position;
  var waypointV = new THREE.Vector3(waypointPosition.x, waypointPosition.y, waypointPosition.z);
  var avatarV = getAvatarV();

  // If too far, bring user within a certain distance to the waypoint
  var relDist = waypointV.distanceTo(avatarV);
  if (relDist > _cue.action.maxDist && _cue.action.recallAud) {
    console.log("recalling aud");
    var avatarV = recallAudience(_cue.action.waypoint, _cue.action.maxDist, false);
    // Setup Animate Avatar and play,
    setTimeout(() => {
      console.log("moving aud");
      _cue.action.anime.delay = 0;
      _cue.action.anime.targets = "position";
      var relativeV = waypointV.sub(avatarV);
      for (let j = 0; j < _cue.action.timelines.length; j++) {
        _cue.action.timelines[j].x += relativeV.x;
        _cue.action.timelines[j].y += relativeV.y;
        _cue.action.timelines[j].z += relativeV.z;
      }
      var attrName = "ob-anim__" + _cue.name;
      characterController.avatarRig.setAttribute(attrName, _cue);
      // var animAv = handleAnime(_cue);
      // animAv.play();
    }, _cue.action.anime.delay);
  } else {
    var relativeV = waypointV.sub(avatarV);
    for (let j = 0; j < _cue.action.timelines.length; j++) {
      _cue.action.timelines[j].x += relativeV.x;
      _cue.action.timelines[j].y += relativeV.y;
      _cue.action.timelines[j].z += relativeV.z;
    }
    _cue.action.anime.targets = "position";
    var attrName = "ob-anim__" + _cue.name;
    characterController.avatarRig.setAttribute(attrName, _cue);
    // var animAv = handleAnime(_cue);
    // animAv.play();
  }
}
