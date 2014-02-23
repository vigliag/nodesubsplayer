# nodesubsplayer #
Experiment/exercise/proof_of_concept of a browserapp to play subbed (with advancedSubStation subs) mkv files, clicking a word in subtitles, it is looked up on wordreference, embedded on the same page.

### requirements ###
Unfortunately, as it is, nodesubplayer only supports windows. It could be modified to work on other systems as well, but I doubt VLC plugin would work as well. In addiction you'll need:
* An Mkv file with .ass subtitles to test the program - at the moment this is the only supported format
* A recent version of chrome installed (firefox should work too)
* A recent version of vlc installed
* Mkvtoolnix extracted in the apposite folder, such that mkvextract.exe is directly inside the mkvtoolnix folder
* Node js installed and in the path, or, otherwise, node.exe in the same folder as the launcher.bat file

### how it works ###
The mkv file to play must be dragged upon the launcher.bat icon, the script executes a node.js server passing the file as argument
A node server is in charge of
* obtaining subtitles track number parsing mkvmerge's output
* extracting them through mkvextract to a sub.ass file
* serving everything on http://localhost:3000 (visit in a browser)
On the browser side, subtitles are parsed with a slightly modified version of https://github.com/spiegeleixxl/html5-ass-subtitles library, and given in input to Projekktor ( http://www.projekktor.com/ ) along with the path of the file to play.