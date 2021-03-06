/**
 * phonegap specific code
 *
 **/

var now = new Date();
var _gmtServer = now.getUTCFullYear() + '/' + (now.getUTCMonth()+1) + '/' + now.getUTCDate() + '/' + now.getUTCHours() + '/' + now.getUTCMinutes() + '/' + now.getUTCSeconds();

if (!window.plugins) {
	window.plugins = {};
}

var onSuccess = function(){console.log('1',arguments);};
var onError = function(){console.log('0',arguments);};


var login = function() {
	FB.login(status, {scope: 'email'});
};

// if the app user isnt logged or this is the first time the app is loaded, hide the main stuff
if (!localStorage.loggedIn) {
	var els = document.getElementsByClassName('loggedout-hideable');
	for (var x in els) {
		//els[x].style.display = 'none';
	}

}


$(function() {
	document.addEventListener('deviceready', function() {

		// check for needed plugins
		if (!navigator || !navigator.connection) {
			console.error('Failed to load connection information plugin.');
		}

		if (!navigator || !navigator.splashscreen) {
			console.error('Failed to load splashscreen plugin.');
		}

		if (!window.device) {
			console.error('Failed to load device plugin.');
		}

		if (!window.appAvailability) {
			console.error('Failed to load appAvailability plugin.');
		}

		// if they are logged in, they are going straight to the restaurant page
		if (localStorage.loggedIn) {
			navigator.splashscreen.hide();
		}


		if( navigator && navigator.Sysinfo && navigator.Sysinfo.getInfo ){
			navigator.Sysinfo.getInfo( function( info ){
				if( info && info.cpuInfo && info.cpuInfo.mhz ){
					var mhz = parseInt( info.cpuInfo.mhz );
					// 3d menu effects slow on older devices #3106
					if( mhz <= 1200 || !App.isVersionCompatible( '2', window.device.version ) ){
						App.useTransform = false;
						console.log('navigator.Sysinfo.getInfo: ' + mhz );
					}
				}
			} );
		}

		// prevent android back
		document.addEventListener('backbutton', function (e) {
			e.preventDefault();
		}, false );

		//gamecenter.auth( onSuccess, onError );
		App.version = 'cordova';

		if (!App.minimalMode) {
			cordova.getAppVersion.getVersionNumber(function(version) {
				App.version = response;
			});
		}

		// Disable paralax for android old versions - #3105
		if( App.isAndroid() ){
			var version;
			if( window && window.device && window.device.version ){
				version = window.device.version;
			} else if (cordova && cordova.version) {
				version = cordova.version;
			}

			App.parallax.enabled = App.isVersionCompatible( '4.4', version );
			App.transitionAnimationEnabled = App.isVersionCompatible( '4', version );
		}

		// detect if device has facebook
		if (window.appAvailability) {
			var success = function() {
				App.hasFacebook = true;
			};
			var fail = function() {
				App.hasFacebook = false;
			};
			if (device.platform == 'Android') {
				//appAvailability.check('com.facebook.katana',success, fail);
				App.hasFacebook = false;
			} else if (device.platform == 'iOS') {
				appAvailability.check('fbauth2://',success, fail);
			} else {
				App.hasFacebook = false;
			}
		}


		function orientationChanged (orientationEvent) {
			if (!App || !App.parallax.enabled || !App.parallax.x || !App.parallax.width) {
				return;
			}

			// Run it at first to when the animation is enable it doesnt jump the image backgroup
			if( App.isAndroid() ){
				if( App.parallax.pause ){
					return;
				}
				if( App.parallax.first ){
					App.parallax.first = false;
					App.parallax.pause = true;
					setTimeout( function(){
						App.parallax.pause = false;
					}, 3500 );
				}
			}

			var beta = orientationEvent.beta;
			var gamma = orientationEvent.gamma;
			//get the rotation around the x and y axes from the orientation event

			if (window.orientation !== null) {
				//don't check for truthiness as window.orientation can be 0!
				var screenOrientation = window.orientation;

				if (screenOrientation === -90) {
					//rotated to the left 90 degrees
					beta = orientationEvent.gamma;
					gamma = -1 * orientationEvent.beta;
				}

				if (screenOrientation === 90) {
					beta = -1 * orientationEvent.gamma;
					gamma = orientationEvent.beta;

				}

				if (screenOrientation === 180) {
					beta = -1 * orientationEvent.beta;
					gamma = -1 * orientationEvent.gamma;
				}
			}

			var tanOfGamma = Math.tan(gamma*(Math.PI/180));
			var tanOfBeta = Math.tan((beta -45)*(Math.PI/180));
			//calculate the tan of the rotation around the X and Y axes
			//we treat beta = 45degrees as neutral
			//Math.tan takes radians, not degrees, as the argument

			var backgroundDistance = 50;
			//set the distance of the background from the foreground
			//the smaller, the 'closer' an object appears

			var xImagePosition = (-1 * tanOfGamma * backgroundDistance) + App.parallax.x;
			var yImagePosition = (-1 * tanOfBeta * backgroundDistance) + App.parallax.y;
			//calculate the distance to shift the background image horizontally

			//prevent wrap
			if (yImagePosition >= 0) {
				yImagePosition = 0;
			}
			if (xImagePosition >= 0) {
				xImagePosition = 0;
			}
			if (-xImagePosition > App.parallax.width * .65) {
				xImagePosition = App.parallax.width * .65;
			}
			if (-yImagePosition > App.parallax.height * .35) {
				yImagePosition = 0;
			}

			// stop previous animation
			$('.parallax-bg').stop();

			$('.parallax-bg').animate({
				'background-position-x': xImagePosition,
				'background-position-y': yImagePosition
			});
		}

		App.parallax.setupBackgroundImage = function(el) {

			App.parallax.pause = false;
			App.parallax.first = true;

			App.parallax.bg = el;

			var imgURL = window.getComputedStyle(App.parallax.bg).backgroundImage ;
			//get the current background-image

			//bg image format is url(' + url + ') so we strip the url() bit
			imgURL = imgURL.replace(/"/g,'').replace(/url\(|\)$/ig, '');

			//now we make a new image element and set this as its source
			var theImage = new Image();
			theImage.src = imgURL;

			//we'll set an onload listener, so that when the image loads, we position the background image of the element
			theImage.onload = function() {
				if (!App.parallax.bg) {
					return;
				}

				var elRect = App.parallax.bg.getBoundingClientRect();

				// hack to fix the android paralax problem #2305
				if( App.isAndroid() ){
					if( elRect.width > 0 && elRect.height > 0 ){
						App.parallax.elRect = elRect;
					} else {
						elRect = App.parallax.elRect;
						angular.element( '.home-top' ).height( App.parallax.elRect.height );
					}
				}

				App.parallax.width = this.width;
				App.parallax.height = this.height;
				App.parallax.x = -1 * (this.width - elRect.width)/2;
				App.parallax.y = -1 * (this.height - elRect.height)/2;

				// hack to fix the android paralax problem #2305
				if( App.isAndroid() ){
					App.parallax.x = App.parallax.x / 2;
					App.parallax.y = - ( App.parallax.y / 2 );
					App.parallax.bg.style.backgroundSize = App.parallax.width + 'px ' + App.parallax.height + 'px';
					App.parallax.bg.style.backgroundRepeat = 'no-repeat';
				}
			}
		}

		window.addEventListener('deviceorientation', orientationChanged, false);


		App.server = 'https://crunchbutton.com/';
		App._nativeVersionAndroid = 'ANDROID_NATIVE_VERSION';
		App._nativeVersionIphone = 'IPHONE_NATIVE_VERSION';
		App.service = App.server + 'api/';
		App.imgServer = 'http://i.crunchbutton.com/';

		// @todo: add fail handler
		App.loadConfig();

		// top tap scroller
		window.addEventListener('statusTap', function() {
			$('html, body, .snap-content-inner').animate({scrollTop: 0}, 200, $.easing.easeInOutQuart ? 'easeInOutQuart' : null);
		});

		setTimeout(function() {
			try {
				ga('create', 'UA-36135548-1', {
					'storage': 'none',
					'clientId': device.uuid
				});
				ga('send', 'event','appload');
			} catch (e) {}
		});

		$(document).focus(function() {
			$('body').scrollTop(280-$('.snap-content-inner').scrollTop());
		}, '.location-address');

		var facebookInit = function(){
			// Verify if angular is already started
			if( window.FB && window.angular && angular.element('html') && angular.element('html').injector() && angular.element('html').injector().get('FacebookService') ){
				var facebookService = angular.element('html').injector().get('FacebookService');
				FB.Event.subscribe('auth.statusChange', facebookService.processStatus);

				FB.init({
					appId: 'ID',
					//cookie: true,
					xfbml: true,
					//oauth: true,
					nativeInterface: facebookConnectPlugin,
					useCachedDialogs: false,
					version: 'v2.2'
				});

				FB.getLoginStatus(facebookService.processStatus);
			} else {
				setTimeout( function(){
					facebookInit();
				}, 1500 );
			}
		}
		facebookInit();


		if (window.plugins.NativeAudio) {
			console.debug('init audio');
			$('audio').each(function() {
				console.debug($(this).find('source'));
				window.plugins.NativeAudio.preloadSimple(this.id, $(this).find('source').attr('src').replace('/',''), function(msg){console.info(msg)}, function(msg){ console.error( 'Error: ' + msg ); });
			});
		}


	}, true);
} );


if ( !window.console ){
	console = {};
}
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};
console.debug = console.debug || function(){};

(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = '//connect.facebook.com/en_US/sdk/debug.js';
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));