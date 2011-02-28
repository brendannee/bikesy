//Hard code map bounds
var bounds = new Object();
bounds.l_lat = 37.306399999999996;
bounds.h_lat = 38.316994299999998;
bounds.l_lng = -123.02877599999999;
bounds.h_lng = -121.637;

var map;
var showTips = true; // Show Tooltips by default
var routes = new Array();
var errorAlert=0;

google.maps.Polyline.prototype.getBounds = function() {
  //Extends google maps API v3 to allow getting bounds of a polyline
  var bounds = new google.maps.LatLngBounds();
  this.getPath().forEach(function(e) {
    bounds.extend(e);
  });
  return bounds;
};

google.maps.LatLng.prototype.miTo = function(a){ 
  //Extends google maps API V3 to allow getting the length of a polyline
  var e = Math, ra = e.PI/180; 
  var b = this.lat() * ra, c = a.lat() * ra, d = b - c; 
  var g = this.lng() * ra - a.lng() * ra; 
  var f = 2 * e.asin(e.sqrt(e.pow(e.sin(d/2), 2) + e.cos(b) * e.cos 
(c) * e.pow(e.sin(g/2), 2))); 
  return f * 3963.1676; 
}
google.maps.Polyline.prototype.inMiles = function(n){ 
  var a = this.getPath(n), len = a.getLength(), dist = 0; 
  for(var i=0; i<len-1; i++){ 
    dist += a.getAt(i).miTo(a.getAt(i+1)); 
  } 
  return dist; 
}

$.extend({
  //Extends jQuery to get parameters from URL
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});


function formatTime(minutes1, minutes2){
  times = '';
  minutes1 = Math.round(minutes1);
  minutes2 = Math.round(minutes2);
  hours1 = Math.floor(minutes1/60);
  minutes1 = minutes1%60;
  hours2 = Math.floor(minutes2/60);
  minutes2 = minutes2%60;     
  if(hours1 == 0 && hours2 ==0 ){
    times = minutes1 + ' to ' + minutes2 + ' min';
  } else {
    if (hours1 == 0){
      times = minutes1 + ' mins to ';
    } else if (hours1 == 1){
      times = hours1 + ' hour ' + minutes1 + ' mins to ';
    } else {
      times = hours1 + ' hours ' + minutes1 + ' mins to ';
    }
    if (hours2 == 0){
      times += minutes2 + ' mins';
    } else if (hours2 == 1){
     times += hours2 + ' hour ' + minutes2 + ' mins';
    } else{
     times += hours2 + ' hours ' + minutes2 + ' mins';
    }
  }
  return times;
}

function dist(lat1,lat2,lon1,lon2) {
  
    var R = 6371; // km
    var dLat = (lat2-lat1)*3.14/180;
    var dLon = (lon2-lon1)*3.14/180; 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*3.14/180) * Math.cos(lat2*3.14/180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d*.62;  //mi
}

function proper(str){
    return str.replace(/\w\S*/, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function checkBounds(lat1, lng1, lat2, lng2){
  if(lat1>bounds.h_lat || lat2>bounds.h_lat || lat1<bounds.l_lat || lat2<bounds.l_lat || lng1>bounds.h_lng || lng2>bounds.h_lng || lng1<bounds.l_lng || lng2<bounds.l_lng){
    return false;
  } else { 
    return true;
  }
}

function launchMap(){
  map = new google.maps.Map(document.getElementById("map_canvas"), {
    zoom: 10,
    center: new google.maps.LatLng(37.880002, -122.189941),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);
  
  //Setup route lines
  for(i=0;i<3;i++){
    routes[i] = new Object();
    routes[i].routeline = new google.maps.Polyline();
    // Add listener to route lines
    new google.maps.event.addListener(routes[i].routeline, "mouseover", function() { showRoute(i); });
  }
}

function submitForm() {
  // Redraws map based on info in the form
  start = $('#startbox').val();
  end = $('#finishbox').val();
  hill = $('#hills').val();

  //Validate inputs
  if(start==''){
    $('#startbox').addClass('error');
    return false;
  } else {$('#startbox').removeClass('error');}
  if(end==''){
    $('#finishbox').addClass('error');
    return false;
  } else {$('#finishbox').removeClass('error');}

  //Search for Richmond, if found add usa to end to avoid confusion with Canada
  if (start.search(/richmond/i) != -1) {
    start = start + ", usa";
  }
  if (end.search(/richmond/i) != -1) {
    end = end + ", usa";
  }

  geocoder = new google.maps.Geocoder();
  var lat1;
  var lng1;
  var lat2;
  var lng2;
  geocoder.geocode({address:start}, function(results, status){
    if (status == google.maps.GeocoderStatus.OK) {
      lat1 = results[0].geometry.location.lat();
      lng1 = results[0].geometry.location.lng();
      //Now geocode end address
      geocoder.geocode({address:end}, function(results, status){
        if (status == google.maps.GeocoderStatus.OK) {
          lat2 = results[0].geometry.location.lat();
          lng2 = results[0].geometry.location.lng();
          //Now move along
          if(checkBounds(lat1,lng1,lat2,lng2)){
            // Draw 3 paths, one for each safety level
            drawpath(lat1, lng1, lat2, lng2, hill, "low", true);
            drawpath(lat1, lng1, lat2, lng2, hill, "medium", true);
            drawpath(lat1, lng1, lat2, lng2, hill, "high", true);
            
            if(mobile==true){
              $.mobile.changePage($('#map'),"slide");
            }
            
            map.panTo(new google.maps.LatLng((lat1+lat2)/2,(lng1+lng2)/2));
          } else {
            alert("Bikemapper currently only works in the Bay Area.  Try making your addresses more specific by adding city and state names.");
          }
        } else {
          alert(end + " not found");
          return false;
        }
      });
    } else {
      alert(start + " not found");
      return false;
    }
  });
return false;
}

function drawpath(lat1, lng1, lat2, lng2, hill, safety, redraw){
  $('#welcome_screen').fadeOut(); // hide welcome screen if its still up
  $('#loading_image').show(); // show loading image, as request is about to start
  
  //Hide lines
  for(i in routes){
    routes[i].routeline.setMap(null);
  }
  // Define Route Server
  var routeserver = "http://api.bikesy.com";
  
  $.jsonp({
    "url": routeserver+"?lat1="+lat1+"&lng1="+lng1+"&lat2="+lat2+"&lng2="+lng2+"&hill="+hill+"&safety="+safety+"&format=json&jsoncallback=?",
    "success": function(json) {processpath(json, redraw, safety);},
    "error": function(){
      //On error, try again
      $.jsonp({
        "url": routeserver+"?lat1="+lat1+"&lng1="+lng1+"&lat2="+lat2+"&lng2="+lng2+"&hill="+hill+"&safety="+safety+"&format=json&jsoncallback=?",
        "success": function(json) {processpath(json, redraw, safety);},
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

function recalc(marker_name) {
  if (typeof(start_marker) != "undefined"){
    lat1 = start_marker.getPosition().lat();
    lng1 = start_marker.getPosition().lng();
    lat2 = end_marker.getPosition().lat();
    lng2 = end_marker.getPosition().lng();
    distance = dist(lat1,lat2,lng1,lng2);
    var hill = $('#hills').val();
    
    if(checkBounds(lat1,lng1,lat2,lng2)){
    
      sCoords = new google.maps.LatLng(lat1,lng1);
      eCoords = new google.maps.LatLng(lat2,lng2);
      
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
      
      // Draw 3 paths, one for each safety level
      drawpath(lat1, lng1, lat2, lng2, hill, "low", true);
      drawpath(lat1, lng1, lat2, lng2, hill, "medium", true);
      drawpath(lat1, lng1, lat2, lng2, hill, "high", true);
    }
    else{alert("Bikemapper currently only works in the Bay Area.");}
  }   
}

function gviz(profile, width, height){
  if (typeof(table) == "undefined"){
    table = new google.visualization.DataTable();
    chart = new google.visualization.ScatterChart(document.getElementById('profile'));
  } else {
    table.removeColumn(0);
    table.removeColumn(0);
  }
  
  table.addColumn('number', 'Distance');
  table.addColumn('number', 'Elevation');
  // Round profile values
  for (i in profile){
    profile[i][0] = Math.round(profile[i][0]*100)/100;
    profile[i][1] = Math.round(profile[i][1]);
  }
  
  //Determine appropriate chart padding
  if(width>400){
    var area = {left: 80, width:(width-90)};
  } else {
    var area = {left: 40, width:(width-50)};
  }
  
  table.addRows(profile);
  chart.draw(table, {width: width, height: height, legend: 'none', lineWidth: 2, pointSize: 0, title: 'Elevation Profile', titleTextStyle: {fontSize: '16'}, vAxis:{title:'Elevation (ft)', textStyle:{fontSize: '12'}}, hAxis:{title:'Distance along route (mi)', textStyle:{fontSize: '12'}}, chartArea:area});
}
  
function getElevGain(profile) {
  var totalElevGain = 0;
  for (i=0;i<(profile.length-1);i++){
    if (profile[i][1] < profile[i+1][1]) {
      totalElevGain += profile[i+1][1]-profile[i][1];
    }
  }
  //Convert to Feet
  return totalElevGain*3.2808399;
}
  
function getElevChange(profile) {
  var totalElevChange = profile[profile.length-1][1] - profile[0][1];
  //Convert to Feet
  return totalElevChange*3.2808399;
}
  
function getAddress(latlng, marker_name) {
  geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': latlng}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if(marker_name=='start') {
        $('#startbox').val(results[0].formatted_address);
      } else if(marker_name=='end') {
        $('#finishbox').val(results[0].formatted_address);
      }
    }
  });
}

function getStartGeoLocator(position) {
  sCoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': sCoords}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      $('.geolocationwaiting').fadeOut();
      $('#startbox').val(results[0].formatted_address).replace(/, CA, USA/g, "");;
    }
  });
}
  
function getEndGeoLocator(position) {
  eCoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': eCoords}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      $('.geolocationwaiting').fadeOut();
      $('#finishbox').val(results[0].formatted_address).replace(/, CA, USA/g, "");;
    }
  });
}
  
function showGeoLocatorError(error){
  $('#geolocationwaiting').fadeOut();
  if(error.code==1){
    alert("To determine your current location you must click \"Share Location\" in the top bar in your browser.");
  } else if (error.code==2 || error.code==3 || error.code==0){
    alert("Your current location couldn't be determined.  Please enter the start and end locations manually.");
  } 
}

function detectRouteFromURL(){
  //Detect saved route from URL
  if($.getUrlVar('start')!=undefined && $.getUrlVar('end')!=undefined){
    $('#startbox').val($.getUrlVar('start').replace(/\+/g,' '));
    $('#finishbox').val($.getUrlVar('end').replace(/\+/g,' '));
    // Strip off trailing #
    if($.getUrlVar('hill')!=undefined) {
     $('#hills').val($.getUrlVar('hill').replace(/#/g,''));
    }
    submitForm();
  }
}