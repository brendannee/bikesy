// Define Route Server
var routeserver = "ec2-184-73-96-123.compute-1.amazonaws.com";

//Hard code map bounds
var bounds = new Object();
bounds.l_lat = 37.306399999999996;
bounds.h_lat = 38.316994299999998;
bounds.l_lng = -123.02877599999999;
bounds.h_lng = -121.637;

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
  
  //Add Controls to top of map
  $("#map-buttons").show();
  $("#permalink").html("<a href='" + window.location.href + linkURL + "' title='Direct Link to this route' rel='external'><img src='images/link.png'> Permalink to Route</a>");
  $("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("http://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");
  
  distance[routeno] = Math.round(routelines[routeno].inMiles()*10)/10;
  elevation[routeno] = Math.round(getElevGain(data[2]));
  
  //Add Trip Stats for Route
  $('#directionsname').html('Directions to '+finishName);
  
  switch(routeno){
    case 0:
      tripstats[routeno] = "<div>Safe (more direct)</div>";
      break;
    case 1:
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
      tripstats[routeno] = "<div>Safer (some bike lanes, " + lengthdif + ", " +  elevdif + ")</div>";
      break;
    case 2:
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
      tripstats[routeno] = "<div>Safest (mostly bike lanes, " + lengthdif + ", " +  elevdif + ")</div>";
      break;
  }
  
  tripstats[routeno] += "<div class='totaldistance'><img src='images/map.png'> " + distance[routeno] + " miles</div>"; //figures are in meters
  
  tripstats[routeno] += "<div class='time'><img src='images/time.png'> " + formatTime(distance[routeno]/0.166, distance[routeno]/0.125) + "</div>";
  
  tripstats[routeno] += "<div class='elevGain'><img src='images/up.png'> " + elevation[routeno] + " ft</div>";
  
  
  tripstats[routeno] += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span>"+ Math.round(getElevChange(data[2]))+ " ft</span></div>";
  
  //Narrative
  if (data[0][0][1] == 'nameless') {
    // If first point is "nameless" then skip to next point for start
    data[0].shift();
  }
  
  //Add End point to data
  data[0].push(new Array("Arrive at",finishName));
    
  //Clear out old narrative and start building new one
  tripstats[routeno] += "<div id='directionslist'><ol><li id='direction-0-0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
  
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
  
  // Create Elevation Profile
  profile[routeno] = data[2];
  
  //convert distance along route to miles
  for (i=0;i<profile[routeno].length;i++){profile[routeno][i][0]=profile[routeno][i][0]/1609.344;}
  for (i=0;i<profile[routeno].length;i++){profile[routeno][i][1]=profile[routeno][i][1]*3.2808399;}
              
  
  $('#loading_image').fadeOut(); // hide loading image
  
  if (showTips==true){ // Detect if we should show tips or not
    $("#dragtext").fadeIn(); //Show Drag Tip
  }
  
  showRoute(1);
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
  
  //Detect SVG Show Profile
  if (typeof(profile[routeno]) != "undefined"){
    if(document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")==true){
      gviz(profile[routeno],$(window).width(),100);
    }
  }
}

function drawpath(request, redraw, port){
  if(redraw==true){
    $.mobile.changePage($('#map'),"slide");
  }
  
  //Hide lines
  for(i in routelines){
    routelines[i].setMap(null);
  }
  
  $.jsonp({
    "url": "http://"+routeserver+":"+ port +"/path?"+request+"&jsoncallback=?",
    "success": function(json) {processpath(json, redraw, 0);},
    "error": function(){
      //On error, try again
      $.jsonp({
        "url": "http://"+routeserver+":"+ port +"/path?"+request+"&jsoncallback=?",
        "success": function(json) {processpath(json, redraw, 0);},
        "error": function(){
          $('#loading_image').hide(); // hide loading image
          if(errorAlert==0){
            alert("There was an error retrieving the route data.  Please refresh the page and try again.");
          }
          errorAlert = 1;
        }
      });
    }
  }); 
  $.jsonp({
    "url": "http://"+routeserver+":"+ (port+3) +"/path?"+request+"&jsoncallback=?",
    "success": function(json) {processpath(json, redraw, 1);},
    "error": function(){
        //On error, try again
        $.jsonp({
          "url": "http://"+routeserver+":"+ (port+3) +"/path?"+request+"&jsoncallback=?",
          "success": function(json) {processpath(json, redraw, 1);},
          "error": function(){
            $('#loading_image').hide(); // hide loading image
            if(errorAlert==0){
              alert("There was an error retrieving the route data.  Please refresh the page and try again.");
            }
            errorAlert = 1;
          }
        });
      }
  });
  $.jsonp({
    "url": "http://"+routeserver+":"+ (port+6) +"/path?"+request+"&jsoncallback=?",
    "success": function(json) {processpath(json, redraw, 2);},
    "error": function(){
        //On error, try again
        $.jsonp({
          "url": "http://"+routeserver+":"+ (port+6) +"/path?"+request+"&jsoncallback=?",
          "success": function(json) {processpath(json, redraw, 2);},
          "error": function(){
            $('#loading_image').hide(); // hide loading image
            if(errorAlert==0){
              alert("There was an error retrieving the route data.  Please refresh the page and try again.");
            }
            errorAlert = 1;
          }
      });
    }
  });
}


google.setOnLoadCallback(function(){
  //Show form elements after everything is loaded
  $('#home').show();
  
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
  
  $('.safe').click(function(){
    showRoute(0);
    $('.safety ul li a').removeClass('ui-btn-active');
    $('.safe').addClass('ui-btn-active');
  });
  $('.safer').click(function(){
    showRoute(1);
    $('.safety ul li a').removeClass('ui-btn-active');
    $('.safer').addClass('ui-btn-active');
  });
  $('.safest').click(function(){
    showRoute(2);
    $('.safety ul li a').removeClass('ui-btn-active');
    $('.safest').addClass('ui-btn-active');
  });

  launchMap();

  $("#map_canvas").parent().bind('pageshow',function(){
    //Resize map to fit screen
    $("#map_canvas").css('height',$(window).height()-parseInt($('#profile').css('height'))-2-parseInt($('#map .ui-header').css('height')));
    google.maps.event.trigger(map,'resize'); //tell google maps to resize itself
  });

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
