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
  _.each(['low', 'medium', 'high'], function(safety) {
    var idx = settings[safety].routeno;
    if(idx != routeno){
      $("#stats"+idx).hide();
      if (typeof(routes[idx]) != "undefined"){
        routes[idx].routeline.setOptions({ strokeColor: settings[safety].coloroff });
      }
      //Remove Highlight Route Choice Box
      $("#summary .summary").eq(idx)
        .css("background-color", settings[safety].coloroff)
        .css("color", "#333")
        .css("border-color", settings[safety].coloroff);
    } else {
      // Show Route Line Stong Color
      $("#stats"+idx).show();
      if (typeof(routes[idx]) != "undefined"){
        routes[idx].routeline.setOptions({ strokeColor: settings[safety].coloron });
      }
      //Highlight Summary Box
      $("#summary .summary").eq(idx)
        .css("background-color", settings[safety].coloron)
        .css("color", "#000")
        .css("border-color", "#333");
    }
  });

  //Show Profile
  if (typeof(routes[routeno]) != "undefined" && typeof(routes[routeno].profelev) != "undefined"){
    var windowwidth = window.innerWidth;
    gviz(routes[routeno].profelev,windowwidth-305,190);
  }
}


function processpath(data, redraw, safety){
  var decodedPoints = google.maps.geometry.encoding.decodePath(data[1][0])
    , route = routes[settings[safety].routeno]
    , startName = $('#startbox').val().replace(/, USA/g, "")
    , finishName = $('#finishbox').val().replace(/, USA/g, "");

  route.routeline.setOptions({
    strokeColor: settings[safety].coloroff,
    strokeOpacity: 0.4,
    strokeWeight: 7,
    path: decodedPoints,
    map:map
  });

  // Center and Zoom only if its a redraw
  if(redraw == true){
    map.fitBounds(route.routeline.getBounds());
  }

  //icons for start and end
  addMarker(new google.maps.LatLng(data[0][0][5][1],data[0][0][5][0]), "start");
  addMarker(route.routeline.getPath().getAt(route.routeline.getPath().getLength()-1), "end");

  //Set Page Title
  document.title = startName+" to "+finishName+" | San Francisco Bay Area Bike Mapper";

  //Create Link URL
  linkURL = "?start=" + $('#startbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&hill=" + $('#hills').val();

  //Add Controls to top of map
  $("#map-buttons").show();
  $("#permalink").html("<a href='" + window.location.href.replace(/#.*/,'') + linkURL + "' title='Direct Link to this route'><img src='images/link.png'> Permalink to Route</a>");
  $("#twitter").html("<a href='https://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("https://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");

  route.distance = Math.round(route.routeline.inMiles()*10)/10;
  route.elevation = Math.round(getElevGain(data[2]));
  route.time = formatTime(route.distance/0.166, route.distance/0.125);
  route.elevChange = Math.round(getElevChange(data[2]));

  //Add Trip Stats for Route
  var statsDiv = $("#stats" + settings[safety].routeno)
    , summaryDiv = $("#summary .summary").eq(settings[safety].routeno);
  $('.title span', statsDiv).text(finishName);
  $('.totaldistance span', statsDiv).text(route.distance + ' miles');
  $('.time span', statsDiv).text(route.time);
  $('.elevGain span', statsDiv).text(route.elevation + ' ft');
  $('.elevChange span', statsDiv).text(route.elevChange + ' ft');
  $('.directions', statsDiv)
    .empty()
    .append('<li data-route="0" data-step="0" title="Click to see this turn on map">Head <strong>' + data[0][0][0].replace(/start /g, "") + '</strong> on <strong>' + data[0][0][1] + '</strong></li>');

  $('.info', summaryDiv).html(route.distance + ' miles<br>' + route.elevation + ' ft');

  // If first point is "nameless" then skip to next point for start
  if (data[0][0][1] == 'nameless') { data[0].shift(); }

  //Add End point to data
  data[0].push(["Arrive at", finishName]);

  route.stoppoints = [];

  _.each(data[0], function(step, idx){
    if(idx == 0){ return; }

    var direction = proper(step[0])
      , street = step[1];

    // Skip Direction if next step's street name is "nameless" and direction is "Continue" and add distance to this step
    if (idx < (data[0].length - 1) && data[0][idx+1][1] == "nameless") {
      data[0][idx+1][2] = 0;
    }

    // If street is nameless, remove it
    if (street == 'nameless') { return; }
    var word = (direction == "Continue") ? 'on' : (direction == "Arrive at") ? '' : 'onto';

    $('.directions', statsDiv).append("<li data-route='" + settings[safety].routeno.toString() + "' data-step=" + idx.toString() + "' title='Click to see this turn on map'><strong>" + direction + "</strong> " + word + " <strong>" + street + "</strong></li>");

    //Create a marker for each turn except the last one
    if(idx < (data[0].length - 1)){
      route.stoppoints[idx] = new google.maps.Marker({
        position: new google.maps.LatLng(step[5][1], step[5][0]),
        map:map,
        visible:false
      });
    }
  });

  //Show Directions
  $("#resultsBox, #summary").fadeIn();

  //Resize sidebar
  var newWindowHeight = $(window).height();
  var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#sidebar-top").css("padding-top"))+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
  $("#resultsBox").css("max-height", (newWindowHeight-sidebarTopHeight));

  // Create Elevation Profile
  route.profelev = data[2];

  //convert distance along route to miles
  _.each(route.profelev, function(profelev) {
    profelev[0] = profelev[0] / 1609.344;
    profelev[1] = profelev[1] * 3.2808399;
  });

  $('#loading_image').fadeOut(); // hide loading image

  if (showTips==true){ // Detect if we should show tips or not
    $("#dragtext").fadeIn(); //Show Drag Tip
  }

  $("#inputs #startbox").tooltip().hide(); //Hide entry tip
  $("#endpointtext").hide(); //Hide Initial Endpoint click Tip

  showRoute(1);
}


//Chrome Frame check
if(typeof CFInstall != 'undefined'){
  CFInstall.check({
    mode:'overlay'
  });
}


//Show tooltips
tooltips();

if(navigator.geolocation) {
  // Show GeoLocation Options
  $("#slocation, #elocation").show();
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

// Read route parameters from URL
detectRouteFromURL();

//Add welcome screen
$('#welcome_screen').fadeIn();

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


$('#summary .summary').hover(function(){ showRoute($(this).data('summary')); });


$('#swap').click(function() {
  var Saddress = $('#startbox').val();
  var Eaddress = $('#finishbox').val();
  $('#startbox').val(Eaddress);
  $('#finishbox').val(Saddress);
  submitForm();
});


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


$('#inputs').submit(submitForm);
