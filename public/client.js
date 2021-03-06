
// Additional JS functions here
window.fbAsyncInit = function() {
  FB.init({
    appId      : '1400334646854257', // App ID
    channelUrl : 'channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });

  // Additional init code here
  FB.Event.subscribe('auth.authResponseChange', function(response) {
    // Here we specify what we do with the response anytime this event occurs. 
    if (response.status === 'connected') {
      // The response object is returned with a status field that lets the app know the current
      // login status of the person. In this case, we're handling the situation where they 
      // have logged in to the app.
      fillLoggedInUser();
      window.accessToken = response.authResponse.accessToken;
      readyToGo(response);
    } else if (response.status === 'not_authorized') {
      // In this case, the person is logged into Facebook, but not into the app, so we call
      // FB.login() to prompt them to do so. 
      // In real-life usage, you wouldn't want to immediately prompt someone to login 
      // like this, for two reasons:
      // (1) JavaScript created popup windows are blocked by most browsers unless they 
      // result from direct interaction from people using the app (such as a mouse click)
      // (2) it is a bad experience to be continually prompted to login upon page load.
      FB.login(function (a) {}, { scope: 'create_event,offline_access' });
    } else {
      // In this case, the person is not logged into Facebook, so we call the login() 
      // function to prompt them to do so. Note that at this stage there is no indication
      // of whether they are logged into the app. If they aren't then they'll see the Login
      // dialog right after they log in to Facebook. 
      // The same caveats as above apply to the FB.login() call here.
      FB.login(function (a) {}, { scope: 'create_event,offline_access' });
    }
  }); 
};

$("#big-fb").click(function() {
    FB.login(function (a) {}, { scope: 'create_event,offline_access' });
});

function fillLoggedInUser() {
  $("#fb-button").hide();
  $("#not-logged-in").hide();
  $("#prof_image").show();
  $("#input-location").show();
  $("#button-location").show();
  $("#div-input-location-in").show();
  FB.api("/me?fields=picture,name", function(data) {
    $("#name").text(data.name);
    $("#prof_image").attr("src", data.picture.data.url);
    $("#logout").show();
  });
}

// Load the SDK asynchronously
(function(d){
   var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement('script'); js.id = id; js.async = true;
   js.src = "//connect.facebook.net/en_US/all.js";
   ref.parentNode.insertBefore(js, ref);
 }(document));

function readyToGoWithString(locationString) {
  var deferred = getLatLongFromPlace(locationString);
  $.when(deferred).done(function(data) {
    var position = {
      coords : {
        latitude : data.lat,
        longitude: data.lng
      } 
    };
    sendPositionAndFB(position, window.fbResponse);
  });
}

function readyToGo(fbResponse) {
  navigator.geolocation.getCurrentPosition(function (position) {
    window.fbResponse = fbResponse;
    var deferred = getPlaceFromLatLong(position.coords.latitude, position.coords.longitude);
    $.when(deferred).done(function(loc) { 
      window.locationString = loc;
      renderIntroGraph(loc); 
    });
  });
}

function sendPositionAndFB(position, fbResponse) {
  var data = {
    latitude: position.coords.latitude, 
    longitude: position.coords.longitude,
    fbResponse: fbResponse
  };
  $("#potato").show();
  $.ajax({
    type: "POST",
    url: "/places",
    data: JSON.stringify(data),
    success: displayThings,
    dataType: "json", 
    contentType: "application/json"
  });
}

function getPlaceFromLatLong(lat, lng) {
	var deferred = $.Deferred();
	var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&latlng=";
	url += lat + "," + lng;

	$.getJSON(url, function(data) {
		var city = undefined;
		var state = undefined;
		$.each(data.results[0].address_components, function(index, component) {
			if (component.types.indexOf("locality") >= 0) {
				city = component.short_name;
			} else if (component.types.indexOf("administrative_area_level_1") >= 0) {
				state = component.short_name;
			}
		});

		if (city && state)
			deferred.resolve(city +", "+ state);
		deferred.resolve("");
	});
  return deferred;
}

function getLatLongFromPlace(place) {
	var deferred = $.Deferred();
  var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=";
	url += place;

	$.getJSON(url, function(data) {
		deferred.resolve(data.results[0].geometry.location);
	});
  return deferred;
}
