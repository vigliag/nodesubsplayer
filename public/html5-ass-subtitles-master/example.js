var captionLimit=10;   // how many captions can be on screen at the same time.
var captionInUse=0;

function ASSCaptionsUpdate() {
	if (!captions['lines']) { return; }
	
	var v = document.querySelector('video'); 
	var now = v.currentTime;
	var text = "";
	var captionSelect=0;

	for (var i = 0; i < captions['lines'].length; i++) {
		if (now >= captions['lines'][i]['start'] && now <= captions['lines'][i]['end']) {
			if (captionSelect < captionLimit){
				document.getElementById('caption'+captionSelect).innerHTML = captions['lines'][i]['text'];
				document.getElementById('caption'+captionSelect).className = "subtitles_"+captions['lines'][i]['style'];
				captionSelect++;
			} else { alert('limit burst.'); }
		} 
		else if (now < captions['lines'][i]['start'] && now < captions['lines'][i]['end']){
			if (captionSelect <= captionInUse){
				for (var x = captionSelect; x<captionInUse+1 && x < captionLimit;x++){
					document.getElementById('caption'+x).innerHTML = "";
				}
			}
			captionInUse=captionSelect;
			return;
		}
	}

	captionInUse=captionSelect;
}

function prepareCaptions(){
	var ref = document.getElementsByTagName('video')[0];
	for (var x=0; x < captionLimit; x++){
		var caption = document.createElement('div');
		caption.id = 'caption'+x;
		ref.parentNode.insertBefore(caption, ref.nextSibling);
	}
}