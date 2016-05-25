$(document).ready(function() {
			
	$(".togglebutton").button();
	$("#text").addClass("ui-corner-all");
	
	var socket; 
	var dialog, form;

	if(!("WebSocket" in window)){  
		$('#chatLog, input, button, #examples').fadeOut("fast");  
		$('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');  
	} else {  
		connect();
	}
	
	function connect() { 
	
		function url_domain(data) {
			var a = document.createElement('a');
			a.href = data;
			if(a.hostname == ""){
				return "localhost";
			} else {
				return a.hostname;
			}
		}
		
		var host = "ws://"+url_domain(document.URL)+":7890/"; 
		
		try{  
	  
			socket = new WebSocket(host);  
			
			$('.conn_status').html('<span style="color:#ff9900;font-weight:bold;">Connecting</span>');
			
			// message('<p class="event">Socket Status: '+socket.readyState);  
	  
			socket.onopen = function(){  
				// message('<p class="event">Socket Status: '+socket.readyState+' (open)');
				sendLoginToken();
				$('.conn_status').html('<span style="color:green;font-weight:bold;">Connected</span>');
				$('.users').html('');
				clearTimeout(reconnecting);
			
			}  
	  
			socket.onmessage = function(msg){  
				
				var data = JSON.parse(msg.data);
				var index;
				switch (data.command) {
					case 'message' :
						message('<p class="message"><span class="username">'+data.data.username+':</span> '+data.data.message);
					break;
					case 'error' :
						message('<p class="message">Error: <font color="red">'+data.data+"</font>");  
					break;
					case 'users' :
						$('.users').html(data.data);
					break;
					case 'login' :
						loginReturn(data);  
					break;	
					case 'logout' :
						logoutReturn(data);  
					break;								
					default:
					break;
				}
			}

			function send(){  
				var text = $('#text').val();  
	  
				var command = {
					command:"message",
					data:{
						message:text
					}
				}
				
				if(text.length > 0){
				var session_key = getKey("session_key");
				if(session_key && session_key.length > 0){				 
					try {  
						socket.send(JSON.stringify(command)); 
		  
					} catch(exception){  
						message('<p class="warning">');  
					}  
					$('#text').val("");  
				} else {
					dialog.dialog( "open" );
				}
				}
			}  
	 	  
			$('#text').keypress(function(event) {  
				if (event.keyCode == '13') {  
					send();  
				}  
			}); 	

			$('#Send').click(function(event) {  
				send();  
			}); 			
	  
			socket.onclose = function(){  
				// message('<p class="event">Socket Status: '+socket.readyState+' (Closed)');
				$('.conn_status').html('<span style="color:red;font-weight:bold;">Connection lost</span>');
				$('.users').html('');
				reconnect();
			}             
	  
		} catch(exception){  
			 message('<p>Error'+exception);  
		}  				
	}
	
	function message(msg){  
		$('#chatLog').append(msg+'</p>');
	}  
				

				
	var name = $( "#name" );
	var password = $( "#password" );
	var allFields = $( [] ).add( name ).add( password );				
	
	dialog = $( "#dialog-form" ).dialog({
		autoOpen: false,
		width: 350,
		modal: true,
		buttons: {
			"Login": login,
			Cancel: function() {
				dialog.dialog( "close" );
			}
		},
		close: function() {
			form[ 0 ].reset();
			allFields.removeClass( "ui-state-error" );
		}
	});
	 
	form = dialog.find( "form" ).on( "submit", function( event ) {
		event.preventDefault();
		login();
	});
 
	$( "#login" ).button().on( "click", function() {
		if($(this).val() == 'Login'){
			dialog.dialog( "open" );
		} else {
			sendLogout();
		}
	});
	
	function login() {
		var message = {
			command:"login",
			data: {
				username:name.val(),
				password:password.val()
			}
		};
		socket.send(JSON.stringify(message));					
	}
	
	function sendLogout() {
		var username = getKey("username");
		var message = {
			command:"logout",
			data: {
				username:username
			}
		};
		socket.send(JSON.stringify(message));						
	}
	
	function setKey(cname, cvalue) {
		if(typeof(Storage) !== "undefined") {
			localStorage.setItem(cname, cvalue);
		} else { 
			document.cookie = cname + "=" + cvalue;
		}
	}	
	
	function getKey(cname) {
		var value = "";
		if(typeof(Storage) !== "undefined") {
			value =  localStorage.getItem(cname);
		} else { 
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i=0; i<ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1);
				if (c.indexOf(name) == 0) value = c.substring(name.length,c.length);
			}
		}
		return value;
	}
	
	function eraseKey(cname){
		localStorage.removeItem(cname);
	}
	
	function loginReturn(data) {
		if(data.data.session_key.length > 0 && data.data.username.length > 0){
			setKey('session_key',data.data.session_key);
			setKey('username',data.data.username);
			$('#login').val('Logout: '+data.data.username);
			dialog.dialog( "close" );
		} else {
			allFields.addClass( "ui-state-error" );
		}
	}
	
	function logoutReturn(data) {
		eraseKey('session_key');
		eraseKey('username');
		$('#login').val('Login');
	}
	
	function sendLoginToken(){
		var session_key = getKey("session_key");
		var username = getKey("username");
		if(session_key && session_key.length > 0 && username && username.length > 0){
			var message = {
				command:"login_session",
				data: {
					username:username,
					session_key:session_key
				}
			};
			socket.send(JSON.stringify(message));						
		}					
	}
	
	var reconnecting;
	
	function reconnect() {
		var updateInterval = 5000;
		if(socket.readyState == 3){
			connect();
		}
		reconnecting = setTimeout(reconnect, updateInterval);
	}			
});