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

function bounds(lat1, lng1, lat2, lng2){
  if(lat1>h_lat || lat2>h_lat || lat1<l_lat || lat2<l_lat || lng1>h_lng || lng2>h_lng || lng1<l_lng || lng2<l_lng){
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

  geoCoder = new GClientGeocoder();
  var slat;
  var slng;
  var elat;
  var elng;
  geoCoder.getLatLng(start,
    function(coord){
      if(!coord){
         alert(start + " not found");
      } else {
        slat = coord.lat();
        slng = coord.lng();
    
        geoCoder.getLatLng(end,
          function(coord){
            if(!coord){
               alert(end + " not found");
            } else {
              elat = coord.lat();
              elng = coord.lng();
              if(bounds(slat,slng,elat,elng)){
                drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, true, port);
                map.panTo(new GLatLng((slat+elat)/2,(slng+elng)/2));
              } else {
                if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
                alert("Bikemapper currently only works in the Bay Area.  Try making your addresses more specific by adding city and state names.");
              }
            }
          }
        );
      }
    }
  );
return false;
}

function drawpath(request, redraw, port){
  $('#welcome_screen').fadeOut(); // hide welcome screen if its still up
  $('#loading_image').show(); // show loading image, as request is about to start
  
  //Clear all points
  map.clearOverlays();
  googleBike();
  routelines = [];
  
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
  
function googleBike(){
  // Load Google Bike Layer
  var gBikeTileUrlTemplate = 'http://mt1.google.com/vt/lyrs=m@121,bike&hl=en&x={X}&y={Y}&z={Z}';
  var tileLayerOverlay = new GTileLayerOverlay(
    new GTileLayer(null, null, null, 
      {
        tileUrlTemplate: gBikeTileUrlTemplate,
        isPng:true,
        opacity:0.8
      }
    )
  );
  map.addOverlay(tileLayerOverlay);  
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
  if (latlng) {
    geoCoder = new GClientGeocoder();
    if(marker_name=='start'){
      geoCoder.getLocations(latlng, this.updateSAddress);
    } else if(marker_name=='end'){
      geoCoder.getLocations(latlng, this.updateEAddress);
    }
  }
}

function updateSAddress(response) {
  if (!response || response.Status.code != 200) {
  } else {
    place = response.Placemark[0];
  $('#startbox').val(place.address);
  }
}

function updateEAddress(response) {
  if (!response || response.Status.code != 200) {
  } else {
    place = response.Placemark[0];
  $('#finishbox').val(place.address);
  }
}

function getStartGeoLocator(position) {
  sCoords = new GLatLng(position.coords.latitude,position.coords.longitude);
  geoCoder = new GClientGeocoder();
  geoCoder.getLocations(sCoords, function(response) {place = response.Placemark[0]; $('#startbox').val(place.address);});
}
  
function getEndGeoLocator(position) {
  eCoords = new GLatLng(position.coords.latitude,position.coords.longitude);
  geoCoder = new GClientGeocoder();
  geoCoder.getLocations(eCoords, function(response) {place = response.Placemark[0]; $('#finishbox').val(place.address);});
}
  
function showGeoLocatorError(error){
  if(error.code==1){
    alert("To determine your current location you must click \"Share Location\" in the top bar in your browser.");
  } else if (error.code==2 || error.code==3 || error.code==0){
    alert("Your current location couldn't be determined.  Please enter the start and end locations manually.");
  } 
}