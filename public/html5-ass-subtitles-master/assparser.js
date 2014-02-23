var captions = {};
var freq = new XMLHttpRequest;

var GLOBAL_SPACING=30; // needed for controls

function fetchASSFile(url) {
	freq.open('get',url, true);
	freq.onreadystatechange = finishDownloadingASS;
	freq.send();
}

function finishDownloadingASS() {
	if (freq.readyState != 4)  { return; }
	parseASS(freq.responseText);
}

function parseASS(ASScontent) {
	// parsing state
	var state = 0; 
	// line count
	var linecounter=0;
	// resizing factor
	var resizefactor=1;
	
	// initializing captions array
	captions['infos'] = [];
	captions['style'] = [];
	captions['lines'] = [];

	// split the assfile by newlines.
	var assfile = ASScontent.split('\n');	
	comments="";
	
	for (var linecount=0; linecount<assfile.length; linecount++){
		if (assfile[linecount].startsWith('[Script Info]')){
			// start of the Script Info tags
			state = 1;
		} else if (assfile[linecount].startsWith('[V4+ Styles]')){
			// start of the Style tags
			state = 2;
		
			// preparations: calculate resizeFactor
			if (captions['infos']['PlayResX']){
				if (captions['infos']['PlayResY']){
					resizefactor = parseInt(captions['infos']['PlayResY'])/parseInt(captions['infos']['PlayResX']);
				}
			}
		} else if (assfile[linecount].startsWith('[Events]')){
			// start of the Lines tags
			state = 3;
		} else if (state == 1){
			// TODO: trim() the strings
			if (!assfile[linecount].startsWith(';')){
				// TODO: Check for more splits
				if (assfile[linecount].indexOf(':') != -1){
					// adding info to the info array.
					var info=assfile[linecount].split(':');
					captions['infos'][info[0].trim()] = info[1].trim();
				}
			} else {
				// Adding comment to comments string. (for debug purposes)
				comments=comments+assfile[linecount]+"\n";
			}
		} else if (state == 2){
			// TODO: trim() the strings
			if (assfile[linecount].startsWith('Style:')){
				// Remove "Style:" at the beginning
				var styleparts = assfile[linecount].split(':')[1].split(',');
				// First String == Stylename
				var stylename = styleparts[0].trim();
				// Fetch highest array index to append new style
				var x = captions['style'].length;
				
				//Initialize array and fill it
				captions['style'][x] = [];
				captions['style'][x]['stylename'] = styleparts[0];
				captions['style'][x]['fontname'] = styleparts[1];
				captions['style'][x]['fontsize'] = parseFloat(styleparts[2])*resizefactor;
				captions['style'][x]['color1'] = styleparts[3];
				captions['style'][x]['color2'] = styleparts[4];
				captions['style'][x]['border-color'] = styleparts[5];
				captions['style'][x]['shadow-color'] = styleparts[6];
				captions['style'][x]['bold'] = styleparts[7];
				captions['style'][x]['italic'] = styleparts[8];
				captions['style'][x]['underline'] = styleparts[9];
				captions['style'][x]['strikeout'] = styleparts[10];
				captions['style'][x]['fontscalex'] = styleparts[11];
				captions['style'][x]['fontscaley'] = styleparts[12];
				captions['style'][x]['spacing'] = styleparts[13];
				captions['style'][x]['angle'] = styleparts[14];

				captions['style'][x]['borderstyle'] = styleparts[15];
				captions['style'][x]['outline'] = parseFloat(styleparts[16])*resizefactor;
				captions['style'][x]['shadow'] = parseFloat(styleparts[17])*resizefactor;
				captions['style'][x]['alignment'] = styleparts[18];
				captions['style'][x]['marginleft'] = parseFloat(styleparts[19])*resizefactor;
				captions['style'][x]['marginright'] = parseFloat(styleparts[20])*resizefactor;
				captions['style'][x]['marginvertical'] = parseFloat(styleparts[21])*resizefactor;
				captions['style'][x]['encoding'] = styleparts[22];
				
			}
		} else if (state == 3){
			// TODO: trim() the string(s)
			if (assfile[linecount].startsWith('Dialogue:')){
				// On dialog lines we split 'em by ","s.
				var lineparts = assfile[linecount].split(',');
				// st = start time - et = end time
				var st = lineparts[1].trim().split(':');
				var et = lineparts[2].trim().split(':');
				
				// initialize array.
				captions['lines'][linecounter] = [];
				// convert start & end time to seconds.
				captions['lines'][linecounter]['start'] = st[0]*60*60 + st[1]*60 + parseFloat(st[2]);
				captions['lines'][linecounter]['end'] = et[0]*60*60 + et[1]*60 + parseFloat(et[2]);
				captions['lines'][linecounter]['style'] = lineparts[3];
				captions['lines'][linecounter]['actor'] = lineparts[4];
				captions['lines'][linecounter]['marginleft'] = lineparts[5];
				captions['lines'][linecounter]['marginright'] = lineparts[6];
				captions['lines'][linecounter]['marginvertical'] = lineparts[7];
				captions['lines'][linecounter]['effect'] = lineparts[8];
				
				// join the array back together, sentences may contain ','s.
				for (var z = 0; z < 9; z++) { lineparts.shift(); }
				captions['lines'][linecounter]['text'] = lineparts.join(',');
				
				// parse ASS tags
				// TODO: instead of making effects apply to the whole line, put them in a <span>.
				captions['lines'][linecounter]['asstags'] = "";
				var matches = captions['lines'][linecounter]['text'].match(/{[^}]+}/g);
				for (var z in matches){
					if (matches[z].startsWith("{\\")){
						captions['lines'][linecounter]['asstags'] = captions['lines'][linecounter]['asstags'] + matches[z] + " ";
					}
				}
				captions['lines'][linecounter]['text'] = captions['lines'][linecounter]['text'].replace(/{[^}]+}/gi,"");
				
				// raise counter.
				linecounter = linecounter+1;
			}
		}
    }	
	
	// sorting array by start times (CPU reduction by jumping out of loop in later functions)
	captions['lines'].sort(sortASSLineArray);
	
	// fetch head element
    var head = document.getElementsByTagName("head")[0]; 
	
	// generate HTML styles (for caption DIVs)
    var styleadd = "";
    for (var x=0;x<captions['style'].length;x++){
		styleadd = styleadd + generateASSStyleCSS(captions['style'][x]);
    }
	
	//TODO: remove this when <span> stuff is implemented.
	for (var x=0;x<captions['lines'].length;x++){
		if (captions['lines'][x]['asstags'] != ""){
			styleadd = styleadd + parseASSTags(captions['lines'][x]['asstags'],captions['lines'][x]['style'],x,resizefactor);
			captions['lines'][x]['style'] = captions['lines'][x]['style']+" subtitles_"+captions['lines'][x]['style']+"_"+x;
		}
	}
	
	// add the generated styles
    head.innerHTML = head.innerHTML + "<style type='text/css'>" + styleadd + "</style>";
}

function parseASSTags(taglist, style, linenmbr, resizeFactor){
	var tags = taglist.match(/\\[^\\]+/gi);
	var tagcounter = 0;
	var styleName = "subtitles_"+style+"_"+linenmbr;
	var styleout = ".subtitles_"+style+"_"+linenmbr+"{ ";
	while (tagcounter < tags.length){
		if (tags[tagcounter].startsWith('\\t')){
			// timed
			//TODO: implement
			var tcontent=tags[tagcounter];
			while ( tags[tagcounter] && !( tags[tagcounter].endsWith(')')) ){
				tcontent=tcontent+tags[tagcounter];
				tags.shift();
			}
			
		} else if (tags[tagcounter].startsWith('\\be')){
			// blur
			//TODO: add base style's shadow style
			var bluramount = parseFloat(tags[tagcounter].replace('\\be',''));	
			styleout = styleout + "text-shadow: 0px 0px "+bluramount+"px #000; ";
		} else if (tags[tagcounter].startsWith('\\1c') || tags[tagcounter].startsWith('\\c')){
			// fore-color
			var costart=tags[tagcounter].indexOf('&');
			c1r=parseInt("0x"+tags[tagcounter].substr(costart+2,2));
			c1g=parseInt("0x"+tags[tagcounter].substr(costart+4,2));
			c1b=parseInt("0x"+tags[tagcounter].substr(costart+6,2));
			styleout = styleout + 'color: rgba('+c1r+','+c1g+','+c1b+','+255/255+'); ';
		}else if (tags[tagcounter].startsWith('\\3c')){
			// border-color
			var costart=tags[tagcounter].indexOf('&');
			c3r=parseInt("0x"+tags[tagcounter].substr(costart+2,2));
			c3g=parseInt("0x"+tags[tagcounter].substr(costart+4,2));
			c3b=parseInt("0x"+tags[tagcounter].substr(costart+6,2));
			
			styleout = styleout+'-webkit-text-stroke-color: rgba('+c3r+','+c3g+','+c3b+','+255/255+'); ';
		} else if (tags[tagcounter].startsWith('\\b')){
			// bold
			if (tags[tagcounter].substring(2,1) == "1")
				styleout = styleout + "font-weight: bold; ";
			else
				styleout = styleout + "font-weight: normal; ";
		} else if (tags[tagcounter].startsWith('\\i')){
			// italic
			if (tags[tagcounter].substring(2,1) == "1")
				styleout = styleout + "font-style: italic; ";
			else
			styleout = styleout + "font-style: normal; ";
		} else if (tags[tagcounter].startsWith('\\u')){
			// underline
			if (tags[tagcounter].substring(2,1) == "1")
				styleout = styleout + "text-decoration: underline; ";
			else
				styleout = styleout + "text-decoration: none; ";			
		} else if (tags[tagcounter].startsWith('\\s')){
			// strike-out
			if (tags[tagcounter].substring(2,1) == "1")
				styleout = styleout + "text-decoration: line-through; ";
			else
				styleout = styleout + "text-decoration: none; ";			
		} else if (tags[tagcounter].startsWith('\\pos')){
			// position
			// TODO: depend the \pos on the \an we select.
			var position = tags[tagcounter].substring(6,tags[tagcounter].length-3).split(',');
			//styleout = styleout + "margin-top: "+(position[1]*resizeFactor+GLOBAL_SPACING)+"px; margin-left: "+(position[0]*resizeFactor)+"px; ";
			styleout = styleout + "margin-bottom: "+(400-position[1]*resizeFactor+GLOBAL_SPACING)+"px; margin-left: "+((position[0]*resizeFactor))+"px; ";
		} 
		tagcounter++;
	}
	return styleout + "}\n";
}

function generateASSStyleCSS(style) {
	var retstr = "";
	retstr=retstr+".subtitles_"+style['stylename'].trim()+" { position: absolute; width: 100%; vertical-align: bottom; ";
	
	if ((style['alignment'] == "9") || (style['alignment'] == "6") || (style['alignment'] == "3")) { retstr=retstr+'text-align: right;'; }
	if ((style['alignment'] == "8") || (style['alignment'] == "5") || (style['alignment'] == "2")) { retstr=retstr+'text-align: center;'; }
	if ((style['alignment'] == "7") || (style['alignment'] == "4") || (style['alignment'] == "1")) { retstr=retstr+'text-align: left;'; }

	if ((style['alignment'] == "9") || (style['alignment'] == "8") || (style['alignment'] == "7")) { retstr=retstr+'vertical-align: top; top: 0px;'; }
	if ((style['alignment'] == "6") || (style['alignment'] == "5") || (style['alignment'] == "4")) { retstr=retstr+'vertical-align: middle;'; }
	if ((style['alignment'] == "1") || (style['alignment'] == "2") || (style['alignment'] == "3")) { retstr=retstr+'vertical-align: bottom; bottom: 0px;'; }

	if (style['marginleft'] != 0)  retstr=retstr+'margin-left: '+style['marginleft']+'px; ';
	//if (style['marginright'] != 0) retstr=retstr+'margin-right: -'+(style['marginright']+style['marginleft'])+'px; ';
	if (style['marginright'] != 0) retstr=retstr+'margin-right: -'+(style['marginright'])+'px; ';

	if (style['marginvertical'] != 0){
		retstr=retstr+'margin-bottom: '+(style['marginvertical']+GLOBAL_SPACING)+'px; ';
		retstr=retstr+'margin-top: '+(style['marginvertical']+GLOBAL_SPACING)+'px; ';
	} else {
		retstr=retstr+'margin-top: '+GLOBAL_SPACING+'px ;'
		retstr=retstr+'margin-bottom: '+GLOBAL_SPACING+'px; '
	}
	
	retstr=retstr+'font-family: "'+style['fontname']+'", "Arial";';
	retstr=retstr+'font-size: '+style['fontsize']+"px;";

	c3r=parseInt("0x"+style['border-color'].substr(4,2));
	c3g=parseInt("0x"+style['border-color'].substr(6,2));
	c3b=parseInt("0x"+style['border-color'].substr(8,2));
	c3a=255-parseInt("0x"+style['border-color'].substr(2,2));

	shadr=parseInt("0x"+style['shadow-color'].substr(4,2));
	shadg=parseInt("0x"+style['shadow-color'].substr(6,2));
	shadb=parseInt("0x"+style['shadow-color'].substr(8,2));
	shada=255-parseInt("0x"+style['shadow-color'].substr(2,2));

	if (navigator.userAgent.indexOf('WebKit/') > -1) {
		//webkit browsers support text stroke!
		retstr=retstr+'-webkit-text-stroke-color: rgba('+c3r+','+c3g+','+c3b+','+c3a/255+');';
		retstr=retstr+'-webkit-text-stroke-width: '+style['outline']+"px;";
		retstr=retstr+'text-shadow: '+style['shadow']+'px '+style['shadow']+'px 0px rgba('+shadr+','+shadg+','+shadb+','+(shada/255)+');';
	} else {
		// workaround for text-stroke...
		retstr="@font-face { font-family: "+style['fontname']+"; src: local(\""+style['fontname']+"\"); } " + retstr;
		retstr=retstr+'text-shadow: -'+(style['outline'])+'px -'+(style['outline'])+'px 0.5px rgba('+c3r+','+c3g+','+c3b+','+c3a+'), -'+(style['outline'])+'px '+(style['outline'])+'px 0.5px rgba('+c3r+','+c3g+','+c3b+','+c3a+'), '+(style['outline'])+'px -'+(style['outline'])+'px 0.5px rgba('+c3r+','+c3g+','+c3b+','+c3a+'), '+(style['outline'])+'px '+(style['outline'])+'px 0.5px rgba('+c3r+','+c3g+','+c3b+','+c3a+'), '+style['shadow']+'px '+style['shadow']+'px 0px rgba('+shadr+','+shadg+','+shadb+','+(shada/255)+');';
	}
	
	c1r=parseInt("0x"+style['color1'].substr(4,2));
	c1g=parseInt("0x"+style['color1'].substr(6,2));
	c1b=parseInt("0x"+style['color1'].substr(8,2));
	c1a=255-parseInt("0x"+style['color1'].substr(2,2));
	retstr=retstr+'color: rgba('+c1r+','+c1g+','+c1b+','+c1a/255+');';

	retstr=retstr+"}\n";

	return retstr;
}

function sortASSLineArray(a,b){
	if (a['start'] < b['start'])
		return -1;
	if (a['start'] == b['start'])
		return 0;
	if (a['start'] > b['start'])
		return 1;
}
