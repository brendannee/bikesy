var mobile = false;

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
    if (typeof(routes[routeno].routeline) != "undefined"){
      routes[routeno].routeline.setOptions({ strokeColor: coloroff });
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
      if (routes[1].distance>routes[0].distance) {
        lengthdif = Math.round((routes[1].distance-routes[0].distance)*100)/100 + " miles longer";
      } else {
        lengthdif = Math.round((routes[0].distance-routes[1].distance)*100)/100 + " miles shorter";
      }
      if (routes[1].elevation>routes[0].elevation) {
        elevdif = Math.round((routes[1].elevation-routes[0].elevation)*100)/100 + " ft more climbing";
      } else {
        elevdif = Math.round((routes[0].elevation-routes[1].elevation)*100)/100 + " ft less climbing";
      }
      safetyTitle = "Safer (some bike lanes, " + lengthdif + ", " +  elevdif + ")";
      break;
    case 2:
      coloron="#10dd00";
      coloroff="#90ff7a";
      if (distance[2]>distance[0]) {
        lengthdif = Math.round((routes[2].distance-routes[0].distance)*100)/100 + " miles longer";
      } else {
        lengthdif = Math.round((routes[0].distance-routes[2].distance)*100)/100 + " miles shorter";
      }
      if (routes[2].elevation>routes[0].elevation) {
        elevdif = Math.round((routes[2].elevation-routes[0].elevation)*100)/100 + " ft more climbing";
      } else {
        elevdif = Math.round((routes[0].elevation-routes[2].elevation)*100)/100 + " ft less climbing";
      }
      safetyTitle = "Safest (mostly bike lanes, " + lengthdif + ", " +  elevdif + ")";
      break;
  }
  
  // Show Route Line Stong Color
  $("#stats"+routeno).show();
  if (typeof(routes[routeno].routeline) != "undefined"){
    routes[routeno].routeline.setOptions({ strokeColor: coloron });
  }
  
  //Highlight Summary Box
  $("#summary"+routeno).css("background-color", coloron);
  $("#summary"+routeno).css("color", "#000");
  $("#summary"+routeno).css("border", "#333 solid 1px");
  
  //Show Profile
  if (typeof(routes[routeno].elevprof) != "undefined"){
    var windowwidth = window.innerWidth;
    gviz(routes[routeno].elevprof,windowwidth-305,190);
  }
}
  
function processpath(data, redraw, safety){
  var routeno;
  switch(safety){
    case "low":
      coloron="#c2403a";
      coloroff="#ed817e";
      routeno=0;
      break;
    case "medium":
      coloron="#fff600";
      coloroff="#ecf869";
      routeno=1;
      break;
    case "high":
      coloron="#10dd00";
      coloroff="#90ff7a";
      routeno=2;
      break;
  }
  
  var decodedPoints = google.maps.geometry.encoding.decodePath(data[1][0]);

  if(typeof(routes[routeno].routeline)=="undefined"){
    routes[routeno].routeline = new google.maps.Polyline();
    // Add listener to route lines
    new google.maps.event.addListener(routes[routeno].routeline, "mouseover", function() { showRoute(routeno); });
  }

  routes[routeno].routeline.setOptions({
    strokeColor: coloroff,
    strokeOpacity: 0.4,
    strokeWeight: 7,
    path: decodedPoints,
    map:map
  });
  
  // Center and Zoom only if its a redraw
  if(redraw == true){
    map.fitBounds(routes[routeno].routeline.getBounds());
  }
  
  //icons for start and end
  addMarker(new google.maps.LatLng(data[0][0][5][1],data[0][0][5][0]), "start");
  addMarker(routes[routeno].routeline.getPath().getAt(routes[routeno].routeline.getPath().getLength()-1), "end");
  
  //Clean Start and End Titles
  startName = $('#startbox').val().replace(/, USA/g, "");
  finishName = $('#finishbox').val().replace(/, USA/g, "");
  
  //Set Page Title
  document.title = startName+" to "+finishName+" | San Francisco Bay Area Bike Mapper";
  
  //Create Link URL
  linkURL = "?start=" + $('#startbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&hill=" + $('#hills').val();
  
  //Add Controls to top of map
  $("#map-buttons").show();
  $("#permalink").html("<a href='" + window.location.href + linkURL + "' title='Direct Link to this route'><img src='images/link.png'> Permalink to Route</a>");
  $("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("http://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");
  
  routes[routeno].distance = Math.round(routes[routeno].routeline.inMiles()*10)/10;
  
  routes[routeno].elevation = Math.round(getElevGain(data[2]));
  
  //Add Trip Stats for Route    
  routes[routeno].tripstat = "<div class='title'>Directions to "+finishName+"</div>"; 
  
  routes[routeno].tripstat += "<div class='totaldistance'><img src='images/map.png'> Distance: <span style='color:#000;'>" + routes[routeno].distance + " miles</span></div>"; //figures are in meters
  routes[routeno].tripsummary = routes[routeno].distance + " miles";
  
  routes[routeno].tripstat += "<div class='time'><img src='images/time.png'> Time: <span style='color:#000;'>" + formatTime(routes[routeno].distance/0.166, routes[routeno].distance/0.125) + "</span></div>";
  
  routes[routeno].tripstat += "<div class='elevGain'><img src='images/up.png'> Feet of Climbing: <span style='color:#000;'>"+ routes[routeno].elevation + " ft</span></div>";
  routes[routeno].tripsummary += "<br>" + routes[routeno].elevation + " ft";
  
  
  routes[routeno].tripstat += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span style='color:#000;'>"+ Math.round(getElevChange(data[2]))+ " ft</span></div>";
  
  //Narrative
  if (data[0][0][1] == 'nameless') {
    // If first point is "nameless" then skip to next point for start
    data[0].shift();
  }
  
  //Add End point to data
  data[0].push(new Array("Arrive at",finishName));
    
  //Clear out old narrative and start building new one
  routes[routeno].tripstat += "<div id='directions'><ol><li id='direction-0-0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
  
  routes[routeno].stoppoints = new Array();
  
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
        routes[routeno].tripstat += "<li id='direction-"+routeno.toString()+"-"+i.toString()+"' class='direction' title='Click to see this turn on map'><strong>" + direction + "</strong> " + word + " <strong>" + street + "</strong></li>";
        
        //Create a marker for each turn except the last one
        if(i<(data[0].length-1)){
          routes[routeno].stoppoints[i] = new google.maps.Marker({
            position: new google.maps.LatLng(data[0][i][5][1], data[0][i][5][0]),
            map:map,
            visible:false
          });
        }
      }
    }
  }
  
  $("#stats"+routeno).html(routes[routeno].tripstat);
  //Set direction div click function to show marker when clicked
  $(".direction").click(function(){
    pointID = this.id.replace(/direction/g, "").split("-");
    // First, hide all stop points
    for (i in routes[routeno].stoppoints) { 
      for (j in routes[routeno].stoppoints[i]){
        if (routes[routeno].stoppoints[i][j] != undefined) {
          routes[routeno].stoppoints[i][j].setVisible(false); 
        }
        $("#direction-"+i+"-"+j).css('background-color','inherit');
      }
    }
    //Show desired stop point
    if (routes[routeno].stoppoints[pointID[1]][pointID[2]] != undefined) {
      routes[routeno].stoppoints[pointID[1]][pointID[2]].setVisible(true);
      $("#direction-"+pointID[1]+"-"+pointID[2]).css('background-color','#d1d1d1');
    }
  });
  $("#stats"+routeno).hide();
  
  //Show Directions
  $("#resultsBox").fadeIn();
  $("#summary"+routeno+ " .info").html(routes[routeno].tripsummary);
  $("#summary").fadeIn();
  
  //Resize sidebar
  var newWindowHeight = $(window).height();
  var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#sidebar-top").css("padding-top"))+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
  $("#resultsBox").css("max-height", (newWindowHeight-sidebarTopHeight));
  
  // Create Elevation Profile
  routes[routeno].elevprof = data[2];
  
  //convert distance along route to miles
  for (i=0;i<routes[routeno].elevprof.length;i++){routes[routeno].elevprof[i][0]=routes[routeno].elevprof[i][0]/1609.344;}
  for (i=0;i<routes[routeno].elevprof.length;i++){routes[routeno].elevprof[i][1]=routes[routeno].elevprof[i][1]*3.2808399;}
              
  
  $('#loading_image').fadeOut(); // hide loading image
  
  if (showTips==true){ // Detect if we should show tips or not
    $("#dragtext").fadeIn(); //Show Drag Tip
  }
  
  $("#inputs #startbox").tooltip().hide(); //Hide entry tip
  $("#endpointtext").hide(); //Hide Initial Endpoint click Tip
  
  showRoute(1);
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
    //Chrome Frame check
    if(typeof CFInstall != 'undefined'){
      CFInstall.check({
        mode:'overlay'
      });
    }
    
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
    $('.geolocationwaiting.start').fadeIn();
    navigator.geolocation.getCurrentPosition(getStartGeoLocator,showGeoLocatorError);
    return false;
  });
  
  $("#elocation a").click(function(){
    $('.geolocationwaiting.end').fadeIn();
    navigator.geolocation.getCurrentPosition(getEndGeoLocator,showGeoLocatorError);
    return false;
  });

  launchMap();
  
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

  detectRouteFromURL();
  
  $('#inputs').submit(submitForm)
  
});