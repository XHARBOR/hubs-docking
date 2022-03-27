import { getAvatarSrc } from "../utils/avatar-utils.js";

//SOCKET FUNCTION HELPERS
//Get position vector of this user avatar
export function getAvatarV() {
  var characterController = AFRAME.scenes[0].systems["hubs-systems"].characterController;
  var avPos = characterController.avatarRig.object3D.position;
  var avatarV = new THREE.Vector3(avPos.x, avPos.y, avPos.z);
  return avatarV;
}

//Get waypoint element by name in scene
export function getWaypoint(waypointName) {
  var waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
  var waypoint = waypointSystem.ready.find(c => c.el.className === waypointName);
  return waypoint;
}

//NEW COMPONENT FOR HANDLE ANIM
AFRAME.registerComponent("ob-anim", {
  schema: {
    action: { type: "string", default: "" }
  },
  multiple: true,
  init: function() {
    this.time = 0;
    this.handleAnime = function(_action, el, attrName) {
      console.log(_action, el);
      //console.log(el.object3D.scale, this.property);
      console.log("handling anime");
      this.animation = AFRAME.ANIME.default.timeline({
        targets: el[_action.attr][_action.anime.targets],
        delay: _action.anime.delay,
        autoplay: false,
        duration: _action.anime.duration,
        easing: _action.anime.easing,
        loop: _action.anime.loop,
        complete: function(anim) {
          console.log("animation completed", anim);
          el.removeAttribute(attrName);
        }
      });
      for (let i = 0; i < _action.timelines.length; i++) {
        this.animation.add(_action.timelines[i]);
      }
      this.animation.began = true;
      console.log(this.animation);
    };
  },
  update: function() {
    var data = this.data;
    var el = this.el;
    var attrName = this.attrName;
    //console.log(data);
    if (data.action) {
      // console.log(data.action);
      this.handleAnime(data.action, el, attrName);
    }
  },
  tick: function(t, dt) {
    this.time += dt;
    if (this.animation) {
      this.animation.tick(this.time);
    }
  }
});

export async function storeAvatar() {
  if (!window.localStorage.avatarPreference) {
    const avatarSrc = await getAvatarSrc(window.APP.store.state.profile.avatarId);
    window.localStorage.avatarPreference = avatarSrc;
  } else {
    console.log("avatar preference already stored");
  }
}

export function checkSocketCueType(_cue) {
  if (_cue.action.type === "change_animation") {
    if (stgSys.mapItem[_cue.action.mapItem].id) {
      _cue.action.networkedId = stgSys.mapItem[_cue.action.mapItem].id;
    } else {
      _cue.action.networkedId = "nonNetworked";
    }
  }
}

export function getSendNetworkedId() {
  if (sockSys.myUser.role !== null) {
    console.log("entering scene, socket system present");
    let av = document.querySelector("#avatar-rig");
    let networkedId = av.getAttribute("networked").networkId;
    sockSys.sendNetworkedAv(networkedId);
  } else {
    console.log("entering scene, no socket system present");
    setTimeout(() => {
      getSendNetworkedId();
    }, 2000);
  }
}
