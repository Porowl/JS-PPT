import {socket} from  '../main.js';
import {SOUNDS, BGM} from  '../constants.js';

export const AudioManager = {
	vars:{
		sfxVolume: 0.35,
		voiceVolume: 0.35,
		bgmVolume: 0.35,
		bgm: new Audio(BGM)
	},
	setVolume: function(setting, n) {
		this.vars[setting] = n;
		if(setting==='bgmVolume') this.bgm.volume = this.vars.bgmVolume;
	},
	playSound: function(setting, url, sendEnemy = true) {
		let aud = new Audio(url);
		aud.volume = this.vars[setting];
		aud.play();
		if(sendEnemy) {
			socket.emit('aud',{setting,url});
		}
	},
	playBgm: function(url){
		if(this.bgm) this.bgm.pause();
		delete this.bgm;
		let bgm = new Audio(url);
		bgm.volume = this.vars.bgmVolume;
		bgm.play();
		this.bgm = bgm;
	},
	playVoice: function(url, sendEnemy = true) {
		this.playSound('voiceVolume', url, sendEnemy);
	},
	playSfx: function(url,sendEnemy = true) {
		this.playSound('sfxVolume', url, sendEnemy);
	}
}