// Define Route Server
var routeserver = "ec2-184-73-96-123.compute-1.amazonaws.com";

//Get Bounds From Route Server  
/*$.getJSON("http://"+ routeserver+":8081/bounds?jsoncallback=?",
  function(data){
    l_lat = data[1];
    h_lat = data[3];
    l_lng = data[0];
    h_lng = data[2];
  });*/
//Hard code map bounds
var l_lat = 37.306399999999996;
var h_lat = 38.316994299999998;
var l_lng = -123.02877599999999;
var h_lng = -121.637;

var map;

var showTips = true; // Show Tooltips by default

var routelines = new Array();
var tripstats = new Array();
var stoppoints = new Array();
var tripsummary = new Array();
var distance = new Array();
var elevation = new Array();
var profile = new Array();

var errorAlert=0;

function tooltips(){
  // select all desired input fields and attach tooltips to them 
  $("#inputs #startbox,#inputs #finishbox,#inputs #hills").tooltip({ 
    position: "center right",
    offset: [0, 10],
    effect: "fade",
    opacity: 0.8,
    tip: '.tooltip'
  });
}
  
function recalc(marker_name) {
  if (typeof(start_marker) != "undefined"){
    slat = start_marker.getPosition().lat();
    slng = start_marker.getPosition().lng();
    elat = end_marker.getPosition().lat();
    elng = end_marker.getPosition().lng();
    distance = dist(slat,elat,slng,elng);
    var hills = $('#hills').val();
    var port = translatePorts(hills);
    
    if(bounds(slat,slng,elat,elng)){
    
      sCoords = new google.maps.LatLng(slat,slng);
      eCoords = new google.maps.LatLng(elat,elng);
      
      //Reverse Geocode
      if(marker_name=='start'){
        this.getAddress(sCoords, 'start');
      } else if(marker_name=='end'){
        this.getAddress(eCoords, 'end');
      } else if(marker_name=='both'){
        this.getAddress(sCoords, 'start');
        this.getAddress(eCoords, 'end');
      }
      
      //Remove old overlay
      if (typeof(routeoverlay) != "undefined"){routeoverlay.setMap(null);}
      
      //Draw new route
      drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, false, port);
    }
    else{alert("Bikemapper currently only works in the Bay Area.");}
  }   
}
  
function addMarker(latlng, type){
  if(type=="start"){
    
    if (typeof(start_marker) == "undefined"){
      shadow = new google.maps.MarkerImage(
        "images/shadow.png",
        new google.maps.Size(32, 32)
      );
      startIcon = new google.maps.MarkerImage(
        "images/green.png",
        new google.maps.Size(32, 32)
      );
      start_marker = new google.maps.Marker({
        map:map,
        shadow:shadow,
        draggable:true,
        icon:startIcon
      });
      google.maps.event.addListener(start_marker,'dragend',function(position){
        showTips = false;
        $("#dragtext").fadeOut();
        recalc('start');
      });
    }
    
    start_marker.setOptions({ position: latlng });
  } else if (type=="end"){
    if (typeof(end_marker) == "undefined"){
      shadow = new google.maps.MarkerImage(
        "images/shadow.png",
        new google.maps.Size(32, 32)
      );
      endIcon = new google.maps.MarkerImage(
        "images/red.png",
        new google.maps.Size(32, 32)
      );
      end_marker = new google.maps.Marker({
        map:map,
        shadow:shadow,
        draggable:true,
        icon:endIcon
      });
      google.maps.event.addListener(end_marker,'dragend',function(position){
        showTips = false;
        $("#dragtext").fadeOut();
        recalc('end');
      });
    }
    
    end_marker.setOptions({ position: latlng });
  }
}
  
function showRoute(routeno) {
  //Hide routes
  for (var i=0; i<3; i++){
    switch(i){
      case 0:
        coloron="#c2403a";
        coloroff="#ed817e";
        break;
      case 1:
        coloron="#fff600";
        coloroff="#ecf869";
        break;
      case 2:
        coloron="#10dd00";
        coloroff="#90ff7a"
        break;
    }
    $("#stats"+i).hide();
    if (typeof(routelines[routeno]) != "undefined"){
      routelines[routeno].setOptions({ strokeColor: coloroff });
    }
    //Remove Highlight Route Choice Box
    $("#summary"+i).css("background-color", coloroff);
    $("#summary"+i).css("color", "#333");
    $("#summary"+i).css("border", "#ccc solid 1px");
  }
  
  switch(routeno){
    case 0:
      coloron="#c2403a";
      coloroff="#ed817e";
      safetyTitle = "Safe (more direct)";
      break;
    case 1:
      coloron="#fff600";
      coloroff="#ecf869";
      if (distance[1]>distance[0]) {
        lengthdif = Math.round((distance[1]-distance[0])*100)/100 + " miles longer";
      } else {
        lengthdif = Math.round((distance[0]-distance[1])*100)/100 + " miles shorter";
      }
      if (elevation[1]>elevation[0]) {
        elevdif = Math.round((elevation[1]-elevation[0])*100)/100 + " ft more climbing";
      } else {
        elevdif = Math.round((elevation[0]-elevation[1])*100)/100 + " ft less climbing";
      }
      safetyTitle = "Safer (some bike lanes, " + lengthdif + ", " +  elevdif + ")";
      break;
    case 2:
      coloron="#10dd00";
      coloroff="#90ff7a";
      if (distance[2]>distance[0]) {
        lengthdif = Math.round((distance[2]-distance[0])*100)/100 + " miles longer";
      } else {
        lengthdif = Math.round((distance[0]-distance[2])*100)/100 + " miles shorter";
      }
      if (elevation[2]>elevation[0]) {
        elevdif = Math.round((elevation[2]-elevation[0])*100)/100 + " ft more climbing";
      } else {
        elevdif = Math.round((elevation[0]-elevation[2])*100)/100 + " ft less climbing";
      }
      safetyTitle = "Safest (mostly bike lanes, " + lengthdif + ", " +  elevdif + ")";
      break;
  }
  
  // Show Route Line Stong Color
  $("#stats"+routeno).show();
  if (typeof(routelines[routeno]) != "undefined"){
    routelines[routeno].setOptions({ strokeColor: coloron });
  }
  
  //Highlight Summary Box
  $("#summary"+routeno).css("background-color", coloron);
  $("#summary"+routeno).css("color", "#000");
  $("#summary"+routeno).css("border", "#333 solid 1px");
  
  //Show Profile
  if (typeof(profile[routeno]) != "undefined"){
    gviz(profile[routeno]);
  }
}
  
function processpath(data, redraw, routeno){
  switch(routeno){
    case 0:
      coloron="#c2403a";
      coloroff="#ed817e";
      break;
    case 1:
      coloron="#fff600";
      coloroff="#ecf869";
      break;
    case 2:
      coloron="#10dd00";
      coloroff="#90ff7a"
      break;
  }
  
  var decodedPoints = google.maps.geometry.encoding.decodePath(data[1][0]);

  if(typeof(routelines[routeno])=="undefined"){
    routelines[routeno] = new google.maps.Polyline();
    // Add listener to route lines
    new google.maps.event.addListener(routelines[routeno], "mouseover", function() { showRoute(routeno); });
  }

  routelines[routeno].setOptions({
    strokeColor: coloroff,
    strokeOpacity: 0.4,
    strokeWeight: 7,
    path: decodedPoints,
    map:map
  });
  
  // Center and Zoom only if its a redraw
  if(redraw == true){
    map.fitBounds(routelines[routeno].getBounds());
  }
  
  //icons for start and end
  addMarker(new google.maps.LatLng(data[0][0][5][1],data[0][0][5][0]), "start");
  addMarker(routelines[routeno].getPath().getAt(routelines[routeno].getPath().getLength()-1), "end");
  
  //Clean Start and End Titles
  startName = $('#startbox').val().replace(/, USA/g, "");
  finishName = $('#finishbox').val().replace(/, USA/g, "");
  
  //Set Page Title
  document.title = startName+" to "+finishName+" | San Francisco Bay Area Bike Mapper";
  
  //Create Link URL
  linkURL = "?start=" + $('#startbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&hills=" + $('#hills').val();
  
  //Add Permalink Control on top of map
  $("#permalink").show();
  $("#permalink").html("<a href='" + linkURL + "' title='Direct Link to this route'><img src='images/link.png'> Permalink to Route</a>");
  
  //Add Twitter Control on top of map
  $("#twitter").show();[0]
  $("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("http://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");
  
  var distance = new Array();
  var elevation = new Array();
  var tripstats = new Array();
  distance[routeno] = Math.round(routelines[routeno].inMiles()*10)/10;
  
  elevation[routeno] = Math.round(getElevGain(data[2]));
  
  //Add Trip Stats for Route    
  tripstats[routeno] = "<div class='title'>Directions to "+finishName+"</div>"; 
  
  tripstats[routeno] += "<div class='totaldistance'><img src='images/map.png'> Distance: <span style='color:#000;'>" + distance[routeno] + " miles</span></div>"; //figures are in meters
  tripsummary[routeno] = distance[routeno] + " miles";
  
  tripstats[routeno] += "<div class='time'><img src='images/time.png'> Time: <span style='color:#000;'>" + formatTime(distance[routeno]/0.166, distance[routeno]/0.125) + "</span></div>";
  
  tripstats[routeno] += "<div class='elevGain'><img src='images/up.png'> Feet of Climbing: <span style='color:#000;'>"+ elevation[routeno] + " ft</span></div>";
  tripsummary[routeno] += "<br>" + elevation[routeno] + " ft";
  
  
  tripstats[routeno] += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span style='color:#000;'>"+ Math.round(getElevChange(data[2]))+ " ft</span></div>";
  
  //Narrative
  if (data[0][0][1] == 'nameless') {
    // If first point is "nameless" then skip to next point for start
    data[0].shift();
  }
  
  //Add End point to data
  data[0].push(new Array("Arrive at",finishName));
    
  //Clear out old narrative and start building new one
  tripstats[routeno] += "<div id='directions'><ol><li id='direction-0-0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
  
  stoppoints[routeno] = new Array();
  
  for(var i=0; i<data[0].length; i++) {
    
    if(i>0){
    
      direction = proper(data[0][i][0]);
      street = data[0][i][1];

      // Skip Direction if next step's street name is "nameless" and direction is "Continue" and add distance to this step
      if (i<data[0].length-1) {
        if (data[0][i+1][1] == "nameless") {
          data[0][i+1][2] = 0;
          i++;
        }
      }
      
      //If street is nameless, remove it
      if (street != 'nameless') {
        // Choose best term for direction
        if (direction == "Continue"){
          word = 'on';
        } else if (direction == "Arrive at"){
          word = '';
        } else {
          word = 'onto';
        }
        tripstats[routeno] += "<li id='direction-"+routeno.toString()+"-"+i.toString()+"' class='direction' title='Click to see this turn on map'><strong>" + direction + "</strong> " + word + " <strong>" + street + "</strong></li>";
        
        //Create a marker for each turn except the last one
        if(i<(data[0].length-1)){
          stoppoints[routeno][i] = new google.maps.Marker({
            position: new google.maps.LatLng(data[0][i][5][1], data[0][i][5][0]),
            map:map,
            visible:false
          });
        }
      }
    }
  }
  
  $("#stats"+routeno).html(tripstats[routeno]);
  //Set direction div click function to show marker when clicked
  $(".direction").click(function(){
    pointID = this.id.replace(/direction/g, "").split("-");
    console.log(pointID);
    // First, hide all stop points
    for (i in stoppoints) { 
      for (j in stoppoints[i]){
        if (stoppoints[i][j] != undefined) {
          stoppoints[i][j].setVisible(false); 
        }
        $("#direction-"+i+"-"+j).css('background-color','inherit');
      }
    }
    //Show desired stop point
    if (stoppoints[pointID[1]][pointID[2]] != undefined) {
      stoppoints[pointID[1]][pointID[2]].setVisible(true);
      $("#direction-"+pointID[1]+"-"+pointID[2]).css('background-color','#d1d1d1');
    }
  });
  $("#stats"+routeno).hide();
  
  //Show Directions
  $("#resultsBox").fadeIn();
  $("#summary"+routeno+ " .info").html(tripsummary[routeno]);
  $("#summary").fadeIn();
  
  //Resize sidebar
  var newWindowHeight = $(window).height();
  var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#sidebar-top").css("padding-top"))+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
  $("#resultsBox").css("max-height", (newWindowHeight-sidebarTopHeight));
  
  // Create Elevation Profile
  profile[routeno] = data[2];
  
  //convert distance along route to miles
  for (i=0;i<profile[routeno].length;i++){profile[routeno][i][0]=profile[routeno][i][0]/1609.344;}
  for (i=0;i<profile[routeno].length;i++){profile[routeno][i][1]=profile[routeno][i][1]*3.2808399;}
              
  
  $('#loading_image').fadeOut(); // hide loading image
  
  if (showTips==true){ // Detect if we should show tips or not
    $("#dragtext").fadeIn(); //Show Drag Tip
  }
  
  $("#inputs #startbox").tooltip().hide(); //Hide entry tip
  $("#endpointtext").hide(); //Hide Initial Endpoint click Tip
  
  showRoute(1);
}
  
function gviz(profile){
  if (typeof(table) == "undefined"){
    table = new google.visualization.DataTable();
    chart = new google.visualization.ScatterChart(document.getElementById('profile'));
  } else {
    table.removeColumn(0);
    table.removeColumn(0);
  }
  
  table.addColumn('number', 'Distance');
  table.addColumn('number', 'Elevation');
  table.addRows(profile);
  var windowwidth = window.innerWidth;
  chart.draw(table, {width: windowwidth-305, height: 190, titleX: 'Distance along route (mi)', titleY: 'Elevation (ft)', legend: 'none', lineSize: 2, pointSize: 0, title: 'Elevation Profile', titleFontSize: 14, fontSize:18});
}

function launchMap(){
  var myOptions = {
    zoom: 10,
    center: new google.maps.LatLng(37.880002, -122.189941),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);
  
  //Add credits pane
  /*function CreditsPane() {}
  CreditsPane.prototype = new GControl;
  CreditsPane.prototype.initialize = function(map) {
    var me = this;
    me.panel = document.createElement("div");
    me.panel.style.width = "400px";
    me.panel.style.height = "15px";
  
    me.panel.innerHTML = "Sponsored by <a href='http://511contracosta.org'  title='Visit 511ContraCosta.org'>511 Contra Costa</a> &nbsp; Site by <a href='http://blnktag.com' title='BlinkTag Inc'>BlinkTag Inc</a>";
    map.getContainer().appendChild(me.panel);
    return me.panel;
  };

  CreditsPane.prototype.getDefaultPosition = function() {
    return new GControlPosition(
        G_ANCHOR_BOTTOM_LEFT, new GSize(180, 0));
  };

  CreditsPane.prototype.getPanel = function() {
    return me.panel;
  }
  map.addControl(new CreditsPane());*/
  
  //Add welcome screen
  $('#welcome_screen').fadeIn();
  
  // Allow for clicking on the map to assign initial start points
  google.maps.event.addListener(map, 'click', function(event) {
    if (typeof(start_marker) == "undefined"){
      addMarker(event.latLng, "start");
      startpoint = event.latLng;
      $("#inputs #startbox").tooltip().hide();
      $("#endpointtext").fadeIn(); //Show Endpoint Tooltip
    } else if (typeof(start_marker) != "undefined" && typeof(end_marker) == "undefined"){
      if(startpoint.toString()!=event.latLng.toString()){
        addMarker(event.latLng, "end");
        recalc('both');
      }
    }
  });
}
  
function swapAddress(){
  var Saddress = $('#startbox').val();
  var Eaddress = $('#finishbox').val();
  $('#startbox').val(Eaddress);
  $('#finishbox').val(Saddress);
  submitForm();
}
  
google.setOnLoadCallback(function(){
  
  $(document).ready(function(){
    resizeWindow();
    //If the User resizes the window, adjust the #container height
    $(window).bind("resize", resizeWindow);
    function resizeWindow( e ) {
      var newWindowHeight = $(window).height();
      var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#sidebar-top").css("padding-top"))+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
      $("#sidebar").css("height", (newWindowHeight) );
      $("#sidebar").css("max-height", (newWindowHeight) );
      $("#resultsBox").css("max-height", (newWindowHeight-sidebarTopHeight));
      $("#map_canvas").css("height", (newWindowHeight-206) );
      $("#loading_image").css("top", ((newWindowHeight-206)/2) );
    }
  
    $('#hideProfile').click(function(){
      $('#profile').slideToggle('fast');
      $("#map_wrapper").css("height", $(window).height() );
      $("#map_canvas").css("height", $(window).height() );
      $('#showProfile').show();
      $('#hideProfile').hide();
      return false;
    });

    $('#showProfile').click(function(){
      $('#profile').show();
      $("#map_wrapper").css("height", ($(window).height()-206) );
      $("#map_canvas").css("height", ($(window).height()-206) );
      $('#showProfile').hide();
      $('#hideProfile').show();
      return false;
    });

    $('#summary0').hover(function(){ showRoute(0); });
  
    $('#summary1').hover(function(){ showRoute(1); });
  
    $('#summary2').hover(function(){ showRoute(2); });

    $('#swap').click(function(){ swapAddress(); });
  });

  //Show tooltips
  tooltips();

  if(navigator.geolocation) {  
    // Show GeoLocation Options
    $("#slocation").show();
    $("#elocation").show();
  }
  $("#slocation a").click(function(){
    navigator.geolocation.getCurrentPosition(getStartGeoLocator,showGeoLocatorError);
    return false;
  });
  
  $("#elocation a").click(function(){
    navigator.geolocation.getCurrentPosition(getEndGeoLocator,showGeoLocatorError);
    return false;
  });

  launchMap();

  //Detect saved route from URL
  if($.getUrlVar('start')!=undefined && $.getUrlVar('end')!=undefined){
    $('#startbox').val($.getUrlVar('start').replace(/\+/g,' '));
    $('#finishbox').val($.getUrlVar('end').replace(/\+/g,' '));
    // Strip off trailing #
    if($.getUrlVar('hills')!=undefined) {
      $('#hills').val($.getUrlVar('hills').replace(/#/g,''));
    }
    submitForm();
  }
  
  $('#inputs').submit(submitForm)
  
});