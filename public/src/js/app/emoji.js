var ALLEMOJI = [
	':devil:',
	':star:',
	':quest:',
	':pvp:',
	':map:',
	':health:',
	':ruby:',
	':diamond:',
	':sapphire:'
	];

$('.smileys').append(smileyHtml());

function getEmojiCode(code){
	code = code.replace(/:/g,'');
	return 'emotion '+code;
}

function addMessageEmoji(text){
	if(text){
		text = text.split(' ');
		for(var i=0; i<text.length; i++){
			if(ALLEMOJI.indexOf(text[i]) != -1){
				text[i] = '<i class="'+getEmojiCode(text[i])+'"></i>';		
			}
		}
		text = text.join(' ');
	}
	return text;
}

function smileyHtml(){
	var $html = $('<div>').addClass('smiley-container');

	//EMOJI
	for(var i=0; i<ALLEMOJI.length; i++){
		var $smiley = $('<i>').addClass(getEmojiCode(ALLEMOJI[i])).addClass('select-smiley but').attr('id',ALLEMOJI[i]);
		$html.append($smiley);
	}

	return $html;
}

//Ajout d'un smiley à la barre de text
$('.smileys').on('click','.select-smiley',function(data){
	var id = data.currentTarget.id;
	$inputMessage.val($inputMessage.val().trim()+' '+id+' ');
});

//Fermer l'onglet smiley si on clique ailleur
$chatPage.click(
	function(data){
		if(data.target.className.indexOf('em') == -1 && data.target.className != 'smiley-container')
			$('.smiley-container').hide();
	}
);
