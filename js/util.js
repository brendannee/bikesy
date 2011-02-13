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