$(function(){
	var socket = io.connect( 'http://'+window.location.hostname+':3000' );

	socket.on('stats', function(data) { });
	socket.on('users', function(data){
		$('.names-list').text('');
		$.each(data,function(i,v){
			$('.names-list').append('<li class="user-select"><span class="default-icon vip"></span>'+v+'</li>');
		});
	});

	socket.on('push message', function(response){
		$('.messages').append('<li id="user-message"><div id="avatar"><span class="avatar-bd-text"></span><img  class="avatar-text" src="_assets/images/profile.jpg"></div><h1 class="username-title"><span class="default-icon vip"></span>'+response.name+'<span class="vip-player"></span></h1><span data-livestamp="'+moment().unix()+'" class="date-title">a few seconds ago</span><p class="main-text">'+response.msg+'</p></li>');
		$('.messages').animate({scrollTop: $('.messages').prop("scrollHeight")}, 500);
	});
	
$('#emote-box a').click(function () {
   var smiley = $(this).attr('title');
   ins2pos(smiley, 'content-text-max');
});

function ins2pos(str, id) {
   var TextArea = document.getElementById(id);
   var val = TextArea.value;
   var before = val.substring(0, TextArea.selectionStart);
   var after = val.substring(TextArea.selectionEnd, val.length);
   
   TextArea.value = before + str + after;
   setCursor(TextArea, before.length + str.length);
}

function setCursor(elem, pos) {
   if (elem.setSelectionRange) {
      elem.focus();
      elem.setSelectionRange(pos, pos);
   } else if (elem.createTextRange) {
      var range = elem.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
   }
}
	
	$(document).on('keyup','.message-box',function(e){
		var vazios = $("input[type=text]").filter(function() {
         	return !this.value;
        }).get();
        if (vazios.length) {
            $(vazios).addClass('vazio');
            return false;
        } else {
        	var $this = $(this);
				if(e.which === 13){
					var message = $this.val();
						socket.emit('new message', message);
						$this.val('');
						updateDB(localStorage.getItem('username'),message); //Update message in DB
					}
        		}
		});
	
	 $('#send-msg').click(function(){
		 var vazios = $("input[type=text]").filter(function() {
            return !this.value;
        }).get();
        if (vazios.length) {
            $(vazios).addClass('vazio');
            return false;
        } else {
            var sendmsg = $("#content-text-max").val();
			var message = sendmsg;
				socket.emit('new message', message);
		 		$("#content-text-max").val('');
				updateDB(localStorage.getItem('username'),message); //Update message in DB
        	}
	});
	
	function updateDB(name,msg){
		$.post('process.php',{method:'update',name:name,msg:msg},function(response){
			console.log(response);
		});
	}
			var $this = $(this);
			var name = $.cookie("accessUser");

			socket.emit('new user', name, function(response){
				if(response){
					localStorage.setItem('username',name);
					$this.val('');
					$('#userinfo').hide();
					$('#chat-body').fadeIn();
					loadMessages(); //retrieve messages from Database
				} else{
					$('.validation').text('Username taken!').fadeIn();
				}
			});

	function loadMessages(){
		$.post('process.php',{method:'retrieve'},function(response){
			$.each(JSON.parse(response),function(i,v){
				$('.messages').append('<li id="user-message"><div id="avatar"><span class="avatar-bd-text"></span><img  class="avatar-text" src="_assets/images/profile.jpg"></div><h1 class="username-title"><span class="default-icon vip"></span>'+v.name+'<span class="vip-player"></span></h1><span data-livestamp="'+v.created_at+'" class="date-title">a few seconds ago</span><p class="main-text">'+v.message+'</p></li>');
			});
			$('.messages').animate({scrollTop: $('.messages').prop("scrollHeight")}, 500);
		});
	}

	/*** App ***/

	$('.names-list').slimScroll({
	    width: '154px',
    	height: '299px',
    	color: '#ffcc00',
		alwaysVisible: false
	});

	$('.messages').slimScroll({
	    width: '425px',
    	height: '238px',
    	color: '#BB0003',
    	alwaysVisible: false,
    	start: 'bottom'
	});
});
