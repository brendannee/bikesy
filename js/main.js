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
		/*$.getJSON("http://"+ self.routeserver+":8081/bounds?jsoncallback=?",
		        function(data){
		        	self.l_lat = data[1];
		        	self.h_lat = data[3];
		        	self.l_lng = data[0];
		        	self.h_lng = data[2];
		        });*/
		//Hard code map bounds
    	self.l_lat = 37.306399999999996;
       	self.h_lat = 38.316994299999998;
       	self.l_lng = -123.02877599999999;
       	self.h_lng = -121.637;
		
		//Detect saved route from URL
		if ($.getUrlVar('start')!=undefined && $.getUrlVar('end')!=undefined){
			$('#startbox').val($.getUrlVar('start').replace(/\+/g,' '));
			$('#finishbox').val($.getUrlVar('end').replace(/\+/g,' '));
			// Strip off trailing #
			if($.getUrlVar('hills')!=undefined) {
				$('#hills').val($.getUrlVar('hills').replace(/#/g,''));
			}
			self.submitForm($('form')[0]);
		}
		
		
		self.errorAlert=0;
		
		
	},
	
	bounds : function (lat1, lng1, lat2, lng2){
			if(lat1>self.h_lat||lat2>self.h_lat||lat1<self.l_lat||lat2<self.l_lat||lng1>self.h_lng||lng2>self.h_lng||lng1<self.l_lng||lng2<self.l_lng){return false;}
			else{return true;}

	},
	
	translatePorts : function (hills){
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
	},
	
	tooltips : function (){
			var self = Application;
			// select all desired input fields and attach tooltips to them 
			$("#inputs #startbox,#inputs #finishbox,#inputs #hills").tooltip({ 
			    // place tooltip on the right edge 
			    position: "center right", 

			    // a little tweaking of the position 
			    offset: [0, 10], 

			    // use the built-in fadeIn/fadeOut effect 
			    effect: "fade", 

			    // custom opacity setting 
			    opacity: 0.8, 

			    // use this single tooltip element 
			    tip: '.tooltip' 

			});

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
		var port = self.translatePorts(hills);
		
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
			var port = self.translatePorts(hills);
			
			
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
			
			//GEvent.addListener(start_marker,'mouseover',function(){self.showtweets(start_marker);});
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
	
	showRoute: function(routeno, click) {
		var self = Application;
		
		// Set the optional parameter if needed
	   if ( click === undefined ) {
	      click = "none";
	   }
		
		self.hideRoutes();
		
		switch(routeno){
			case 0:
				coloron="#c2403a";
				coloroff="#ed817e";
				safetyTitle = "Safe (more direct)";
				break;
			case 1:
				coloron="#fff600";
				coloroff="#ecf869";
				if (self.distance[1]>self.distance[0]) {
					lengthdif = Math.round((self.distance[1]-self.distance[0])*100)/100 + " miles longer";
				} else {
					lengthdif = Math.round((self.distance[0]-self.distance[1])*100)/100 + " miles shorter";
				}
				if (self.elevation[1]>self.elevation[0]) {
					elevdif = Math.round((self.elevation[1]-self.elevation[0])*100)/100 + " ft more climbing";
				} else {
					elevdif = Math.round((self.elevation[0]-self.elevation[1])*100)/100 + " ft less climbing";
				}
				safetyTitle = "Safer (some bike lanes, " + lengthdif + ", " +  elevdif + ")";
				break;
			case 2:
				coloron="#10dd00";
				coloroff="#90ff7a";
				if (self.distance[2]>self.distance[0]) {
					lengthdif = Math.round((self.distance[2]-self.distance[0])*100)/100 + " miles longer";
				} else {
					lengthdif = Math.round((self.distance[0]-self.distance[2])*100)/100 + " miles shorter";
				}
				if (self.elevation[2]>self.elevation[0]) {
					elevdif = Math.round((self.elevation[2]-self.elevation[0])*100)/100 + " ft more climbing";
				} else {
					elevdif = Math.round((self.elevation[0]-self.elevation[2])*100)/100 + " ft less climbing";
				}
				safetyTitle = "Safest (mostly bike lanes, " + lengthdif + ", " +  elevdif + ")";
				break;
		}
		
		if(click != "click"){
		// Add custom pane
			function ToolTipPane() {}
			ToolTipPane.prototype = new GControl;
			ToolTipPane.prototype.initialize = function(map) {
			  var me = this;
			  me.panel = document.createElement("div");
			  me.panel.className="tooltip";
			  me.panel.style.color = coloroff;
			  me.panel.style.width = "auto";
			  me.panel.style.display = "block";
		
			  me.panel.innerHTML = safetyTitle;
			  map.getContainer().appendChild(me.panel);
			  return me.panel;
			};

			ToolTipPane.prototype.getDefaultPosition = function() {
				var point=self.map.getCurrentMapType().getProjection().fromLatLngToPixel(self.map.getBounds().getSouthWest(),self.map.getZoom());
				var offset=self.map.getCurrentMapType().getProjection().fromLatLngToPixel(self.cursorpos,self.map.getZoom())
				return new GControlPosition(
				G_ANCHOR_BOTTOM_LEFT, new GSize(offset.x-point.x,point.y-offset.y));
			};

			ToolTipPane.prototype.getPanel = function() {
			  return me.panel;
			}
			self.safetytip = new ToolTipPane();
		
			self.map.addControl(self.safetytip);
			
		}
		
		// Show Route Line Stong Color
		$("#stats"+routeno).show();
		if (typeof(self.routelines[routeno]) != "undefined"){
			self.map.removeOverlay( self.routelines[routeno] );
			self.map.addOverlay( self.routelines[routeno+"on"] );
		}
		
		//Highlight Summary Box
		$("#summary"+routeno).css("background-color", coloron);
		$("#summary"+routeno).css("color", "#000");
		$("#summary"+routeno).css("border", "#333 solid 1px");
		
		//Show Profile
		if (typeof(self.profile[routeno]) != "undefined"){
			self.gviz(self.profile[routeno]);
		}

	},
	
	hideRoutes: function() {
		var self = Application;
		
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
			self.map.removeControl(self.safetytip);
			if (typeof(self.routelines[i+"on"]) != "undefined"){
				self.map.removeOverlay( self.routelines[i+"on"] );
				self.map.addOverlay( self.routelines[i] );
			}
			//Remove Highlight Route Choice Box
			$("#summary"+i).css("background-color", coloroff);
			$("#summary"+i).css("color", "#333");
			$("#summary"+i).css("border", "#ccc solid 1px");
		}
	},
	
	processpath: function(data, redraw, routeno){
		var self = Application;
		geometry = data[1];
		
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
		
		self.routelines[routeno+"on"] = GPolyline.fromEncoded( {points:geometry[0], 
     			 zoomFactor:32, 
                levels:geometry[1], 
                numLevels:4,
                color:coloron,
                opacity:0.4,
                weight:7} );

		self.routelines[routeno] = GPolyline.fromEncoded( {points:geometry[0], 
     			 zoomFactor:32, 
                levels:geometry[1], 
                numLevels:4,
                color:coloroff,
                opacity:0.4,
                weight:7} );
		
		// Center and Zoom only if its a redraw
		if(redraw == true){
			self.map.setZoom(self.map.getBoundsZoomLevel(self.routelines[routeno].getBounds()));
			self.map.panTo(self.routelines[routeno].getBounds().getCenter());
		
		}
		
		//Add Route Line
		self.map.addOverlay( self.routelines[routeno] );
		
		
		// Add listener to cursor position
		GEvent.addDomListener(self.map,'mousemove', 
		function(point){self.cursorpos=point;});
		
		// Add listener to route lines
		GEvent.addListener(self.routelines[routeno], "mouseover", function() { self.showRoute(routeno); });
		//GEvent.addListener(self.routelines[routeno], "mouseout", function() { self.hideRoutes(); });
		
		//icons for start and end		
		self.addMarker(new GLatLng(data[0][0][5][1],data[0][0][5][0]), "start");
		self.addMarker(self.routelines[routeno].getVertex(self.routelines[routeno].getVertexCount()-1), "end");
		
		//Clean Start and End Titles
		self.startName = $('#startbox').val().replace(/, USA/g, "");
		self.finishName = $('#finishbox').val().replace(/, USA/g, "");
		
		//Set Page Title
		document.title = self.startName+" to "+self.finishName+" | San Francisco Bay Area Bike Mapper";
		
		//Create Link URL
		linkURL = "http://511contracosta.org/bike/?start=" + $('#startbox').val() + "&end=" + $('#finishbox').val() + "&hills=" + $('#hills').val();
		
		//Add Permalink Control on top of map
		$("#permalink").show();
		$("#permalink").html("<a href='" + linkURL.replace(/ /g, "+") + "' title='Direct Link to this route'><img src='images/link.png'> Permalink to Route</a>");
		
		//Add Twitter Control on top of map
		$("#twitter").show();
		$("#twitter").html("<a href='http://www.addtoany.com/add_to/twitter?linkurl=" + escape(linkURL.replace(/\+/g, " ")) + "&linkname=Bike Route from " + escape(self.startName.replace(/ /g, "+")) + " to " + escape(self.finishName.replace(/ /g, "+")) + "&hills=" + $('#hills').val().replace(/ /g, "+") + "&linknote='><img src='images/twitter.png'> Tweet This</a>");					
		
		self.distance[routeno] = Math.round(self.routelines[routeno].getLength()/1609.344*10)/10;
		
		self.elevation[routeno] = Math.round(self.getElevGain(data[2]));
		
		//Add Trip Stats for Route		
		self.tripstats[routeno] = "<div class='title'>Directions to "+self.finishName+"</div>"; 
		
		self.tripstats[routeno] += "<div class='totaldistance'><img src='images/map.png'> Distance: <span style='color:#000;'>" + self.distance[routeno] + " miles</span></div>"; //figures are in meters
		self.tripsummary[routeno] = self.distance[routeno] + " miles";
		
		self.tripstats[routeno] += "<div class='time'><img src='images/time.png'> Time: <span style='color:#000;'>" + Math.round(self.distance[routeno]/0.166) + " to " + Math.round(self.distance[routeno]/0.125) + " min</span></div>";
		
		self.tripstats[routeno] += "<div class='elevGain'><img src='images/up.png'> Feet of Climbing: <span style='color:#000;'>"+ self.elevation[routeno] + " ft</span></div>";
		self.tripsummary[routeno] += "<br>" + self.elevation[routeno] + " ft";
		
		
		self.tripstats[routeno] += "<div class='elevChange'><img src='images/elevation.png'> Total Elevation Change: <span style='color:#000;'>"+ Math.round(self.getElevChange(data[2]))+ " ft</span></div>";
		
		//Narrative
		if (data[0][0][1] == 'nameless') {
			// If first point is "nameless" then skip to next point for start
			data[0].shift();
		}
		
		//Add End point to data
		data[0].push(new Array("Arrive at",self.finishName));
			
		//Clear out old narrative and start building new one
		self.tripstats[routeno]	+= "<div id='directions'><ol><li id='direction0' class='direction' title='Click to see this turn on map'>Head <strong>"+data[0][0][0].replace(/start /g, "")+"</strong> on <strong>"+data[0][0][1]+"</strong></li>";
		
		self.stoppoints = new Array();
		
		var len=data[0].length;
		for(var i=0; i<len; i++) {
			
			if(i>0){
			
				self.direction = self.proper(data[0][i][0]);
				self.street = data[0][i][1];
				
			
				// Skip Direction if next step's street name is "nameless" and direction is "Continue" and add distance to this step
				if (i<len-1) {
					if (data[0][i+1][1] == "nameless") {
						data[0][i+1][2] = 0;
						i++;
					}
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
					self.tripstats[routeno]	+= "<li id='direction"+routeno+i+"' class='direction' title='Click to see this turn on map'><strong>" + self.direction + "</strong> " + self.word + " <strong>" + self.street + "</strong></li>";
					
					//Create a marker for each turn except the last one
					if(i<(len-1)){
						self.stoppoints[i] = new GMarker(new GLatLng(data[0][i][5][1], data[0][i][5][0]));
						self.map.addOverlay(self.stoppoints[i]);
						self.stoppoints[i].hide();
					}
					
					//Set direction div click function to show marker when clicked
					$("#direction"+routeno+i).click(function(){
						self.showPoint(this.id.replace(/direction/g, ""));
					});
				}
			}	
		}
		
		$("#stats"+routeno).html(self.tripstats[routeno]);
		$("#stats"+routeno).hide();
		
		//Show Directions
		$("#resultsBox").fadeIn();
		$("#summary"+routeno+ " .info").html(self.tripsummary[routeno]);
		$("#summary").fadeIn();
		
		//Resize sidebar
		var newWindowHeight = $(window).height();
		var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
		$("#resultsBox").css("max-height", (newWindowHeight-sidebarTopHeight));
		
		// Create Elevation Profile
		self.profile[routeno] = data[2];
		
		//convert distance along route to miles
		for (i=0;i<self.profile[routeno].length;i++){self.profile[routeno][i][0]=self.profile[routeno][i][0]/1609.344;}
		for (i=0;i<self.profile[routeno].length;i++){self.profile[routeno][i][1]=self.profile[routeno][i][1]*3.2808399;}
								
		
		$('#loading_image').fadeOut(); // hide loading image
		
		if (self.showTips==true){ // Detect if we should show tips or not
			$("#dragtext").fadeIn(); //Show Drag Tip
		}
		
		$("#inputs #startbox").tooltip().hide(); //Hide entry tip
		$("#endpointtext").hide(); //Hide Initial Endpoint click Tip
		
		self.showRoute(1, "click");
	},
		
	drawpath: function(request, redraw, port){
		var self = Application;
		
		$('#welcome_screen').fadeOut(); // hide welcome screen if its still up
		
		$('#loading_image').show(); // show loading image, as request is about to start
		
		if (typeof(self.routelines) != "undefined"){
			for (var i=0; i< self.routelines.length; i++){
				if(self.routelines[i] != undefined) {
					self.routelines[i].remove();
				}	
			}
		}
		
		//Clear all points
		self.map.clearOverlays();
		self.googleBike();
		
		self.routelines = new Array();
		self.tripstats = new Array();
		self.tripsummary = new Array();
		self.distance = new Array();
		self.elevation = new Array();
		self.profile = new Array();
		
		$.jsonp({
			"url": "http://"+self.routeserver+":"+ port +"/path?"+request+"&jsoncallback=?",
		  "success": function(json) {self.processpath(json, redraw, 0);},
			"error": function(){
				//On error, try again
				$.jsonp({
					"url": "http://"+self.routeserver+":"+ port +"/path?"+request+"&jsoncallback=?",
			    "success": function(json) {self.processpath(json, redraw, 0);},
					"error": function(){
						$('#loading_image').hide(); // hide loading image
						if(self.errorAlert==0){
							alert("There was an error retrieving the route data.  Please refresh the page and try again.");
						}
						self.errorAlert = 1;
					}
				});
			}
		});	
		$.jsonp({
			"url": "http://"+self.routeserver+":"+ (port+3) +"/path?"+request+"&jsoncallback=?",
		  "success": function(json) {self.processpath(json, redraw, 1);},
			"error": function(){
					//On error, try again
					$.jsonp({
						"url": "http://"+self.routeserver+":"+ (port+3) +"/path?"+request+"&jsoncallback=?",
					  "success": function(json) {self.processpath(json, redraw, 1);},
						"error": function(){
							$('#loading_image').hide(); // hide loading image
							if(self.errorAlert==0){
								alert("There was an error retrieving the route data.  Please refresh the page and try again.");
							}
							self.errorAlert = 1;
						}
					});
				}
		});
		$.jsonp({
			"url": "http://"+self.routeserver+":"+ (port+6) +"/path?"+request+"&jsoncallback=?",
		  "success": function(json) {self.processpath(json, redraw, 2);},
			"error": function(){
					//On error, try again
					$.jsonp({
						"url": "http://"+self.routeserver+":"+ (port+6) +"/path?"+request+"&jsoncallback=?",
					  "success": function(json) {self.processpath(json, redraw, 2);},
						"error": function(){
							$('#loading_image').hide(); // hide loading image
							if(self.errorAlert==0){
								alert("There was an error retrieving the route data.  Please refresh the page and try again.");
							}
							self.errorAlert = 1;
						}
				});
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
		chart.draw(table, {width: windowwidth-305, height: 190, titleX: 'Distance along route (mi)', titleY: 'Elevation (ft)', legend: 'none', lineSize: 2, pointSize: 0, title: 'Elevation Profile', titleFontSize: 14, fontSize:18});
		
	},

    launchMap : function() { 
		var self = Application;
		self.map = new GMap2(document.getElementById("map_canvas"));
		self.map.setMapType(G_PHYSICAL_MAP);
		self.map.setCenter(new GLatLng(37.880002, -122.189941), 11);
		self.googleBike();
		self.map.setUIToDefault();
		self.addCreditsPane();
		
		$('#welcome_screen').fadeIn();
	
		GEvent.addListener(self.map, 'click', function(overlay,latlng){
			// Allow for clicking on the map to assign initial start points
			
			if (typeof(start_marker) == "undefined"){
				self.addMarker(latlng, "start");
				$("#inputs #startbox").tooltip().fadeOut();
				$("#endpointtext").fadeIn(); //Show Endpoint Tooltip
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
	},
	
	showtweets : function(m) {

	        api = 'TJzwp7XwDN';

	        var self = Application;
	        lat = m.getLatLng().lat()
	        lng = m.getLatLng().lng()
	        nhood_url = 'http://api.geoapi.com/v1/parents?lat=' + lat + '&lon=' + lng + '&apikey=' + api + "&jsoncallback=?";
	        $.getJSON(nhood_url,
	            function(data){
	                nhood = data.result.parents[0].meta.name;
	                guid = data.result.parents[0].guid;

	                $.getJSON("http://api.geoapi.com/v1/e/" + guid + "/view/weather?apikey=" + api + "&jsoncallback=?",    
	                    function(data){
	                        alert("Weather in " + nhood + " as of " + data.result[0].UpdateTime + ".  Daily Rain: " + data.result[0].DailyRain + " Temp: " + data.result[0].Temperature);
	                    });
	                //alert("Nhood: " + nhood);
	            });
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
			var sidebarTopHeight = parseInt($("#sidebar-top").height())+parseInt($("#summary").height())+parseInt($("#resultsBox").css("margin-top"))+parseInt($("#resultsBox").css("margin-bottom"));
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

		$('#summary0').hover(function(){
			Application.showRoute(0, "click");
		});
	
		$('#summary1').hover(function(){
			Application.showRoute(1, "click");
		});
	
		$('#summary2').hover(function(){
			Application.showRoute(2, "click");
		});

		$('#swap').click(function(){
			Application.swapAddress();
	   });

	});

	$(Application.init);
	
});