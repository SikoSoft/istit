
function log (msg)
	{
	if (typeof(console) != 'undefined' && typeof(console.log) != 'undefined')
		{
		console.log(msg);
		}
	}

function trace (msg)
	{
	log('trace() deprecated! use log() instead!');
	log(msg);
	}

function random (from, to)
	{
	return Math.floor(Math.random() * (to - from + 1) + from);
	}

function getCookie (name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function setCookie (name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}


var ssInstance = false;

function sikosoft () {

	if (ssInstance) {
		return false;
	}

	log('what are you looking at, butthead?');

	ssInstance = true;

	var requestID = 0,
		cfg = {},
		initTime = Date.now(),
		jBody = {},
		jHead = {},
		jWindow = jQuery(window);

	init();

	function init () {
		log('init');
		jHTML = jQuery('html');
		jBody = jQuery('body');
		jHead = jQuery('head');
		jHead.append("<link href='http://fonts.googleapis.com/css?family=Roboto+Condensed' rel='stylesheet' type='text/css'/>");
		jHead.append("<link href='http://sikosoft.net/archive/common.css' rel='stylesheet' type='text/css'/>");
		log(jHead.attr('data-ss-headless'));
		if (!jHead.attr('data-ss-headless') || jHead.attr('data-ss-headless') == undefined) {
			insertHeader();
		}
		jSticky = jQuery('#ss-head');
		jQuery.ajaxSetup({
			'beforeSend': function () {
				jQuery('#ss-head-load').stop(true, true).fadeIn(200);
			},
			'complete': function () {
				jQuery('#ss-head-load').stop(true, true).fadeOut(200);
			}
		});
		jQuery.post(
			'http://sikosoft.net/init.php',
			{"sessionKey": ""},
			function (json) {
				cfg = json.cfg;
				setupCFG();
			},
			'json'
		);
		insertQRCode();
		trackRequest();
		insertBlurbs();
		jWindow.resize(handleResize);
		var wrapped = trackRequestDuration;
		if (window.onbeforeunload) {
			wrapped = function () { window.onbeforeunload(); trackRequestDuration(); };
		}
		window.onbeforeunload = wrapped;
	}

	function setupCFG () {
		log('setupCFG');
		setTitle(cfg.title);
		if (!cfg.title) {
			jQuery('#ss-head-title').hide();
		}
		if (cfg.showSticky) {
			log('showSticky');
			jSticky.show();
			var bodyMT = 0;
			var cMT = jBody.css('margin-top');
			if (cMT) {
				bodyMT = parseInt(cMT);
			}
			var height = jSticky.height();
			jBody.css('margin-top', height+bodyMT+'px');
		}
		if (cfg.maintainBody) {
			syncBodyHeight();
		}
	}

	function setTitle (t) {
		log('setTitle');
		jQuery('#ss-head-title').html(t);
	}

	function handleResize (e) {
		if (cfg.maintainBody) {
			syncBodyHeight();
		}
	}

	function syncBodyHeight () {
		log('syncBodyHeight');
		jBody.css('height', jWindow.height()-jSticky.height()+'px');
	}

	function insertQRCode () {
		if (jQuery(window).height() > 720) {
			var d = "<div id='ss-qr'>";
			d += "<div id='ss-qr-left'></div>";
			d += "<div id='ss-qr-code'></div>";
			d += "<div id='ss-qr-right'></div>";
			d += "</div>";
			jQuery('body').append(d);
			hideQRCode();
		}
	}

	function toggleQRCode () {
		if (jQuery('#ss-qr').is(':hidden')) {
			showQRCode();
		}
		else {
			hideQRCode();
		}
	}

	function showQRCode (_url) {
		if (!_url) {
			_url = "http://sikosoft.net";
		}
		jQuery('#ss-qr-code').html('').qrcode({"width": 128, "height": 128, "text": _url});
		jQuery('#ss-qr').stop(true, true).animate({'bottom': '0px', 'opacity': 'show'}, 200);
	}

	function hideQRCode () {
		jQuery('#ss-qr').stop(true, true).animate({'bottom': '-150px', 'opacity': 'hide'}, 200);
	}

	function insertHeader () {
		log('insertHeader');
		if (jQuery(window).height() > 720) {
			var d = "<div id='ss-head' style='display:block;'>";
			d += "<div id='ss-head-inner'>";
			d += "<div id='ss-head-left'>";
			d += "<div id='ss-head-home'><a href='http://sikosoft.com'>SikoSoft</a></div>";
			d += "<div id='ss-head-title'></div>";
			d += "</div><!-- end ss-head-left -->";
			d += "<div id='ss-head-logo'></div>";
			d += "<div id='ss-head-load' style='display:none;'><i class='icon-spinner icon-spin'></i></div>";
			d += "</div>";
			d += "</div>";
			jBody.prepend(d);
		}
	}

	function trackRequest () {
		jQuery.post(
			'http://api.sikosoft.net/json/tracking/trackRequest',
			{url: window.location.href, referrer: document.referrer},
			function (json) {
				requestID = json.requestID;
			},
			'json'
		);
	}

	function trackRequestDuration () {
		jQuery.ajax({
			type: 'post',
			url: 'http://api.sikosoft.net/json/tracking/updateRequestDuration',
			data: {requestID: requestID, duration: Date.now()-initTime},
			success: function (json) {
				log('updated request duration');
			},
			dataType: 'json',
			async: false
		});
	}

	function getBlurb (_cb) {
		log('getBlurb');
		if (typeof(_cb) === 'undefined') {
			_cb = function(){};
		}
		jQuery.ajax({
			type: 'post',
			url: 'http://api.sikosoft.net/json/blurb/get',
			data: {},
			success: function (json) {
				if (json.id > 0) {
					_cb(json.body);
				}
			},
			dataType: 'json',
			async: true
		});
	}

	function insertBlurb (jEl) {
		log('insertBlurb');
		jEl.html('').hide();
		getBlurb(function(_notice){
			jEl.html(_notice).show();
		});
	}

	function insertBlurbs () {
		log('insertBlurbs');
		jQuery('.ss-blurb').each(function(){
			var jThis = jQuery(this);
			insertBlurb(jThis);
		});
	}

	function scramble (i) {
		if (typeof(i) != 'string') {
			return false;
		}
		log('scramble>'+i);
	}

	return {
		insertHeader: insertHeader,
		insertQRCode: insertQRCode,
		trackRequest: trackRequest,
		insertBlurb: insertBlurb,
		_s: scramble
	}

}

