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
var tripsummary = new Array();
var distance = new Array();
var elevation = new Array();
var profile = new Array();

var errorAlert=0;

function tooltips(){
  // select all desired input fields and attach tooltips to them 
  $("#inputs #startbox,#inputs #finishbox,#inputs #hills").tooltip({ 
    // place tooltip on the right edge 
    position: "center right", 

    // a little tweaking of the position 
    offset: [0, 10], 

    // use the built-in fadeIn/fadeOut effect 
    effect: "fade", 

    // custom opacity setting 
    opacity: 0.8, 

    // use this single tooltip element 
    tip: '.tooltip'
  });
}

  
function recalc(marker_name) {
  if (typeof(start_marker) != "undefined"){
    slat = start_marker.getLatLng().lat();
    slng = start_marker.getLatLng().lng();
    elat = end_marker.getLatLng().lat();
    elng = end_marker.getLatLng().lng();
    distance = dist(slat,elat,slng,elng);
    var hills = $('#hills').val();
    var port = translatePorts(hills);
    
    if(bounds(slat,slng,elat,elng)){
    
      sCoords = new GLatLng(slat,slng);
      eCoords = new GLatLng(elat,elng);
      
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
      if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
      
      //Draw new route
      drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, false, port);
    }
    else{
      if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
      alert("Bikemapper currently only works in the Bay Area.");}
  }
  else {alert("Please search once using input boxes.");}     
}
  
function showPoint(i){
  // First, hide all stop points
  for (var j=0; j<(stoppoints.length+1); j++) { 
    if (stoppoints[j] != undefined) {
      stoppoints[j].hide(); 
    }
  $("#direction"+j).css('background-color','inherit');
  }
  
  //Show desired stop point
  if (stoppoints[i] != undefined) {
    stoppoints[i].show();
  }
  $("#direction"+i).css('background-color','#d1d1d1');
}
  
function addMarker(latlng, type){
  if(type=="start"){
    if (typeof(start_marker) != "undefined"){start_marker.remove();}
  
    startIcon = new GIcon(G_DEFAULT_ICON);
    startIcon.image = "images/green.png";
    startIcon.iconAnchor = new GPoint(16, 32);
    startIcon.iconSize = new GSize(32, 32);
  
    start_marker = new GMarker(latlng,{draggable: true, icon:startIcon});
    map.addOverlay(start_marker);
    GEvent.addListener(start_marker,'dragend',function(position){
      showTips = false;
      $("#dragtext").fadeOut();
      recalc('start');
    });
  } else if (type=="end"){
    if (typeof(end_marker) != "undefined"){end_marker.remove();}
    
    endIcon = new GIcon(G_DEFAULT_ICON);
    endIcon.image = "images/red.png";
    endIcon.iconAnchor = new GPoint(16, 32);
    endIcon.iconSize = new GSize(32, 32);
    
    end_marker = new GMarker(latlng,{draggable: true, icon:endIcon});
    map.addOverlay(end_marker);
    GEvent.addListener(end_marker,'dragend',function(position){
      showTips = false;
      $("#dragtext").fadeOut();
      recalc('end');
    });
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
    if (typeof(routelines[i+"on"]) != "undefined"){
      map.removeOverlay( routelines[i+"on"] );
      map.addOverlay( routelines[i] );
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
    map.removeOverlay( routelines[routeno] );
    map.addOverlay( routelines[routeno+"on"] );
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
  geometry = data[1];
  
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
  
  routelines[routeno+"on"] = GPolyline.fromEncoded( {points:geometry[0], 
         zoomFactor:32, 
              levels:geometry[1], 
              numLevels:4,
              color:coloron,
              opacity:0.4,
              weight:7} );

  routelines[routeno] = GPolyline.fromEncoded( {points:geometry[0], 
         zoomFactor:32, 
              levels:geometry[1], 
              numLevels:4,
              color:coloroff,
              opacity:0.4,
              weight:7} );
  
  // Center and Zoom only if its a redraw
  if(redraw == true){
    map.setZoom(map.getBoundsZoomLevel(routelines[routeno].getBounds()));
    map.panTo(routelines[routeno].getBounds().getCenter());
  }
  
  //Add Route Line
  map.addOverlay( routelines[routeno] );
  
  // Add listener to cursor position
  GEvent.addDomListener(map,'mousemove', 
  function(point){cursorpos=point;});
  
  // Add listener to route lines
  GEvent.addListener(routelines[routeno], "mouseover", function() { showRoute(routeno); });
  
  //icons for start and end   
  addMarker(new GLatLng(data[0][0][5][1],data[0][0][5][0]), "start");
  addMarker(routelines[routeno].getVertex(routelines[routeno].getVertexCount()-1), "end");
  
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
  
  distance[routeno] = Math.round(routelines[routeno].getLength()/1609.344*10)/10;
  
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
  tripstats[routeno] += "<div id='directions'><ol><li id='direction0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
  
  stoppoints = new Array();
  
  var len=data[0].length;
  for(var i=0; i<len; i++) {
    
    if(i>0){
    
      direction = proper(data[0][i][0]);
      street = data[0][i][1];
      
    
      // Skip Direction if next step's street name is "nameless" and direction is "Continue" and add distance to this step
      if (i<len-1) {
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
        tripstats[routeno] += "<li id='direction"+routeno+i+"' class='direction' title='Click to see this turn on map'><strong>" + direction + "</strong> " + word + " <strong>" + street + "</strong></li>";
        
        //Create a marker for each turn except the last one
        if(i<(len-1)){
          stoppoints[i] = new GMarker(new GLatLng(data[0][i][5][1], data[0][i][5][0]));
          map.addOverlay(stoppoints[i]);
          stoppoints[i].hide();
        }
        
        //Set direction div click function to show marker when clicked
        $("#direction"+routeno+i).click(function(){
          showPoint(this.id.replace(/direction/g, ""));
        });
      }
    } 
  }
  
  $("#stats"+routeno).html(tripstats[routeno]);
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
  map = new GMap2(map_canvas);
  map.setMapType(G_PHYSICAL_MAP);
  map.setCenter(new GLatLng(37.880002, -122.189941), 11);
  googleBike();
  map.setUIToDefault();
  
  //Add credits pane
  function CreditsPane() {}
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
  map.addControl(new CreditsPane());
  
  //Add welcome screen
  $('#welcome_screen').fadeIn();
  
  // Allow for clicking on the map to assign initial start points
  GEvent.addListener(map, 'click', function(overlay,latlng){
    if (typeof(start_marker) == "undefined"){
      addMarker(latlng, "start");
      startpoint = latlng;
      $("#inputs #startbox").tooltip().hide();
      $("#endpointtext").fadeIn(); //Show Endpoint Tooltip
    } else if (typeof(start_marker) != "undefined" && typeof(end_marker) == "undefined"){
      if(startpoint.toString()!=latlng.toString()){
        addMarker(latlng, "end");
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

  if(GBrowserIsCompatible()) { launchMap(); }

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