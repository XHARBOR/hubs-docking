function initializeFormat() {
  var cueGroupChain = {
    name: "Test_group_cues",
    role: "test",
    target: {},
    action: {
      type: "",
      indicies: []
    },
    trig: {
      type: "button",
      time: 0
    }
  };
  return cueGroupChain;
}

export function groupChainCues(cueDB) {
  //initialize completed groups
  let completedGroupChains = [];

  // initialize format
  var cueGroupChain = initializeFormat();

  //get cue indicies and add to new cue group
  for (let i = 0; i < cueDB.listCue.length; i++) {
    //check if there is a group/chain
    if (cueDB.listCue[i].trig.groupChain !== null && cueDB.listCue[i].trig.groupChain !== undefined) {
      //console.log("found chainGroup @ index " + i);
      if (
        cueDB.listCue[i].trig.groupChain.includes("group") &&
        !completedGroupChains.includes(cueDB.listCue[i].trig.groupChain)
      ) {
        //console.log("found group:" + cueDB.listCue[i].trig.groupChain);
        //add group name to completed groups
        completedGroupChains.push(cueDB.listCue[i].trig.groupChain);
        //setup group
        cueGroupChain.action.type = "group";
        cueGroupChain.role = cueDB.listCue[i].role;
        cueGroupChain.name = cueDB.listCue[i].trig.groupChain;
        for (var j = 0; j < cueDB.listCue.length; j++) {
          if (cueDB.listCue[j].trig.groupChain === cueGroupChain.name) {
            //console.log("found corresponding group index" + j);
            cueGroupChain.action.indicies.push(j);
          }
        }
        //add group cue
        stgSys.cueDB.listCue.push(cueGroupChain);
        //reset formatting for next loop
        var cueGroupChain = initializeFormat();
      } else if (
        cueDB.listCue[i].trig.groupChain.includes("chain") &&
        !completedGroupChains.includes(cueDB.listCue[i].trig.groupChain)
      ) {
        //console.log("found chain");
        //add chain name to completed groups
        completedGroupChains.push(cueDB.listCue[i].trig.groupChain);
        //setup chain
        cueGroupChain.action.type = "chain";
        cueGroupChain.role = cueDB.listCue[i].role;
        cueGroupChain.name = cueDB.listCue[i].trig.groupChain;
        for (var j = 0; j < cueDB.listCue.length; j++) {
          if (cueDB.listCue[j].trig.groupChain === cueGroupChain.name) {
            //console.log("found corresponding chain index" + j);
            //order cues
            var index = cueDB.listCue[j].order - 1;
            //console.log("pushing cue " + j + "@ index " + index);
            cueGroupChain.action.indicies.splice(index, 0, j);
          }
        }
        //add chain cue
        stgSys.cueDB.listCue.push(cueGroupChain);

        //reset formatting for next loop
        var cueGroupChain = initializeFormat();
      } else {
        //console.log("invalid group/chain formatting");
      }
    }
  }
}

export function playGroup(indicies) {
  let cueList = stgSys.cueDB.listCue;
  for (var i = 0; i < indicies.length; i++) {
    let index = indicies[i];
    stgSys.playAction(cueList[index]);
  }
}

//Not functional, needs end trigger integration
export function playChain(indicies, chainPosition) {
  var timeout = 0;
  var index = 0;
  var cueList = stgSys.cueDB.listCue;
  if (chainPosition === null || chainPosition === undefined) {
    console.log("first in chain");
    chainPosition = 0;
    index = indicies[0];
  } else {
    console.log("playing chain # " + chainPosition);
    timeout = cueList[indicies[chainPosition]];
    index = indicies[chainPosition];
  }

  setTimeout(() => {
    if (index < cueList.length) {
      stgSys.playAction(cueList[index]);
      chainPosition++;
      playChain(indicies, chainPosition);
    } else {
      console.log("out of cues");
    }
  }, timeout);
}
