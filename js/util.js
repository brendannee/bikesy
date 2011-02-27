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

function translatePorts(hills){
  var i=0;
  switch(hills){
    case "low":
      i = i+1;
      break;
    case "medium":
      i = i+2;
      break;
    case "high":
      i = i+3;
      break;
    default:
      i = i+2;
  }
  return i+8080;
  alert(i+8080);
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
    routelines[i] = new google.maps.Polyline();
    // Add listener to route lines
    new google.maps.event.addListener(routelines[i], "mouseover", function() { showRoute(i); });
  }
}

function submitForm() {
  // Redraws map based on info in the form
  start = $('#startbox').val();
  end = $('#finishbox').val();
  hills = $('#hills').val();
  var port = translatePorts(hills);

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
  var slat;
  var slng;
  var elat;
  var elng;
  geocoder.geocode({address:start}, function(results, status){
    if (status == google.maps.GeocoderStatus.OK) {
      slat = results[0].geometry.location.lat();
      slng = results[0].geometry.location.lng();
      //Now geocode end address
      geocoder.geocode({address:end}, function(results, status){
        if (status == google.maps.GeocoderStatus.OK) {
          elat = results[0].geometry.location.lat();
          elng = results[0].geometry.location.lng();
          //Now move along
          if(checkBounds(slat,slng,elat,elng)){
            drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, true, port);
            map.panTo(new google.maps.LatLng((slat+elat)/2,(slng+elng)/2));
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
    slat = start_marker.getPosition().lat();
    slng = start_marker.getPosition().lng();
    elat = end_marker.getPosition().lat();
    elng = end_marker.getPosition().lng();
    distance = dist(slat,elat,slng,elng);
    var hills = $('#hills').val();
    var port = translatePorts(hills);
    
    if(checkBounds(slat,slng,elat,elng)){
    
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
      $('#geolocationwaiting').fadeOut();
      $('#startbox').val(results[0].formatted_address).replace(/, CA, USA/g, "");;
    }
  });
}
  
function getEndGeoLocator(position) {
  eCoords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  geocoder = new google.maps.Geocoder();
  geocoder.geocode({'latLng': eCoords}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      $('#geolocationwaiting').fadeOut();
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