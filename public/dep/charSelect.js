import {AudioManager} from './AudioManager.js';
import {socket} from '../main.js';

export const initCharSelect = () => {
	const selectChar = event => {
		let target = event.target;
		if (target && target.id && !target.classList.contains('notAvailable')) {
			socket.emit('charSelect',target.id);
		};
	};	
	document.querySelector(".charSelectWrapper").addEventListener('click',selectChar);
}

export class char {
	constructor(id){
		this.id = id;
	}
	
	playCombo = n => {
		let url = VOICES[this.id]['COMBO'+Math.min(n,8)];
		AudioManager.playVoice(url);
	}
	
	playDamageReceived = n => {
		let url = VOICES[this.id]['DAMAGE'+(n<30)?'SMALL':'HUGE'];
		AudioManager.playVoice(url);
	}
	
	playOnSelect = () => {
		let url = VOICES[this.id]['ON_SELECT'];
		AudioManager.playVoice(url);
	}
	
	playOnVictory = () => {
		let url = VOICES[this.id]['ON_VICTORY'];
		AudioManager.playVoice(url);
		
	}
	playOnDefeat = () => {
		let url = VOICES[this.id]['ON_DEFEAT'];
		AudioManager.playVoice(url);
	}
}

const VOICES = [
	
]; 