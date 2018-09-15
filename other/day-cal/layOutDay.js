(function() {

  /************ EVENT BLOCKS CALCULATORS ************/
  
  /**
   * function returs the event object for eventMap with event's colision details and position on grid
   * @param {*} map: eventMap of past events
   * @param {*} keys: Sorted keys of past events by event's start time
   * @param {*} start: Start time of the current event
   * @param {*} end: endtime of the current event
   */
function getBlockDetails(map, keys, start, end) {
  var overlapFound = 0;
  var colidesWith = [];
  var occupiedPositions = {};
  keys.forEach((k) => {
    var d = k.split("-");
    if(start < parseInt(d[1])) {
      colidesWith.push(k);
      overlapFound++;
      occupiedPositions[map[k].pos] = true;
    }
  });
  var availablePos = 0;
  for(var idx = 0; idx <= overlapFound; idx++) {
    if(!occupiedPositions[idx]) {
      availablePos = idx;
      break;
    }
  }
  return {overlap: overlapFound+1, pos: availablePos, start: start, end: end, colidesWith: colidesWith};
}

/**
 * function to update width of all the parent block
 * function cals itself recursiveli to update all the relative blocks
 * @param {*} eventMap map of event object 
 * @param {*} newWidth new width/overlap count for the block 
 * @param {*} colidesWith list of block for which we have to update width/overlap
 * @param {*} fixedBlocks map containeg keys of the block that have been updated
 */
function fixColidingBlocks(eventMap, newWidth, colidesWith, fixedBlocks) {
  colidesWith.forEach(k => {
    if(!fixedBlocks[k]) {
      fixedBlocks[k] = true;
      const newMax = eventMap[k].overlap > newWidth ? eventMap[k].overlap : newWidth
      eventMap[k].overlap=newMax;
      fixColidingBlocks(eventMap, newWidth, eventMap[k].colidesWith, fixedBlocks );
    }
  })
}


function getMaxOverlap(eventMap, newWidth, colidesWith, isChecked) {
  if(!colidesWith.length) {
    return newWidth;
  }
  return Math.max.apply(null, colidesWith.map(k => {
    if(isChecked[k]) {
      return newWidth
    }
    isChecked[k] = true;
    const newMax = eventMap[k].overlap > newWidth ? eventMap[k].overlap : newWidth
    return getMaxOverlap(eventMap, newMax, eventMap[k].colidesWith, isChecked );
  }));
}

/**
 * function return the map of calculated event blocks with list of keys in sorted order
 * @param {*} events list of events
 */
function getBlocksWithDetails(events) {
  var sortedKeys = [];
  var eventsMap = {};
  events.forEach((d, idx) => {
    var computedBlock = getBlockDetails(eventsMap, sortedKeys, d.start, d.end);
    eventsMap[d.start +"-"+ d.end + "-" + idx] = computedBlock;
    let max = getMaxOverlap(eventsMap, computedBlock.overlap, computedBlock.colidesWith, {});
    computedBlock.overlap = max > computedBlock.overlap ? max : computedBlock.overlap;
    fixColidingBlocks(eventsMap, computedBlock.overlap, computedBlock.colidesWith, {});
    sortedKeys.push(d.start +"-"+ d.end + "-" + idx);
  });
  return {eventsMap: eventsMap, keys: sortedKeys};
}

/************ RENDER FUNCTIONS ************/

/**
 * renders list of time
 */
function renderTimeGrid() {
  var gridHtml = '';
  for(var idx = 9; idx<=21; idx++) {
    var listItem = '<li>'
    listItem += "<p class='primary'>"+((idx%12) || 12)+":00 <span>"+((idx/12 < 1) ? "AM" : "PM")+"</span></p>"
    if(idx<21) {
      listItem += "<p class='secondary'>"+(idx%12)+":30</p>"
    }
    listItem += "</li>"
    gridHtml += listItem;
  }
  $(".timeList").html(gridHtml);
}

// renders border on grid
function renderGridPartitions() {
  var gridContent = "";
  for(var idx=1; idx<13; idx++) {
    gridContent += "<div class='gridPart' style='top: "+(idx*60)+"px' ></div>";
  }
  $(".slotGrid").html(gridContent + "<div class='slotContainer'></div>");
}

// renders a event block
function getGridBlock(height, width, top, left, data) {
  var blockStyle = "height: "+height+"px; width: "+width+"px; top: "+top+"px; left: "+left+"px;";
  var blockContent = "<p class='primary'>Sampel Event</p><p class='secondary'>Sampel Location</p>"
  return ("<div class='eventBlock' style='"+blockStyle+"'>"+(blockContent)+"</div>")
}

function renderBlocks(data) {
  var blockData = data.keys.map(k => {
    var d = data.eventsMap[k];
    var requiredMargin = ((d.overlap || 1) - 1) * 10;
    var height = d.end - d.start;
    var width = (620 - requiredMargin)/d.overlap;
    var top = d.start;
    var left = (width * d.pos) + 10;
    left += (d.pos * 10);
    return getGridBlock(height, width, top, left, d);
  }).join(" ");
  $(".eventBlock").remove();
  $(".slotContainer").append(blockData)
}
window.layOutDay = function(events) {
  events = (events || []).sort((a,b) => a.start - b.start);
  renderBlocks(getBlocksWithDetails(events));
  return events;
}
renderTimeGrid()
renderGridPartitions()

})();

var events = [
{start: 30, end: 150},
{start: 340, end: 400},
{start: 360, end: 620},
{start: 380, end: 420},
{start: 410, end: 440},
{start: 450, end: 480},
{start: 460, end: 530},
];

window.layOutDay(events);