<!DOCTYPE html "-//W3C//DTD XHTML 1.0 Strict//EN" 
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd    ">

<html xmlns="http://www.w3.org/1999/xhtml">
  <head><meta http-equiv="content-type" content="text/html; charset=utf-8"/>
	<meta http-equiv="X-UA-Compatible" content="chrome=1">
	
	<title>San Francisco Bay Area Bike Mapper</title>
	<link rel="stylesheet" type="text/css" href="css/style.css" media="print,screen" />

	<meta name="description" content="Find Your Way Around Contra Costa County by Bike.  Avoid Hills." />
	<meta name="keywords" content="biking, maps, bicycles, Contra Costa, California, Hills, trip planner" />
  </head>
  <body onunload="GUnload()">
	
	<div id="content">
		<div id="sidebar">
			<div id="sidebar-top">
				<h1 class="logo"><a href="http://511contracosta.org/bike/">511 Contra Costa Bike Mapper</a></h1>
			
				<div class="tooltip"></div>
				<form id="inputs" onsubmit="$(Application.launch(this)); return false;" style="margin:0;" method="post" action=""> <!-- note workaround: return false to not reload page -->
					<ul class="input_boxes">
						<li><img src="images/green.png" alt="Origin" style="height:24px;width:24px;" /> <span class="origin">Origin</span><br /><input id="startbox" name="startbox" type="text" class="textbox" value="Concord, CA"  title="Enter your starting address, city, zip or intersection here" /></li>
						<li id="slocation" class="location"><img src="images/geolocation.jpg" alt="GeoLocation" style="height:24px;width:24px;" /><a href="#" onclick="navigator.geolocation.getCurrentPosition(Application.getStartGeoLocator,Application.showGeoLocatorError);">Use Current Location</a></li>
						<li><img src="images/red.png" alt="Destination" style="height:24px;width:24px;" /> <span class="destination">Destination</span><br /><input id="finishbox" name="finishbox" type="text"  class="textbox" value="Walnut Creek, CA"  title="Enter your ending address, city, zip or intersection here"/></li>
						<li id="elocation" class="location"><img src="images/geolocation.jpg" alt="GeoLocation" style="height:24px;width:24px;" /><a href="#" onclick="navigator.geolocation.getCurrentPosition(Application.getEndGeoLocator,Application.showGeoLocatorError);">Use Current Location</a></li>
						<li><img src="images/hill.png" alt="Hils" style="height:24px;width:24px;" /> Hills?
						<select id="tolerancebox" name="tolerancebox">
							<option value="80" selected="selected">Bike Mapper 1</option>
							<option value="81">Bike Mapper 2</option>
						</select>
						</li>
						<li><input id="submit" type="image" value="submit" src="images/mapit.png" title="Map It" /></li>
					</ul>
				</form>
				<div id="stats"></div>
				<div id="link"></div>
			</div>
			<div id="directions"></div>
			
		</div>
		<div id="map_wrapper">
			<div id="map_canvas"></div>
			<div id="loading_image" class="popup"><img src="images/ajax-loader.gif" alt="Loading..." /><p>Loading...</p></div>
			<div id="dragtext" class="popup">Drag and drop icons to recalculate route<a href="#" onclick="$('#dragtext').hide();Application.showTips=false;"><img src="images/close.png" class="close" alt="close" title="Hide" /></a></div>
		</div>
		<div id="profile" title="Elevation Profile"></div>
		<div id="bottomCredits">Sponsored by <a href='http://511contracosta.org' title='Visit 511ContraCosta.org'>511 Contra Costa</a> &nbsp; Site by <a href='http://blnktag.com' title='BlinkTag Inc'>BlinkTag Inc</a></div>
	</div>

	<div id="placeholder"></div>
	
	<script type="text/javascript" src="http://www.google.com/jsapi?key=ABQIAAAAJAlMRialWQ4KYd2WXlcPxBT25onlXAE6q_n5i3QEa4nBM4-0UBS2m41_UyIFEBvYM4X_Q-dkdnPBcg"></script>
	
	<script type="text/javascript">
		google.load('visualization', '1', {packages:['imagelinechart']});
		google.load("maps", "2.x",{"other_params":"sensor=false"});
	</script>
	
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js" type="text/javascript" charset="utf-8"></script>
  <script src="js/jquery.tools.min.js" type="text/javascript" charset="utf-8"></script>
  <script src="js/main.js" type="text/javascript" charset="utf-8"></script>
 
  </body>
  
</html>