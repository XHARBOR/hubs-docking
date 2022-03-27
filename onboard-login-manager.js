import sockSysClass from "./socket-system.js";
import { formatTimeWindow } from "./login-helpers.js";
import loginLinks from "../assets/onBoard/data/login_links.json";

class loginManagerOB {
  constructor() {
    this.URL = window.location.href;
    this.playGhostVideo = false;
    this.sceneFirstLoad = false;
    this.ghost = false;
    this.link = {};
    window.sockSys = new sockSysClass();
    this.init();
  }

  init() {
    let searchParams = window.location.search;
    searchParams = searchParams.substring(1);
    if (searchParams.includes("k=")) {
      this.loginBackstage(searchParams);
    } else {
      this.loginAudience(searchParams);
    }
  }

  loginBackstage(searchParams) {
    let endingIndex = searchParams.indexOf("&") > 0 ? searchParams.indexOf("&") : searchParams.length;
    let roleSubStr = searchParams.substring(searchParams.indexOf("=") + 1, endingIndex);
    sockSys.initSockets(roleSubStr);
    if (searchParams.includes("ghost")) {
      this.ghost = true;
      this.ghostLogin();
    } else {
      console.log("no ghost login");
    }
    if (searchParams.includes("part")) {
      this.destroyHUD();
    }
  }

  //Wait for the chat to exist and destroy it
  destroyChat() {
    let interval = setInterval(() => {
      if (document.getElementsByClassName("ContentMenu__content-menu-button__1QkGw")[1]) {
        document.getElementsByClassName("ContentMenu__content-menu-button__1QkGw")[1].style.display = "none";
        clearInterval(interval);
      }
    }, 75);
  }

  //Wait for VR player hud to exist and destroy it
  destroyHUD() {
    console.log("destroyHUD currently disabled");
    // let interval = setInterval(() => {
    //   if (document.querySelector("#player-hud") && AFRAME.scenes[0].is("entered")) {
    //     console.log("destroying HUD");
    //     document.querySelector("#player-hud").remove();
    //     clearInterval(interval);
    //   }
    // }, 75);
  }

  loginAudience(searchParams) {
    //check that search params are in data
    console.log(searchParams);
    if (loginLinks[searchParams] !== undefined && loginLinks[searchParams] !== null) {
      this.destroyChat();
      this.destroyHUD();
      console.log("found audience login parameters");
      //check date for search params with current time
      this.link = loginLinks[searchParams];
      let currentTime = new Date();
      currentTime = currentTime.toUTCString();
      let currentDate = currentTime.substring(5, 16);
      if (this.link.date === currentDate) {
        console.log("valid date");
        let timeObj = formatTimeWindow(currentTime, this.link);
        //check time window
        switch (true) {
          case timeObj.currentToD < timeObj.startingToD:
            this.invalidLogin("early");
            break;
          case timeObj.currentToD >= timeObj.startingToD && timeObj.currentToD <= timeObj.endingToD:
            if (this.link.role === "spectator") {
              this.ghost = true;
              this.ghostLogin();
            } else {
              console.log("no ghost login");
            }
            sockSys.initSockets(this.link.role);
            break;

          case timeObj.currentToD > timeObj.endingToD:
            this.invalidLogin("late");
            break;
        }
      } else {
        this.invalidLogin("date");
      }
    } else {
      console.log("audience login parameters not found");
      let links = Object.keys(loginLinks);
      for (let i = 0; i < links.length; i++) {
        //console.log(loginLinks[links[i]]);
        this.link = loginLinks[links[i]];
        let currentTime = new Date();
        currentTime = currentTime.toUTCString();
        let currentDate = currentTime.substring(5, 16);
        if (this.link.date === currentDate) {
          console.log("valid date");
          let timeObj = formatTimeWindow(currentTime, this.link);
          //check time window
          if (timeObj.currentToD >= timeObj.startingToD && timeObj.currentToD <= timeObj.endingToD) {
            this.destroyChat();
            this.invalidLogin("searchParams");
            break;
          } else {
            console.log("bare link, not in show time");
            break;
          }
        }
      }
    }
  }

  invalidLogin(reason) {
    console.log("invalid url because of : " + reason);
    let reasonTextH3, reasonTextH5;
    switch (reason) {
      case "searchParams":
        reasonTextH3 = "It's showtime. Please use your show-link.";
        reasonTextH5 = "Please check your Eventbrite email confirmation for the ticket link.";
        break;

      case "date":
        reasonTextH3 = "This link is for another show date.";
        reasonTextH5 =
          "Please verify the show date that corresponds with this link on your Eventbrite email confirmation.";
        break;

      case "early":
        reasonTextH3 = "You are early.";
        reasonTextH5 =
          "Please refresh your page when it is 15 minutes before your showtime. You will be able to join then.";
        break;

      case "late":
        reasonTextH3 = "You link is for a show that ended earlier today.";
        reasonTextH5 = "Please check your Eventbrite email confirmation to verify your showtime.";
        break;
    }

    //DELETE ALL BUTTONS
    let buttonsDeleted = 0;
    let interval = setInterval(() => {
      //if VR
      if (/OculusBrowser/i.test(window.navigator.userAgent) || /firefox/i.test(navigator.userAgent)) {
        if (
          document.getElementsByClassName("Button__accent4__2jrJP")[0] ||
          document.getElementsByClassName("Button__accent2__134e2")[0]
        ) {
          console.log("found div");
          if (document.getElementsByClassName("Button__accent4__2jrJP")[0] && buttonsDeleted < 1) {
            document.getElementsByClassName("Button__accent4__2jrJP")[0].style.display = "none";
            buttonsDeleted++;
          } else {
            document.getElementsByClassName("Button__accent2__134e2")[0].style.display = "none";
            console.log("interval cleared");
            clearInterval(interval);
            let div = document.getElementsByClassName("RoomEntryModal__buttons__X3XNq")[0];
            let textH3 = document.createElement("h3");
            let textH5 = document.createElement("h5");
            let supportingText = document.createElement("h5");
            supportingText.innerHTML =
              "If you have questions, please reach out to the email provided with your ticket.";
            textH3.innerHTML = reasonTextH3;
            textH5.innerHTML = reasonTextH5;
            div.appendChild(textH3);
            div.appendChild(textH5);
            div.appendChild(supportingText);
          }
        }
      } else {
        if (
          document.getElementsByClassName("Button__accent4__2jrJP")[0] ||
          document.getElementsByClassName("Button__accent5__2s_w9")[0] ||
          document.getElementsByClassName("Button__accent2__134e2")[0]
        ) {
          console.log("found div");
          if (document.getElementsByClassName("Button__accent4__2jrJP")[0] && buttonsDeleted < 2) {
            document.getElementsByClassName("Button__accent4__2jrJP")[0].style.display = "none";
            buttonsDeleted++;
          }
          if (document.getElementsByClassName("Button__accent2__134e2")[0] && buttonsDeleted < 2) {
            document.getElementsByClassName("Button__accent2__134e2")[0].style.display = "none";
            buttonsDeleted++;
          } else {
            document.getElementsByClassName("Button__accent5__2s_w9")[0].style.display = "none";
            console.log("interval cleared");
            clearInterval(interval);
            let div = document.getElementsByClassName("RoomEntryModal__buttons__X3XNq")[0];
            let textH3 = document.createElement("h3");
            let textH5 = document.createElement("h5");
            textH3.innerHTML = reasonTextH3;
            textH5.innerHTML = reasonTextH5;
            let supportingText = document.createElement("h5");
            supportingText.innerHTML =
              "If you have questions, please reach out to the email provided with your ticket.";
            div.appendChild(textH3);
            div.appendChild(textH5);
            div.appendChild(supportingText);
          }
        }
      }
    }, 100);
  }

  ghostLogin() {
    //connect this user as a ghost
    sockSys.connectGhost();

    //check video play
    if (localStorage.videoLastPlayed !== null && localStorage.videoLastPlayed !== undefined) {
      var newDate = Date.now();
      //calc differenece
      var dateDif = newDate - localStorage.videoLastPlayed;
      if (dateDif >= 86400000) {
        //TOTAL HACK AND BANDAID BEFORE SHOW TIME
        this.playGhostVideo = false;

        // this.playGhostVideo = true;
        localStorage.videoLastPlayed = Date.now();
      } else {
        this.playGhostVideo = false;
      }
    } else {
      localStorage.videoLastPlayed = Date.now();
      //TOTAL HACK AND BANDAID BEFORE SHOW TIME
      this.playGhostVideo = false;
      //this.playGhostVideo = true;
    }

    //load and style video
    const uiRoot = document.getElementById("ui-root");
    const vidDiv = document.createElement("div");
    uiRoot.appendChild(vidDiv);
    vidDiv.id = "vidDivOB";
    vidDiv.className = "nonDragSel";
    var styles = {
      width: "100vw",
      top: "0",
      left: "0",
      height: "100vh",
      display: "none",
      zIndex: "999999",
      overflow: "visible"
    };
    Object.assign(vidDiv.style, styles);
    const video = document.createElement("video");
    video.id = "videoOB";
    video.style.width = "100%";
    video.style.height = "100%";
    video.controls;
    vidDiv.appendChild(video);
    const source = document.createElement("source");
    source.id = "mp4OB";
    source.type = "video/mp4";
    source.src = "https://jigsawhubs.github.io/Jigsaw_data/video/GhostModeVideo.mp4";
    video.appendChild(source);
    video.controls = true;
    // video.autoplay = true;
    // video.load();

    //last login button
    // let button = document.createElement("button");
    // uiRoot.appendChild(button);
    // var butStyles = {
    //   position: "absolute",
    //   top: "20%",
    //   left: "40%",
    //   height: "50%",
    //   width: "20%",
    //   margin: "auto",
    //   display: "none",
    //   zIndex: "999999",
    //   overflow: "visible"
    // };
    // Object.assign(button.style, butStyles);
    // button.innerHTML = "click to enter";
    // button.addEventListener("click", () => {
    //   AFRAME.scenes[0].enterVR();
    //   AFRAME.scenes[0].addState("entered");
    //   const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
    //   waypointSystem.moveToSpawnPoint();
    //   button.style.display = "none";
    // });

    // //set up event listener to enter once video is ended
    // video.addEventListener("ended", () => {
    //   //hide video
    //   vidDiv.style.display = "none";
    //   //document.getElementsByClassName("ContentMenu__content-menu__15hNf")[0].style.display = "flex";
    //   this.playGhostVideo = false;
    //   if (/OculusBrowser/i.test(window.navigator.userAgent) || /firefox/i.test(navigator.userAgent)) {
    //     button.style.display = "block";
    //   }
    // });

    //check for divs to exist
    let buttonsDeleted = 0;
    let interval = setInterval(() => {
      //if VR
      if (/OculusBrowser/i.test(window.navigator.userAgent) || /firefox/i.test(navigator.userAgent)) {
        if (document.getElementsByClassName("Button__accent4__2jrJP")[0]) {
          document.getElementsByClassName("Button__accent4__2jrJP")[0].style.display = "none";
          clearInterval(interval);
        }
        if (document.getElementsByClassName("Button__accent2__134e2")[0]) {
          //Add in styling
          document.getElementsByClassName("Button__accent2__134e2")[0].lastElementChild.innerHTML = "ENTER INVISIBLE";
          document.getElementsByClassName("Button__accent2__134e2")[0].addEventListener("click", () => {
            //TOTAL HACK AND BANDAID BEFORE SHOW TIME
            // if (this.playGhostVideo) {
            //   vidDiv.style.display = "block";
            //   video.play();
            // } else {
            //   AFRAME.scenes[0].enterVR();
            //   AFRAME.scenes[0].addState("entered");
            //   const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
            //   waypointSystem.moveToSpawnPoint();
            // }
            AFRAME.scenes[0].enterVR();
            AFRAME.scenes[0].addState("entered");
            const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
            waypointSystem.moveToSpawnPoint();
          });
        }
      } else {
        if (document.getElementsByClassName("Button__accent2__134e2")[0]) {
          //Add in styling
          document.getElementsByClassName("Button__accent2__134e2")[0].lastElementChild.innerHTML = "ENTER INVISIBLE";
          document.getElementsByClassName("Button__accent2__134e2")[0].addEventListener("click", () => {
            //TOTAL HACK AND BANDAID BEFORE SHOW TIME
            // if (this.playGhostVideo) {
            //   vidDiv.style.display = "block";
            //   video.play();
            // } else {
            //   AFRAME.scenes[0].addState("entered");
            //   const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
            //   waypointSystem.moveToSpawnPoint();
            // }
            AFRAME.scenes[0].addState("entered");
            const waypointSystem = AFRAME.scenes[0].systems["hubs-systems"].waypointSystem;
            waypointSystem.moveToSpawnPoint();
          });
        }
        if (
          document.getElementsByClassName("Button__accent4__2jrJP")[0] ||
          document.getElementsByClassName("Button__accent5__2s_w9")[0]
        ) {
          console.log("found div");
          if (document.getElementsByClassName("Button__accent4__2jrJP")[0] && buttonsDeleted < 1) {
            document.getElementsByClassName("Button__accent4__2jrJP")[0].style.display = "none";
            buttonsDeleted++;
          } else {
            document.getElementsByClassName("Button__accent5__2s_w9")[0].style.display = "none";
            console.log("interval cleared");
            clearInterval(interval);
          }
        }
      }
    }, 100);
  }
}

export default loginManagerOB;
