//Hard code map bounds
var bounds = {
  l_lat: 37.306399999999996,
  h_lat: 38.316994299999998,
  l_lng: -123.02877599999999,
  h_lng: -121.637
}

var map, start_marker, end_marker;
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
  return (minutes1<60 && minutes2<60) ? Math.round(minutes1) + ' to ' + Math.round(minutes2) + ' min' : Math.round((minutes1/60)*10)/10 + ' to ' + Math.round((minutes2/60)*10)/10 + ' hours';
}

function dist(lat1,lat2,lon1,lon2) {
    var R = 3963.1676; // mi
    var dLat = (lat2-lat1)*3.14/180;
    var dLon = (lon2-lon1)*3.14/180; 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*3.14/180) * Math.cos(lat2*3.14/180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

function proper(str){
    return str.replace(/\w\S*/, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function checkBounds(lat1, lng1, lat2, lng2){
  return (lat1>bounds.h_lat || lat2>bounds.h_lat || lat1<bounds.l_lat || lat2<bounds.l_lat || lng1>bounds.h_lng || lng2>bounds.h_lng || lng1<bounds.l_lng || lng2<bounds.l_lng) ? false : true;
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
  for(var i=0;i<3;i++){
    (function(i){
      routes[i] = {
        routeline: new google.maps.Polyline()
      }
      // Add listener to route lines for non-mobile
      if(!mobile){
        new google.maps.event.addListener(routes[i].routeline, "click", function() { showRoute(i); });
      }
    })(i);
  }
}

function submitForm() {
  // Redraws map based on info in the form
  if(mobile){
    $('#inputs input').blur();
    $.mobile.pageLoading();	
    var safety = $('#safety').val();
  }
  var start = $('#startbox').val();
  var end = $('#finishbox').val();
  var hill = $('#hills').val();

  //Validate inputs
  if(start==''){
    $('#startbox').addClass('error');
    if(mobile){
      $('#startbox').focus();
      $.mobile.pageLoading(true);	
    }
    return false;
  } else {$('#startbox').removeClass('error');}
  if(end==''){
    $('#finishbox').addClass('error');
    if(mobile){
      $('#finishbox').focus();
      $.mobile.pageLoading(true);	
    }
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
  geocoder.geocode({address:start}, function(results, status){
    if (status == google.maps.GeocoderStatus.OK) {
      var lat1 = results[0].geometry.location.lat();
      var lng1 = results[0].geometry.location.lng();
      //Now geocode end address
      geocoder.geocode({address:end}, function(results, status){
        if (status == google.maps.GeocoderStatus.OK) {
          var lat2 = results[0].geometry.location.lat();
          var lng2 = results[0].geometry.location.lng();
          //Now move along
          if(checkBounds(lat1,lng1,lat2,lng2)){
            // Draw 3 paths, one for each safety level for desktop, for mobile, only draw one
            if(!mobile){
              drawpath(lat1, lng1, lat2, lng2, hill, "low", true);
              drawpath(lat1, lng1, lat2, lng2, hill, "medium", true);
              drawpath(lat1, lng1, lat2, lng2, hill, "high", true);
            } else {
              drawpath(lat1, lng1, lat2, lng2, hill, safety, true);
            }
            
            map.panTo(new google.maps.LatLng((lat1+lat2)/2,(lng1+lng2)/2));
            
            if(mobile){
              $.mobile.pageLoading( true );
              $.mobile.changePage($('#map'),"slide");
            }
            
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
  for(var i in routes){
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
            alert("Bikesy is currently undergoing maintenance - please check back later.");
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
      var shadow = new google.maps.MarkerImage(
        "images/shadow.png",
        new google.maps.Size(32, 32)
      );
      var startIcon = new google.maps.MarkerImage(
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
      var shadow = new google.maps.MarkerImage(
        "images/shadow.png",
        new google.maps.Size(32, 32)
      );
      var endIcon = new google.maps.MarkerImage(
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
  if(mobile){
    $.mobile.pageLoading();	
  }
  if (typeof(start_marker) != "undefined"){
    var lat1 = start_marker.getPosition().lat();
    var lng1 = start_marker.getPosition().lng();
    var lat2 = end_marker.getPosition().lat();
    var lng2 = end_marker.getPosition().lng();
    distance = dist(lat1,lat2,lng1,lng2);
    var hill = $('#hills').val();
    var safety = $('#safety').val();
    
    if(checkBounds(lat1,lng1,lat2,lng2)){
    
      var sCoords = new google.maps.LatLng(lat1,lng1);
      var eCoords = new google.maps.LatLng(lat2,lng2);
      
      //Reverse Geocode
      switch(marker_name){
        case 'start':
          this.getAddress(sCoords, 'start');
          break;
        case 'end':
          this.getAddress(eCoords, 'end');
          break;
        case 'both':
          this.getAddress(sCoords, 'start');
          this.getAddress(eCoords, 'end');
          break;
      }
      
      //Remove old overlay
      if (typeof(routeoverlay) != "undefined"){routeoverlay.setMap(null);}
      
      // Draw 3 paths, one for each safety level for Desktop, draw only one for mobile
      if(!mobile){
        drawpath(lat1, lng1, lat2, lng2, hill, "low", true);
        drawpath(lat1, lng1, lat2, lng2, hill, "medium", true);
        drawpath(lat1, lng1, lat2, lng2, hill, "high", true);
      } else {
        drawpath(lat1, lng1, lat2, lng2, hill, safety, true);
      }
    }
    else{
      //Outside Bay Area
      if(mobile){
        $.mobile.pageLoading( false );
      }
      alert("Bikemapper currently only works in the Bay Area.");
    }
  }   
}

function gviz(profile, width, height){
  if (typeof(table) == "undefined"){
    var table = new google.visualization.DataTable();
    var chart = new google.visualization.ScatterChart(document.getElementById('profile'));
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
  var area = (width>400) ? {left: 80, width:(width-90)} : {left: 40, width:(width-50)};
  
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
  var geocoder = new google.maps.Geocoder();
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
  var sCoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': sCoords}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      $('#startbox').val(results[0].formatted_address.replace(/, CA, USA/g, ""));
    }
    $('.geolocationwaiting').fadeOut();
  });
}
  
function getEndGeoLocator(position) {
  var eCoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': eCoords}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      $('#finishbox').val(results[0].formatted_address.replace(/, CA, USA/g, ""));
    }
    $('.geolocationwaiting').fadeOut();
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