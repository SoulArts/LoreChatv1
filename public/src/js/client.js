var VERSION = '2.0.1';

// Initialize varibles
var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.message-box'); // Input message input box

var $loginPage = $('.login.page'); // The login page
var $chatPage = $('.chat.page'); // The chatroom page

//Client infos
var USER;
var USERS;
var $currentInput = $usernameInput.focus();

//var socket = io.connect('127.0.0.1');
var socket = io();

//lancement du chat
Main();

function Main(){
	initModules();
}

/**
@brief Initialise tous les modules
*/
function initModules(){
	//Module app//
  	//Evenement
	$.getScript('src/js/app/event.js');
  	$.getScript('src/js/app/socketEvent.js');
  	//Utilisateurs
	$.getScript('src/js/app/user.js');
  	//Stockage des donnes
	$.getScript('src/js/app/storage.js');
  	//Messages + commandes
	$.getScript('src/js/app/message.js');
	$.getScript('src/js/app/commande.js');
  	//Parametres
	$.getScript('src/js/app/parametre.js');
  	//Notifications
  	$.getScript('src/js/app/notif.js');
  	//Emojis
	$.getScript('src/js/app/emoji.js');
  	//Module Audio
  	$.getScript('src/js/app/sound.js');

  	//Module Popup
	$.getScript('src/js/popup/popup.js');

	//Module pnotif
	$.getScript('src/js/pnotif/pnotif.js');

	//Module Highlight
	$.getScript('src/js/highlight/highlight.js',function(){
		hljs.initHighlightingOnLoad();
	});
}

function currentHour(){
	var d = new Date();
	var h = d.getHours();
	if(h < 10)
		h = '0'+h;
	var m = d.getMinutes();
	if(m < 10)
		m = '0'+m;
	return h+':'+m;
}
