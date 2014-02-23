String.prototype.startsWith = function(input){
    return (this.substr(0, input.length) === input);
}

String.prototype.endsWith = function(input){
    return (this.substr(this.length-input.length, input.length) === input);
}


/** Function : dump()
* Arguments  : $data - the variable that must be displayed
***********************************************************************************
* Version    : 1.01.B
* Author     : Binny V A(binnyva (at) hotmail (dot) com : http://www.geocities.com/binnyva)
* Date       : June 3, 2005
* Last Update: Wednesday, July 13 2005
* Prints a array, an object or a scalar variable in an easy to view format.
***********************************************************************************/

function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}
