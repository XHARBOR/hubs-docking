import io from "socket.io-client";
import * as sockFuncs from "./socket-functions.js";
import { storeAvatar, checkSocketCueType, getSendNetworkedId } from "./socket-function-helpers.js";
import { proxiedUrlFor } from "../utils/media-url-utils.js";
const knownPerformers = [
  "housemanager",
  "clem",
  "demz",
  "rbca",
  "naom",
  "kryn",
  "dave",
  "brnd",
  "belo",
  "vivi",
  "nemo-qs",
  "brnd2",
  "ari",
  "romamile",
  "charA",
  "charB",
  "charC",
  "music",
  "pier2pier",
  "kristia",
  "ari",
  "naomi",
  "ming",
  "nell",
  "mand",
  "avin",
  "itlSM",
  "itlPerf1",
  "itlPerf2",
  "llen"
];

class sockSysClass {
  constructor() {
    this.myUser = {};
    this.myUser.role = null;
    this.myUser.socketMap = {};
    this.serverDomain = "onboard-server.herokuapp.com";
  }

  //INITIALIZE SOCKETS
  initSockets(_username) {
    //set matrix auto update for avatars
    document.getElementById("avatar-rig").object3D.matrixAutoUpdate = true;

    //grab user role
    fetch(proxiedUrlFor("https://jigsawhubs.github.io/Jigsaw_data/user_db.json"))
      .then(function(response) {
        return response.json();
      })
      .then(data => {
        if (typeof data[_username] !== "undefined") {
          if (knownPerformers.includes(data[_username].role)) {
            this.myUser.role = "performer";
          } else {
            this.myUser.role = data[_username].role;
          }
          const roleClient = io("https://" + this.serverDomain + "/" + this.myUser.role, { transports: ["websocket"] });
          this.myUser.socketMap.role = roleClient;
          roleClient.on("connect", () => {
            console.log("connected to socket server / " + this.myUser.role);
          });
          //handle role specific cues
          roleClient.on("getCue", _cue => {
            console.log("role-specific cue from server: " + _cue);
            //Pass to playAction() method
            this.playAction(_cue);
          });
        } else {
          console.log(_username + " is unkown in the database of users");
        }
      })
      .catch(function(err) {
        console.log(err);
      });

    //setup general and role-specific sockets and add to map
    const generalClient = io("https://" + this.serverDomain + "/general", { transports: ["websocket"] });
    this.myUser.socketMap.general = generalClient;

    //log connections
    generalClient.on("connect", () => {
      console.log("connected to socket server");
      //failsafe for server reconnecting while participant is in room. Attempts to reestablish existing avatars on server side
      if (AFRAME.scenes[0].is("entered")) {
        console.log("connection after entering");
        getSendNetworkedId();
      }
    });

    //handle general cues
    generalClient.on("getCue", _cue => {
      console.log("general cue from server: " + _cue);
      //Pass to playAction() method
      this.playAction(_cue);
    });
  }

  //SEND SCENE ENTERED TO SERVER
  sendNetworkedAv(networkedId) {
    this.myUser.socketMap.general.emit("avatarId", networkedId, stgSys.myUser.name);
  }

  connectGhost() {
    const ghostClient = io("https://" + this.serverDomain + "/ghost", { transports: ["websocket"] });
    this.myUser.socketMap.role = ghostClient;
    ghostClient.on("connect", () => {
      console.log("connected to socket server / ghost");
    });
    //handle role specific cues
    ghostClient.on("getCue", _cue => {
      console.log("role-specific cue from server: " + _cue);
      //Pass to playAction() method
      this.playAction(_cue);
    });
  }

  //SEND CUES TO SERVER
  cueSocket(_cue) {
    checkSocketCueType(_cue);

    if (typeof _cue.target.role === "string") {
      this.myUser.socketMap.general.emit("sendCue", _cue.target.role, _cue);
    } else {
      for (let i = 0; i < _cue.target.role.length; i++) {
        this.myUser.socketMap.general.emit("sendCue", _cue.target.role[i], _cue);
      }
    }
  }

  //INTERPRET AND TRIGGER CUES
  async playAction(_cue) {
    console.log("PLAYING TRIG: " + _cue.name);
    _cue.played = true;

    //Check if receiver is in the scene
    if (AFRAME.scenes[0].is("entered")) {
      //Return if sceneLink exists and is not the sceneURL
      if (_cue.sceneLink !== undefined && _cue.sceneLink !== window.APP.hub.scene.url) {
        console.log("incoming cue is not scoped to sceneLink");
        return;
      }

      switch (_cue.action.type) {
        case "ui_popin":
          stgSys.addUIpop(_cue);
          break;

        case "spawn_item":
          stgSys.spawnItem(_cue);
          break;

        case "spawn_prop":
          stgSys.spawnProp(_cue);
          break;

        case "move":
          stgSys.moveItem(_cue);
          break;

        case "delete":
          stgSys.delItem(_cue.action.src);
          _cue.ended = true;
          break;

        case "change_scene":
          stgSys.changeSceneTo(_cue.action.link);
          break;

        case "jump_to_waypoint":
          stgSys.jumpToWaypoint(_cue.action.anchor);
          break;

        case "change_avatar":
          if (!loginOb.ghost) {
            storeAvatar();
            stgSys.changeAvatar(_cue.action.link);
          }
          break;

        case "call_global_function":
          stgSys.callGlobalFunction(_cue.action.function_name, _cue);
          break;

        case "track_object":
          sockFuncs.trackObject(_cue);
          break;

        case "load_360_video":
          sockFuncs.load360Video(_cue);
          break;

        case "load_360_image":
          sockFuncs.load360Image(_cue);
          break;

        case "play_360_cutscene":
          sockFuncs.play360Cutscene(_cue);
          break;

        case "socket_toggle_flight":
          sockFuncs.socketToggleFlight(_cue.action.flight);
          break;

        case "recall_audience":
          sockFuncs.recallAudience(_cue.action.waypoint, _cue.action.maxDist, _cue.action.enableMotion);
          break;

        case "manipulate_avatar":
          sockFuncs.manipulateAvatar(_cue);
          break;

        case "socket_toggle_movement":
          sockFuncs.toggleAvatarMotion(_cue.action.movement);
          break;

        case "change_rolloff":
          sockFuncs.changeRolloff(_cue);
          break;

        case "avatar_change_back":
          if (!loginOb.ghost) {
            sockFuncs.avatarChangeBack();
          }
          break;

        case "manipulate_skybox_360":
          sockFuncs.manipulateSkybox360(_cue);
          break;

        case "hop_to_spawn_point":
          sockFuncs.hopToSpawnPoint();
          break;

        case "manipulate_360_image":
          sockFuncs.manipulate360Image(_cue);
          break;

        case "spawn_particle_emitter":
          sockFuncs.spawnParticleEmitter(_cue);
          break;

        case "manipulate_particle_emitter":
          sockFuncs.manipulateParticleEmitter(_cue);
          break;

        case "spawn_fog":
          sockFuncs.spawnFog(_cue);
          break;

        case "manipulate_fog":
          sockFuncs.manipulateFog(_cue);
          break;

        case "delete_socket_obj":
          sockFuncs.deleteSocketObj(_cue);
          break;

        case "pause_object_anim_on_spawn":
          sockFuncs.cueObjectAnimation(_cue);
          break;

        case "cue_object_animation":
          sockFuncs.cueObjectAnimation(_cue);
          break;

        case "spawn_360_gif":
          sockFuncs.spawn360Gif(_cue);
          break;

        case "play_360_gif":
          sockFuncs.play360Gif(_cue);
          break;

        case "socket_spawn_object":
          sockFuncs.socketSpawnObject(_cue);
          break;

        case "socket_manipulate_object":
          sockFuncs.socketManipulateObject(_cue);
          break;

        case "socket_fade_skybox_opacity":
          sockFuncs.socketFadeSkyboxOpacity(_cue);
          break;

        case "change_animation":
          sockFuncs.changeAnimation(_cue);
          break;

        case "lock_waypoint":
          sockFuncs.lockWaypoint(_cue);
          break;
      }
    } else {
      console.error("cannot play cue while in lobby");
    }
  }
}

export default sockSysClass;
