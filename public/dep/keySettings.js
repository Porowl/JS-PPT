import {T_KEY,P_KEY,T_KEY_DEFAULT,P_KEY_DEFAULT} from '../constants.js';

const keySettings = {};

const initHtml = () => {
	let keySettingHtml = document.getElementsByClassName('keySettings')[0];
	keySettingHtml.innerHTML = keySettingsContents;
}

const loadKeySettings = () => {
	if(!storageAvailable()) return;
	for (const property in localStorage) {
		let key = parseInt(localStorage[property]);
		const target = document.querySelector('#'+property);
		if(target !== null) {
			let text = charArr[key];
			if(!text) text = String.fromCharCode(key); // add custom key symbol arr;
			target.innerText = text;
			keySettings[property] = key;   
		}
		var name = property.split('_')
		let arr = (name[0]=='T')?T_KEY:P_KEY;
		arr[name[1]] = key
	}
}

export const storageAvailable = () => {
    try{
        return localStorage !== null;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const keySettingEvent = () => {
	initHtml();
	loadKeySettings();
	
	const keyChangeWrapper = document.getElementById('keyChangeWrapper');
	const keyChangeContainer = document.querySelector('.keyChangeContainer');
	const bindKeyTo = document.getElementById('bindKeyTo');
	const keyPressed = document.getElementById('keyPressed');
	const restoreButton = document.getElementById('r');
	const closeButton = document.getElementById('c');
	
	const popUp = event => {
		let target = event.target;
		if (target && target.nodeName == 'TD' && target.id) {
			let parent = target.parentNode;
			if(!parent) return false;
			
			bindKeyTo.innerText = parent.childNodes[0].innerText;
			keyPressed.innerText = target.innerText;
			keyChangeWrapper.classList.remove('hidden');
			
			let prev;
			if(storageAvailable()) prev = localStorage[target.id];
			
			let id = target.id.split('_');
			let tarArr = (id[0]=='T')?T_KEY:P_KEY;
			let defaultArr = (id[0]=='T')?T_KEY_DEFAULT:P_KEY_DEFAULT;
			let key = id[1]; 
			const defaultCode = defaultArr[key];
			
			const getInput = e => {
				e.preventDefault();
				if(e.keyCode == 27) {
					unbind();
				}
				else if(e.keyCode == keySettings[target.id]) {
					close();
				} else {
					let temp = charArr[e.keyCode];
					if(!temp) temp = e.key;
					target.innerText = temp;
					keyPressed.innerText = temp;
					keySettings[target.id] = e.keyCode;
				}
			}
			
			const unbind = () => {
				console.log('unbound');
				delete keySettings[target.id];
				if (storageAvailable()) delete localStorage[target.id];
				keyPressed.innerText = null;
				target.innerText = null;
			}
			
			const restore = () => {
				let code = (prev===undefined)?defaultCode:prev;
				let temp = charArr[code];
				if(!temp) temp = String.fromCharCode(code);
				keyPressed.innerText = temp;
				target.innerText = temp;
				keySettings[target.id] = code;
			}
						
			const save = () => {
				tarArr[key] = keySettings[target.id];
				if(storageAvailable()) localStorage[target.id] = keySettings[target.id];
			}
			
			const clickedOutside = e => {if(!keyChangeContainer.contains(e.target)) close();}
			
			const close = () => {
				document.removeEventListener('keydown',getInput);
				keyChangeWrapper.classList.add('hidden');
				restoreButton.removeEventListener('click',restore);
				closeButton.removeEventListener('click',close)
				document.querySelector('#keyChangeWindow').removeEventListener('click',clickedOutside);
				save();
			}
			
			restoreButton.addEventListener('click',restore);
			closeButton.addEventListener('click',close)
			document.addEventListener('keydown',getInput);
			document.querySelector('#keyChangeWindow').addEventListener('click',clickedOutside);
		}
	}
    document.querySelector(".keySettings").addEventListener('click',popUp);
};

const restoreDefaults = () => {
	if (storageAvailable()) localStorage.clear();
	for(let property in T_KEY){
		T_KEY[property] = T_KEY_DEFAULT[property];
	}
	for(let property in P_KEY){
		P_KEY[property] = T_KEY_DEFAULT[property];
	}
	initHtml();
}

const charArr = {
	[17]: 'CTRL',
	[21]: 'R ALT',
	[25]: 'HANJA',
	[32]: 'SPACE',
	[37]: '←',
	[38]: '↑',
	[39]: '→',
	[40]: '↓'
}

const keySettingsContents = `
<table>
	<th colspan="3">TETROCKS</th>
	<tr><td>MOVE LEFT	</td><td id="T_LEFT1" 	class="kb">←	</td><td id="T_LEFT2" 	class="kb">		</td></tr>
	<tr><td>MOVE RIGHT	</td><td id="T_RIGHT1"	class="kb">→	</td><td id="T_RIGHT2"	class="kb">		</td></tr>
	<tr><td>SOFT DROP	</td><td id="T_DOWN1" 	class="kb">↓	</td><td id="T_DOWN2" 	class="kb">		</td></tr>
	<tr><td>HARD DROP	</td><td id="T_HDROP1"	class="kb">SPACE</td><td id="T_HDROP2"	class="kb">		</td></tr>
	<tr><td>Rotate  CW	</td><td id="T_CW1" 	class="kb">↑	</td><td id="T_CW2" 	class="kb">X	</td></tr>
	<tr><td>Rotate ACW	</td><td id="T_ACW1" 	class="kb">CTRL	</td><td id="T_ACW2" 	class="kb">Z	</td></tr>
	<tr><td>HOLD		</td><td id="T_HOLD1"	class="kb">SHIFT</td><td id="T_HOLD2" 	class="kb">C	</td></tr>
</table>
<table>
	<th colspan="3">BUBBLINGS</th>
	<tr><td>MOVE LEFT	</td><td id="B_LEFT1"	class="kb">←	</td><td id="B_LEFT2"	class="kb">		</td></tr>
	<tr><td>MOVE RIGHT	</td><td id="B_RIGHT1"	class="kb">→	</td><td id="B_RIGHT2"	class="kb">		</td></tr>
	<tr><td>SOFT DROP	</td><td id="B_DOWN1" 	class="kb">↓	</td><td id="B_DOWN2"	class="kb">		</td></tr>
	<tr><td>Rotate  CW	</td><td id="B_CW1" 	class="kb">Z	</td><td id="B_CW2"	class="kb">↑	</td></tr>
	<tr><td>Rotate ACW	</td><td id="B_ACW1" 	class="kb">X	</td><td id="B_ACW2"	class="kb">CTRL	</td></tr>
</table>
<div style="width:20%;" class="small_menu_button hoverButton" onclick="restoreDefaults();">RESTORE DEFAULTS</div>
`;

window.keySettingEvent = keySettingEvent;
window.restoreDefaults = restoreDefaults;