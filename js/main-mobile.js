var mobile = true;

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
  linkURL = "?start=" + $('#startbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&hills=" + $('#hills').val();
  
  //Add Controls to top of map
  $("#map-buttons").show();
  $("#permalink").html("<a href='" + window.location.href.replace(/#.*/,'') + linkURL + "' title='Direct Link to this route' rel='external'><img src='images/link.png'> Permalink to Route</a>");
  $("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("http://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");
  
  routes[routeno].distance = Math.round(routes[routeno].routeline.inMiles()*10)/10;
  routes[routeno].elevation = Math.round(getElevGain(data[2]));
  
  //Add Trip Stats for Route
  $('#directionsname').html('Directions to '+finishName);
  
  switch(routeno){
    case 0:
      routes[routeno].tripstat = "<div>Safe (more direct)</div>";
      break;
    case 1:
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
      routes[routeno].tripstat = "<div>Safer (some bike lanes, " + lengthdif + ", " +  elevdif + ")</div>";
      break;
    case 2:
      if (routes[2].distance>routes[0].distance) {
        lengthdif = Math.round((routes[2].distance-routes[0].distance)*100)/100 + " miles longer";
      } else {
        lengthdif = Math.round((routes[0].distance-routes[2].distance)*100)/100 + " miles shorter";
      }
      if (routes[2].elevation>routes[0].elevation) {
        elevdif = Math.round((routes[2].elevation-routes[0].elevation)*100)/100 + " ft more climbing";
      } else {
        elevdif = Math.round((routes[0].elevation-routes[2].elevation)*100)/100 + " ft less climbing";
      }
      routes[routeno].tripstat = "<div>Safest (mostly bike lanes, " + lengthdif + ", " +  elevdif + ")</div>";
      break;
  }
  
  routes[routeno].tripstat += "<div class='totaldistance'><img src='images/map.png'> " + routes[routeno].distance + " miles</div>"; //figures are in meters
  
  routes[routeno].tripstat += "<div class='time'><img src='images/time.png'> " + formatTime(routes[routeno].distance/0.166, routes[routeno].distance/0.125) + "</div>";
  
  routes[routeno].tripstat += "<div class='elevGain'><img src='images/up.png'> " + routes[routeno].elevation + " ft</div>";
  
  
  routes[routeno].tripstat += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span>"+ Math.round(getElevChange(data[2]))+ " ft</span></div>";
  
  //Narrative
  if (data[0][0][1] == 'nameless') {
    // If first point is "nameless" then skip to next point for start
    data[0].shift();
  }
  
  //Add End point to data
  data[0].push(new Array("Arrive at",finishName));
    
  //Clear out old narrative and start building new one
  routes[routeno].tripstat += "<div id='directionslist'><ol><li id='direction-0-0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
  
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
  
  // Create Elevation Profile
  routes[routeno].profelev = data[2];
  
  //convert distance along route to miles
  for (i=0;i<routes[routeno].profelev.length;i++){routes[routeno].profelev[i][0]=routes[routeno].profelev[i][0]/1609.344;}
  for (i=0;i<routes[routeno].profelev.length;i++){routes[routeno].profelev[i][1]=routes[routeno].profelev[i][1]*3.2808399;}
              
  
  $('#loading_image').fadeOut(); // hide loading image
  
  if(mobile){
    //Hide mobile loading image
     $.mobile.pageLoading( true );
  }
  
  if (showTips==true){ // Detect if we should show tips or not
    $("#dragtext").fadeIn(); //Show Drag Tip
  }
  
  $('.safer').trigger('click');
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
    if (typeof(routes[i]) != "undefined"){
      if (typeof(routes[i].routeline) != "undefined"){
        routes[i].routeline.setOptions({ strokeColor: coloroff });
      }
    }
  }
  
  // Show Route Line Stong Color
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
  
  $("#stats"+routeno).show();
  if (typeof(routes[routeno]) != "undefined"){
    if (typeof(routes[routeno].routeline) != "undefined"){
      routes[routeno].routeline.setOptions({ strokeColor: coloron });
    }
  }
  
  //Detect SVG Show Profile
  if (typeof(routes[routeno]) != "undefined"){
    if (typeof(routes[routeno].profelev) != "undefined"){
      if(document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")==true){
        gviz(routes[routeno].profelev,$(window).width(),100);
      }
    }
  }
}

function isiPhone(){
    return (
        (navigator.platform.indexOf("iPhone") != -1) ||
        (navigator.platform.indexOf("iPod") != -1)
    );
}

function resizeMobile(){
  //Check if window is landscape by looking and height and SVG support to decide if to show Profile
  var mapheight;
  if(isiPhone()){
    //Hide top address bar
    window.top.scrollTo(0, 1);
    if(window.orientation==0){
      //Show profile bar if portriat mode
      mapheight = $(window).height()-40-parseInt($('#map .ui-header').css('height'));
    } else {
      mapheight = $(window).height()+60-parseInt($('#map .ui-header').css('height'));
    }
  } else {
    //Not iphone
    if($(window).height()>500 && document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")==true){
      //Show profile if enough room ans SVG supported
      mapheight = $(window).height()-100-parseInt($('#map .ui-header').css('height'));
    } else {
      mapheight = $(window).height()-parseInt($('#map .ui-header').css('height'));
    }
  }
  $("#map_canvas").css('height',mapheight);
  $("#map").css('height',$(window).height());
  google.maps.event.trigger(map,'resize');
}

google.setOnLoadCallback(function(){
  
  //Hide top address bar
  window.top.scrollTo(0, 1);
  
  //Show form elements after everything is loaded
  $('#home').show();
  
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

  //Resize map when map page is shown
  $("#map_canvas").parent().bind('pageshow',resizeMobile);
  
  //Resize map when orientation is changed
  $(window).bind('resize',function(e){
    resizeMobile();
    map.fitBounds(routes[0].routeline.getBounds());
  });

  detectRouteFromURL();

  $('#inputs').submit(submitForm)

});
