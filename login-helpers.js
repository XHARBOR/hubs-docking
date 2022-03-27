export function formatTimeWindow(currentTime, referenceTime) {
  let timeObj = {};
  let currentToD = currentTime.substring(17, 25);
  currentToD = currentToD.split(":");
  //console.log(currentToD);
  currentToD =
    parseInt(currentToD[0]) * 3600 * 1000 + parseInt(currentToD[1]) * 60 * 1000 + parseInt(currentToD[2]) * 1000;
  timeObj.currentToD = currentToD;
  //console.log("current time of day", currentToD);

  let startingToD = referenceTime.startingTime;
  startingToD = startingToD.split(":");
  //console.log(startingToD);
  startingToD =
    parseInt(startingToD[0]) * 3600 * 1000 + parseInt(startingToD[1]) * 60 * 1000 + parseInt(startingToD[2]) * 1000;
  timeObj.startingToD = startingToD;
  //console.log("starting time of day", startingToD);

  let endingToD = referenceTime.endingTime;
  endingToD = endingToD.split(":");
  //console.log(endingToD);
  endingToD = parseInt(endingToD[0]) * 3600 * 1000 + parseInt(endingToD[1]) * 60 * 1000 + parseInt(endingToD[2]) * 1000;
  timeObj.endingToD = endingToD;
  //console.log("ending time of day", endingToD);

  return timeObj;
}
