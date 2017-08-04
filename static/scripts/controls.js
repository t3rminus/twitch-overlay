function shadeBlendConvert(p, from, to) {
	if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
	if(!this.sbcRip)this.sbcRip=function(d){
		var l=d.length,RGB=new Object();
		if(l>9){
			d=d.split(",");
			if(d.length<3||d.length>4)return null;//ErrorCheck
			RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
		}else{
			switch(l){case 8:case 6:case 3:case 2:case 1:return null;} //ErrorCheck
			if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
			d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
		}
		return RGB;}
	var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=sbcRip(from),t=sbcRip(to);
	if(!f||!t)return null; //ErrorCheck
	if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
	else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
}

function formatEmotes(text, emotes) {
	var splitText = text.split('');
	for(var i in emotes) {
		var e = emotes[i];
		for(var j in e) {
			var mote = e[j];
			if(typeof mote == 'string') {
				mote = mote.split('-');
				mote = [parseInt(mote[0]), parseInt(mote[1])];
				var length =  mote[1] - mote[0],
					empty = Array.apply(null, new Array(length + 1)).map(function() { return '' });
				splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
				splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
			}
		}
	}
	return splitText.join('');
}

$(function(){
	var $chat = $('.chat');

	var socket = io(window.location.origin + '/controls');

	socket.on('chat', function(obj) {
		var $items = $chat.find('li');
		if($items.length > 50) {
			$items.first().remove();
		}
		var name = (obj.user['display-name'] || obj.user['username'] || '???');
		var $message = $('<span class="message">' + formatEmotes(obj.message) + '</span>');

		var colour = obj.user.color && shadeBlendConvert(0.5, obj.user.color, '#fff') || '#ffff00';

		var $user = '<span class="name" style="color: '+colour+'">' + name + '</span>';
		var $item = $('<li></li>').append($user).append($message);

		var height = $chat.prop("scrollHeight");
		var scroll = $chat.height() + $chat.scrollTop();

		if(height - scroll < 5) {
			$chat.append($item);
			$chat.scrollTop($chat.prop("scrollHeight"));
		} else {
			$chat.append($item);
		}
	});

	socket.on('action', function(obj) {
		var $items = $chat.find('li');
		if($items.length > 50) {
			$items.first().remove();
		}

		var $item = $('<li></li>').append(obj);
		var height = $chat.prop("scrollHeight");
		var scroll = $chat.height() + $chat.scrollTop();

		if(height - scroll < 10) {
			$chat.append($item);
			$chat.scrollTop($chat.prop("scrollHeight"));
		} else {
			$chat.append($item);
		}
	});

	socket.on('viewercount', function(msg) {
		$('.viewcount').html(msg);
	});


	$('.controls [data-command]').on('click', function(e){
		e.preventDefault();
		socket.emit('command', $(this).data('command'));
	});

	$('.js-to-bottom').on('click', function(e) {
		$chat.scrollTop($chat.prop("scrollHeight"));
	});
});