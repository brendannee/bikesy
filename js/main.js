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


Application = function() {
	
  return {
    init : function() {
	 var self = Application;
	
	 self.showTips = true; // Show Tooltips by default
	
	 // Define Route Server
	 self.routeserver = "ec2-184-73-96-123.compute-1.amazonaws.com";
	
	 self.tooltips();
	 if (navigator.geolocation) {  
	 	self.addGeoLocator();
	 }
	
      if (GBrowserIsCompatible()) {self.launchMap();}
		
		//Get Bounds From Route Server	
		$.getJSON("http://"+ self.routeserver+":8081/bounds?jsoncallback=?",
		        function(data){
		        	self.l_lat = data[1];
		        	self.h_lat = data[3];
		        	self.l_lng = data[0];
		        	self.h_lng = data[2];
		        });
		
		/*l_lat = 37.201897600000002;
       	h_lat = 38.501967;
       	l_lng = -122.7310167;
       	h_lng = -121.5197762;*/
		
		//Detect saved route from URL
		if ($.getUrlVar('start')!=undefined && $.getUrlVar('end')!=undefined){
			$('#startbox').val($.getUrlVar('start').replace(/\+/g,' '));
			$('#finishbox').val($.getUrlVar('end').replace(/\+/g,' '));
			// Strip off trailing #
			if($.getUrlVar('hills')!=undefined) {
				$('#hills').val($.getUrlVar('hills').replace(/#/g,''));
			}
			if($.getUrlVar('safety')!=undefined) {
				$('#safety').val($.getUrlVar('safety').replace(/#/g,''));
			}
			self.submitForm($('form')[0]);
		}
		
		
	},
	
	bounds : function (lat1, lng1, lat2, lng2){
			if(lat1>self.h_lat||lat2>self.h_lat||lat1<self.l_lat||lat2<self.l_lat||lng1>self.h_lng||lng2>self.h_lng||lng1<self.l_lng||lng2<self.l_lng){return false;}
			else{return true;}

	},
	
	translatePorts : function (hills,safety){
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
		switch(safety){
			case "low":
				i = i+0;
				break;
			case "medium":
				i = i+3;
				break;
			case "high":
				i = i+6;
				break;
			default:
				i = i+3;
		}
		return i+8080;
		alert(i+8080);
	},
	
	tooltips : function (){
			var self = Application;
			// select all desired input fields and attach tooltips to them 
			$("#inputs #startbox,#inputs #finishbox").tooltip({ 
			    // place tooltip on the right edge 
			    position: "center right", 

			    // a little tweaking of the position 
			    offset: [-2, 2], 

			    // use the built-in fadeIn/fadeOut effect 
			    effect: "fade", 

			    // custom opacity setting 
			    opacity: 0.7, 

			    // use this single tooltip element 
			    tip: '.tooltip' 

			});

			// Show Starting tooltip on page load
			$("#inputs #startbox").tooltip().show();
			
	},
	
	
	dist : function(lat1,lat2,lon1,lon2) {
	
		var R = 6371; // km
		var dLat = (lat2-lat1)*3.14/180;
		var dLon = (lon2-lon1)*3.14/180; 
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*3.14/180) * Math.cos(lat2*3.14/180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var d = R * c;
		return d*.62;  //mi
	},
	
	
	submitForm : function(form) {
		// Redraws map based on info in the form
		
		var self = Application;
		
		start = form.startbox.value;
		end = form.finishbox.value;
		hills = form.hills.value;
		safety = form.safety.value;
		var port = self.translatePorts(hills,safety);
		
		//Search for Richmond, if found add usa to end to avoid confusion with Canada
		if (start.search(/richmond/i) != -1) {
			start = form.startbox.value+", usa";
		}
		if (end.search(/richmond/i) != -1) {
			end = form.finishbox.value+", usa";
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
				
								if(form.startbox.value==''){
									alert("Please Enter a Starting Address");
								} else if(form.finishbox.value==''){
									alert("Please Enter an Ending Address");
								} else if(self.bounds(slat,slng,elat,elng)){
					
							      	self.drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, true, port);
									self.map.panTo(new GLatLng((slat+elat)/2,(slng+elng)/2));}
	
								else{
									if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
									alert("Bikemapper currently only works in the Bay Area.  Try making your addresses more specific by adding city and state names.");
								}
							}
						}
					);
				}
			}
		);
	},
	
	getElevGain : function(profile) {
		var totalElevGain = 0;
		for (i=0;i<(profile.length-1);i++){
			if (profile[i][1] < profile[i+1][1]) {
				totalElevGain += profile[i+1][1]-profile[i][1];
			}
		}
		//Convert to Feet
		return totalElevGain*3.2808399;
	},
	
	getElevChange : function(profile) {
		var totalElevChange = profile[profile.length-1][1] - profile[0][1];
		//Convert to Feet
		return totalElevChange*3.2808399;
	},
	
	getAddresses : function(slatlng, elatlng) {
	  if (slatlng != null && elatlng != null) {
		geoCoder = new GClientGeocoder();
		geoCoder.getLocations(slatlng, this.updateSAddress);
		geoCoder.getLocations(elatlng, this.updateEAddress);
	  }
	},

	updateSAddress : function(response) {
	  if (!response || response.Status.code != 200) {
	  } else {
	    place = response.Placemark[0];
		$('#startbox').val(place.address);
	  }
	},

	updateEAddress : function(response) {
	  if (!response || response.Status.code != 200) {
	  } else {
	    place = response.Placemark[0];
		$('#finishbox').val(place.address);
	  }
	},
	
	recalc : function() {
		if (typeof(start_marker) != "undefined"){
			var self = Application;
			slat = start_marker.getLatLng().lat();
			slng = start_marker.getLatLng().lng();
			elat = end_marker.getLatLng().lat();
			elng = end_marker.getLatLng().lng();
			distance = self.dist(slat,elat,slng,elng);
			var hills = $('#hills').val();
			var safety = $('#safety').val();
			var port = self.translatePorts(hills,safety);
			
			
			if(self.bounds(slat,slng,elat,elng)){
			
				sCoords = new GLatLng(slat,slng);
				eCoords = new GLatLng(elat,elng);
				
				//Reverse Geocode
				this.getAddresses(sCoords,eCoords);
				
				//Remove old overlay
				if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
				
				//Draw new route
				self.drawpath("lat1="+slat+"&lng1="+slng+"&lat2="+elat+"&lng2="+elng, false, port);
			
			}
			else{
				if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
				alert("Bikemapper currently only works in the Bay Area.");}
		}
		else {alert("Please search once using input boxes.");}
				
	},
	
	showPoint: function(i){
		var self = Application;
		
		// First, hide all stop points
		for (var j=0; j<(self.stoppoints.length+1); j++) { 
		  if (self.stoppoints[j] != undefined) {
		    self.stoppoints[j].hide(); 
		  }
		$("#direction"+j).css('background-color','inherit');
		}
		
		//Show desired stop point
		if (self.stoppoints[i] != undefined) {
			self.stoppoints[i].show();
		}
		$("#direction"+i).css('background-color','#d1d1d1');
	},
	
	addMarker: function(latlng, type){
		var self = Application;
		
		if(type=="start"){
			if (typeof(start_marker) != "undefined"){start_marker.remove();}
		
			startIcon = new GIcon(G_DEFAULT_ICON);
			startIcon.image = "images/green.png";
			startIcon.iconAnchor = new GPoint(16, 32);
			startIcon.iconSize = new GSize(32, 32);
		
			start_marker = new GMarker(latlng,{draggable: true, icon:startIcon});
			self.map.addOverlay(start_marker);
			GEvent.addListener(start_marker,'dragend',function(position){self.recalc();});
		} else if (type=="end"){
			if (typeof(end_marker) != "undefined"){end_marker.remove();}
			
			endIcon = new GIcon(G_DEFAULT_ICON);
			endIcon.image = "images/red.png";
			endIcon.iconAnchor = new GPoint(16, 32);
			endIcon.iconSize = new GSize(32, 32);
			
			end_marker = new GMarker(latlng,{draggable: true, icon:endIcon});
			self.map.addOverlay(end_marker);
			GEvent.addListener(end_marker,'dragend',function(position){self.recalc();});
		}
	},
	
	processpath: function(data, redraw){
		var self = Application;
		geometry = data[1];
		if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}
		
		routeoverlay = GPolyline.fromEncoded( {points:geometry[0], 
     			 zoomFactor:32, 
                levels:geometry[1], 
                numLevels:4,
                color:"004efe",
                opacity:0.6,
                weight:7} );
		self.map.addOverlay( routeoverlay );
		
		// Center and Zoom only if its a redraw
		if(redraw == true){
			self.map.setZoom(self.map.getBoundsZoomLevel(routeoverlay.getBounds()));
			self.map.panTo(routeoverlay.getBounds().getCenter());
			
			//Clear all points
			self.map.clearOverlays();
			self.googleBike();
		}
		
		//icons for start and end		
		self.addMarker(new GLatLng(data[0][0][5][1],data[0][0][5][0]), "start");
		self.addMarker(routeoverlay.getVertex(routeoverlay.getVertexCount()-1), "end");
		
		//Clean Start and End Titles
		self.startName = $('#startbox').val().replace(/, USA/g, "");
		self.finishName = $('#finishbox').val().replace(/, USA/g, "");
		
		//Set Page Title
		document.title = self.startName+" to "+self.finishName+" | San Francisco Bay Area Bike Mapper";
		
		//Add Trip Stats			
		tripstats = "<div class='title'>Directions to "+self.finishName+"</div>"; 
		
		tripstats += "<div class='totaldistance'><img src='images/map.png'> Distance: <span style='color:#000;'>" + Math.round(routeoverlay.getLength()/1609.344*10)/10 + " miles</span></div>"; //figures are in meters
		
		tripstats += "<div class='time'><img src='images/time.png'> Time: <span style='color:#000;'>" + Math.round((routeoverlay.getLength()/1609.344)/0.166) + " to " + Math.round((routeoverlay.getLength()/1609.344)/0.125) + " min</span></div>";
		
		tripstats += "<div class='elevGain'><img src='images/up.png'> Feet of Climbing: <span style='color:#000;'>"+ Math.round(self.getElevGain(data[2]))+ " ft</span></div>";
		
		tripstats += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span style='color:#000;'>"+ Math.round(self.getElevChange(data[2]))+ " ft</span></div>";
		
		$("#stats").html(tripstats);
		
		//Create Link URL
		linkURL = "?start=" + $('#startbox').val().replace(/ /g, "+") + "&end=" + $('#finishbox').val().replace(/ /g, "+") + "&hills=" + $('#hills').val().replace(/ /g, "+") + "&safety=" + $('#safety').val().replace(/ /g, "+");
		
		//Add Permalink Control on top of map
		$("#permalink").show();
		$("#permalink").html("<a href='" + linkURL + "' title='Direct Link to this route'><img src='images/link.png'> Permalink to Route</a>");
		
		//Add Twitter Control on top of map
		$("#twitter").show();
		$("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + linkURL + "&linkname=Bike Route from " + self.startName.replace(/ /g, "+") + " to " + self.finishName.replace(/ /g, "+") + "&hills=" + $('#hills').val().replace(/ /g, "+") + "&safety=" + $('#safety').val().replace(/ /g, "+") + "&linknote='><img src='images/twitter.png'> Tweet This</a>");					

		//Narrative
		if (data[0][0][1] == 'nameless') {
			// If first point is "nameless" then skip to next point for start
			data[0].shift();
		}
		
		//Add End point to data
		data[0].push(new Array("Arrive at",self.finishName));
			
		//Clear out old narrative and start building new one
		$("#directions ol").html("<li id='direction0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>");
		
		self.stoppoints = new Array();
		
		var len=data[0].length;
		for(var i=0; i<len; i++) {
			
			if(i>0){
			
				self.direction = self.proper(data[0][i][0]);
				self.street = data[0][i][1];
				self.distance = data[0][i][2];
			
				// Skip Direction if next step's street name is "nameless" and direction is "Continue" and add distance to this step
				if (i<len-1) {
					if (data[0][i+1][1] == "nameless") {
						self.distance = data[0][i][2] + data[0][i+1][2];
						data[0][i+1][2] = 0;
						i++;
					}
				}
			
				// Choose best units for display
				if (Math.round(self.distance) > 100) {
					self.distance = Math.round(self.distance/1609.344*10)/10 + " miles";
				} else {
					self.distance = Math.round(self.distance*3.2808)+ " ft";
				}
				
				//If street is nameless, remove it
				if (self.street != 'nameless') {
					// Choose best term for direction
					if (self.direction == "Continue"){
						self.word = 'on';
					} else if (self.direction == "Arrive at"){
						self.word = '';
					} else {
						self.word = 'onto';
					}
					$("#directions ol").append("<li id='direction"+i+"' class='direction' title='Click to see this turn on map'><strong>" + self.direction + "</strong> " + self.word + " <strong>" + self.street + "</strong></li>");
					
					//Create a marker for each turn except the last one
					if(i<(len-1)){
						self.stoppoints[i] = new GMarker(new GLatLng(data[0][i][5][1], data[0][i][5][0]));
						self.map.addOverlay(self.stoppoints[i]);
						self.stoppoints[i].hide();
					}
					
					//Set direction div click function to show marker when clicked
					$("#direction"+i).click(function(){
						self.showPoint(this.id.replace(/direction/g, ""));
					});
				}
			}	
		}
		
		//Show Directions
		$("#directions").show();
		
		//Resize sidebar
		var newWindowHeight = $(window).height();
		var sidebarTopHeight = parseInt($("#sidebar-top").css("height"));
		$("#directions").css("height", (newWindowHeight-sidebarTopHeight-parseInt($("#directions").css("border-top-width").replace(/px/g,""))));
		
		// Create Elevation Profile
		profile = data[2];
		
		//convert distance along route to miles
		for (i=0;i<profile.length;i++){profile[i][0]=profile[i][0]/1609.344;}
		for (i=0;i<profile.length;i++){profile[i][1]=profile[i][1]*3.2808399;}
							
		self.gviz(profile);		
		
		$('#loading_image').hide(); // hide loading image
		
		if (self.showTips==true){ // Detect if we should show tips or not
			$("#dragtext").show(); //Show Drag Tip
		}
		
		$("#inputs #startbox").tooltip().hide(); //Hide entry tip
		$("#endpointtext").hide(); //Hide Initial Endpoint click Tip
	},
		
	drawpath: function(request, redraw, port){
		var self = Application;
		
		$('#loading_image').show(); // show loading image, as request is about to start
	
		if (typeof(routeoverlay) != "undefined"){routeoverlay.remove();}	
		
		$.jsonp({
			"url": "http://"+self.routeserver+":"+port+"/path?"+request+"&jsoncallback=?",
		    "success": function(json, redraw) {self.processpath(json, redraw);},
			"error": function(){
				$('#loading_image').hide(); // hide loading image
				alert("There was an error retrieving the route data.  Please refresh the page and try again.");
			}
		});	
		
	},
	
	gviz: function(profile){
		
		var self = Application;
		
		if (typeof(table) == "undefined"){
			table = new google.visualization.DataTable();
			chart = new google.visualization.ScatterChart(document.getElementById('profile'));
		}
		
		else{
			table.removeColumn(0);
			table.removeColumn(0);
		}
		
		table.addColumn('number', 'Distance');
      	table.addColumn('number', 'Elevation');
      	table.addRows(profile);
		var windowwidth = window.innerWidth;
		chart.draw(table, {width: windowwidth-305, height: 190, titleX: 'Distance along route (mi)', titleY: 'Elevation (ft)', legend: 'none', lineSize: 2, pointSize: 0});
		
	},

    launchMap : function() { 
		var self = Application;
		self.map = new GMap2(document.getElementById("map_canvas"));
		self.map.setMapType(G_PHYSICAL_MAP);
		self.map.setCenter(new GLatLng(37.880002, -122.189941), 11);
		self.googleBike();
		self.map.setUIToDefault();
		self.addCreditsPane();
	
		GEvent.addListener(self.map, 'click', function(overlay,latlng){
			// Allow for clicking on the map to assign initial start points
			
			if (typeof(start_marker) == "undefined"){
				self.addMarker(latlng, "start");
				$("#inputs #startbox").tooltip().hide();
				$("#endpointtext").show(); //Show Endpoint Tooltip
			} else if (typeof(start_marker) != "undefined" && typeof(end_marker) == "undefined"){
				self.addMarker(latlng, "end");
				self.recalc();
			}
		});
    },

	googleBike : function (){
		var self = Application;
		// Load Google Bike Layer
		var gBikeTileUrlTemplate = 'http://mt1.google.com/vt/lyrs=m@121,bike&hl=en&x={X}&y={Y}&z={Z}';
		var tileLayerOverlay = new GTileLayerOverlay(
		new GTileLayer(null, null, null, {
		tileUrlTemplate: gBikeTileUrlTemplate,
		isPng:true,
		opacity:0.8
		})
		);
		self.map.addOverlay(tileLayerOverlay);	
	},

	addCreditsPane : function(){
		var self = Application;
		// Add custom pane
		function CreditsPane() {}
		CreditsPane.prototype = new GControl;
		CreditsPane.prototype.initialize = function(map) {
		  var me = this;
		  me.panel = document.createElement("div");
		  me.panel.style.width = "400px";
		  me.panel.style.height = "15px";
		
		  me.panel.innerHTML = "Sponsored by <a href='http://511contracosta.org'  title='Visit 511ContraCosta.org'>511 Contra Costa</a> &nbsp; Site by <a href='http://blnktag.com' title='BlinkTag Inc'>BlinkTag Inc</a>";
		  map.getContainer().appendChild(me.panel);
		  return me.panel;
		};

		CreditsPane.prototype.getDefaultPosition = function() {
		  return new GControlPosition(
		      G_ANCHOR_BOTTOM_LEFT, new GSize(180, 0));
		};

		CreditsPane.prototype.getPanel = function() {
		  return me.panel;
		}
		self.map.addControl(new CreditsPane());
	},
	
	addGeoLocator : function(){
		// Show GeoLocation Options
		$("#slocation").show();
		$("#elocation").show();
	},

	getStartGeoLocator : function(position) {
		sCoords = new GLatLng(position.coords.latitude,position.coords.longitude);
		geoCoder = new GClientGeocoder();
		geoCoder.getLocations(sCoords, function(response) {place = response.Placemark[0]; $('#startbox').val(place.address);});
	},
	
	getEndGeoLocator : function(position) {
		eCoords = new GLatLng(position.coords.latitude,position.coords.longitude);
		geoCoder = new GClientGeocoder();
		geoCoder.getLocations(eCoords, function(response) {place = response.Placemark[0]; $('#finishbox').val(place.address);});
	},
    
    proper : function (str){
    	return str.replace(/\w\S*/, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	},
	
	showGeoLocatorError : function(error){
		if(error.code==1){
			alert("To determine your current location you must click \"Share Location\" in the top bar in your browser.");
		} else if (error.code==2 || error.code==3 || error.code==0){
				alert("Your current location couldn't be determined.  Please enter the start and end locations manually.");
		}
		
	},
	
	swapAddress : function(){
		var self = Application;
		var Saddress = $('#startbox').val();
		var Eaddress = $('#finishbox').val();
		$('#startbox').val(Eaddress);
		$('#finishbox').val(Saddress);
		self.submitForm($('form')[0]);
	}
  };

}();

google.load('visualization', '1', {packages:['scatterchart']});
google.setOnLoadCallback(function(){
	
	$(document).ready(function(){
		resizeWindow();
		//If the User resizes the window, adjust the #container height
		$(window).bind("resize", resizeWindow);
		function resizeWindow( e ) {
			var newWindowHeight = $(window).height();
			var sidebarTopHeight = parseInt($("#sidebar-top").css("height"));
			$("#sidebar").css("height", (newWindowHeight) );
			$("#sidebar").css("max-height", (newWindowHeight) );
			$("#directions").css("height", (newWindowHeight-sidebarTopHeight-parseInt($("#directions").css("border-top-width").replace(/px/g,""))));
			$("#map_canvas").css("height", (newWindowHeight-195) );
			$("#loading_image").css("top", ((newWindowHeight-195)/2) );
		}
		
		$('#hideProfile').click(function(){
       		$('#profile').slideToggle('fast');
			$("#map_wrapper").css("height", $(window).height() );
			$("#map_canvas").css("height", $(window).height() );
			$('#showProfile').show();
	       	return false;
       });

		$('#showProfile').click(function(){
       		$('#profile').show();
			$("#map_wrapper").css("height", ($(window).height()-195) );
			$("#map_canvas").css("height", ($(window).height()-195) );
			$('#showProfile').hide();
	       	return false;
       });

		$('#swap').click(function(){
			Application.swapAddress();
	   });

	});
	
	$(Application.init);

});