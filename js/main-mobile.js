var mobile = true;

function processpath(data, redraw, safety){
  var decodedPoints = google.maps.geometry.encoding.decodePath(data[1][0])
    , route = routes[settings[safety].routeno]
    , startName = $('#startbox').val().replace(/, USA/g, "")
    , finishName = $('#finishbox').val().replace(/, USA/g, "");

  route.routeline.setOptions({
    strokeColor: settings[safety].coloron,
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
  document.title = startName + " to " + finishName + " | San Francisco Bay Area Bike Mapper";

  //Create Link URL
  linkURL = "?start=" + $('#startbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/&/g, "and").replace(/ /g, "+") + "&hills=" + $('#hills').val();

  //Add Controls to top of map
  $("#map-buttons").show();
  $("#permalink").html("<a href='" + window.location.href.replace(/#.*/,'') + linkURL + "' title='Direct Link to this route' rel='external'><img src='images/link.png'> Permalink to Route</a>");
  $("#twitter").html("<a href='https://www.addtoany.com/add_to/twitter?linkurl=" + encodeURIComponent("https://bikesy.com"+linkURL) + "&linkname=" + encodeURIComponent("Bike Route from " + startName.replace(/\+/g, "").replace(/&/g, "and") + " to " + finishName.replace(/\+/g, "").replace(/&/g, "and"))+"'><img src='images/twitter.png'> Tweet This</a>");

  route.distance = Math.round(route.routeline.inMiles()*10)/10;
  route.elevation = Math.round(getElevGain(data[2]));
  route.time = formatTime(route.distance/0.166, route.distance/0.125);
  route.elevChange = Math.round(getElevChange(data[2]));

   //Add Trip Stats for Route
  var statsDiv = $("#stats" )
  $('.tripsummary', statsDiv).text('Bike Lanes: ' + settings[safety].title + ', Hills: ' + $('#hills option:selected').text());
  $('.title span', statsDiv).text(finishName);
  $('.totaldistance span', statsDiv).text(route.distance + ' miles');
  $('.time span', statsDiv).text(route.time);
  $('.elevGain span', statsDiv).text(route.elevation + ' ft');
  $('.elevChange span', statsDiv).text(route.elevChange + ' ft');
  $('.directions', statsDiv)
    .empty()
    .append('<li data-route="0" data-step="0" title="Click to see this turn on map">Head <strong>' + data[0][0][0].replace(/start /g, "") + '</strong> on <strong>' + data[0][0][1] + '</strong></li>');

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

  // Create Elevation Profile
  route.profelev = data[2];

  //convert distance along route to miles
  _.each(route.profelev, function(profelev) {
    profelev[0] = profelev[0] / 1609.344;
    profelev[1] = profelev[1] * 3.2808399;
  });

  //Detect SVG, if supported show profile
  if(document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")==true){
    gviz(route.profelev, $(window).width(), 100);
  }
}

function isiPhone(){
  return (
    (navigator.platform.indexOf("iPhone") != -1) || (navigator.platform.indexOf("iPod") != -1)
  );
}

function resizeMobile(){
  //Check if window is landscape by looking and height and SVG support to decide if to show Profile
  var mapheight;
  if(isiPhone()){
    //Hide top address bar
    window.top.scrollTo(0, 1);
    if(window.orientation==0){
      //Show profile bar if portrait mode
      mapheight = $(window).height()-40-parseInt($('#map .ui-header').css('height'));
    } else {
      mapheight = $(window).height()+60-parseInt($('#map .ui-header').css('height'));
    }
  } else {
    //Not iphone
    if($(window).height()>500 && document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")==true){
      //Show profile if enough room ans SVG supported
      mapheight = $(window).height()-100-parseInt($('#map .ui-header').css('height'));
      $('.landscape #profile').height('100');
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
   $("#slocation, #elocation").show();
  }
  $("#slocation a").click(function(){
    $('.geolocationwaiting.start').fadeIn();
    navigator.geolocation.getCurrentPosition(getStartGeoLocator, showGeoLocatorError);
    return false;
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
