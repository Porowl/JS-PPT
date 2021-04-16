import {GRAVITY, T_SPIN_STATE, SCORE,GAMEMODE,KEYSTATES,T_KEY as KEY,CLEAR_STRINGS,COMBO_GARB,COMBO_GARB_NERF,SOUNDS,GAUGE_TO_TRASH,playSound
	  } from '../constants.js';

import {socket} from '../main.js';

export default class Storage{
    constructor(user){
        this.user = user;
		
        this.level = 0;
        this.clearedLines = 0;
        this.score = 0;
        this.combo = 0;

        this.b2b = 0;

        /* Settings */

        this.gameMode = GAMEMODE.VERSUS;
        this.nexts = 6;
        this.initKeyMap();
		this.vsBubbling = false;
		
        /* Pieces */
        this.index = 0;
        this.hold;
    }

	setOpponent = type =>{
		if(type==='BUBBLING') {
			this.vsBubbling = true;
		}
	}
	
    getLevel = () => this.level;
    getGravity = () => GRAVITY[Math.min(this.getLevel(),GRAVITY.length-1)];
    getIndex = () => this.index;
    getIndexInc = () => this.index++;

	isComboBroken = () => this.combo === 0;
	
    updateLines = (data,perfect) => {
        let lines = data.length();
        let tspin = data.tSpin;
        let mini = tspin===T_SPIN_STATE.MINI;
        let scoreArr = [];

        let mode;
        if(tspin!==T_SPIN_STATE.NONE) {
            switch(lines) {
                case 0:
                    mode = mini?SCORE.MTS:SCORE.TS;
                    break;
                case 1:
                    mode = mini?SCORE.MTSS:SCORE.TSS;
                    break;
                case 2:
                    mode = SCORE.TSD;
                    break;
                case 3:
                    mode = SCORE.TST;
                    break;
            }
        } else {
            switch(lines) {
                case 0:
                    break;
                case 1:
                    mode = SCORE.SINGLE;
                    break;
                case 2:
                    mode = SCORE.DOUBLE;
                    break;
                case 3:
                    mode = SCORE.TRIPLE;
                    break;
                case 4:
                    mode = SCORE.TETROCKS;
                    break;
            }
        }
        if(mode) {
            scoreArr.push(this.addScore(mode));
        }
        if(perfect) scoreArr.push(this.addScore(SCORE.PERFECT));

        if(this.gameMode == GAMEMODE.VARIABLE)
            lines = this.calculateVariableGoal(mode);
 
        if(this.gameMode == GAMEMODE.VERSUS) {
            if(perfect)
                this.sendGarbage(SCORE.PERFECT);
            else if(mode)
                this.sendGarbage(mode);
        }    
 
        this.clearedLines += lines;
        
        let goal = this.getGoal();
        if(this.clearedLines>=goal) {
            this.clearedLines -=goal;
            this.level++;
        }

		//resetCombo;
        (lines>0)?this.combo++:this.combo=0;
		if(this.combo!=0){
			playSound(playSound(SOUNDS['COMBO'+Math.min(this.combo,8)]));
		}
    
        return scoreArr;
    }

    initKeyMap = () => {
        this.keyMap = [];
        for(var i = 0;i<101;i++){
            this.keyMap.push(false);
        }
    }

	isDownPressed = () => this.keyMap[KEY.DOWN1]||this.keyMap[KEY.DOWN2]
    checkLR = () => {
		let L = this.keyMap[KEY.LEFT1]||this.keyMap[KEY.LEFT2];
		let R = this.keyMap[KEY.RIGHT1]||this.keyMap[KEY.RIGHT2];
        if(L && R) return KEYSTATES.LR;
        else if(L) return KEYSTATES.L;
        else if(R) return KEYSTATES.R;
        return -1;
    }
    checkRot = () => {
		let C = this.keyMap[KEY.CW1]||this.keyMap[KEY.CW2];
		let A = this.keyMap[KEY.ACW1]||this.keyMap[KEY.ACW2];
		
        if(C && A) return KEYSTATES.CA;
        else if(C) return KEYSTATES.C;
        else if(A) return KEYSTATES.A;
        return -1;
    }
    checkHold = () => this.keyMap[KEY.HOLD1]||this.keyMap[KEY.HOLD2];
	resetHoldPress = () => this.keyMap[KEY.HOLD1] = this.keyMap[KEY.HOLD2] = false;
	checkHardDrop = () => this.keyMap[KEY.HDROP1]||this.keyMap[KEY.HDROP2];
	resetHardDropPress = () => this.keyMap[KEY.HDROP1] = this.keyMap[KEY.HDROP2] = false;

    addScore = mode => {
        let last = this.b2b;
        let mult = this.level+1
        let calc = 0;
        let text;
        switch(mode)
        {
            case SCORE.SINGLE:
                calc = 100;
                this.b2b = 0;
                text = CLEAR_STRINGS.SINGLE;
				playSound(SOUNDS.ERASE);
                break;
            case SCORE.DOUBLE:
                calc = 300;
                this.b2b = 0;
                text = CLEAR_STRINGS.DOUBLE;
				playSound(SOUNDS.ERASE);
                break;
            case SCORE.TRIPLE:
                calc = 500;
                this.b2b = 0;
                text = CLEAR_STRINGS.TRIPLE;
				playSound(SOUNDS.ERASE);
                break;
            case SCORE.TETROCKS:
                calc = 800;
                this.b2b++;
                text = CLEAR_STRINGS.TETROCKS;
				playSound(SOUNDS.ERASE4);
                break;
            case SCORE.MTS:
                calc = 100;
                text = CLEAR_STRINGS.T_SPIN + CLEAR_STRINGS.MINI;
				playSound(SOUNDS.TSPIN);
                break;
            case SCORE.MTSS:
                calc = 200;
                this.b2b++;
                text = CLEAR_STRINGS.T_SPIN + CLEAR_STRINGS.MINI + CLEAR_STRINGS.SINGLE;
				playSound(SOUNDS.TSPINC);
                break;
            case SCORE.TS:
                calc = 400;
                text = CLEAR_STRINGS.T_SPIN;
				playSound(SOUNDS.TSPIN);
                break;
            case SCORE.TSS:
                calc = 800;
                this.b2b++;
                text = CLEAR_STRINGS.T_SPIN + CLEAR_STRINGS.SINGLE;
				playSound(SOUNDS.TSPINC);
                break;
            case SCORE.TSD:
                calc = 1200;
                this.b2b++;
                text = CLEAR_STRINGS.T_SPIN + CLEAR_STRINGS.DOUBLE;
				playSound(SOUNDS.TSPINC);
                break;
            case SCORE.TST:
                calc = 1600;
                this.b2b++;
                text = CLEAR_STRINGS.T_SPIN + CLEAR_STRINGS.TRIPLE;
				playSound(SOUNDS.TSPINC);
                break;
            case SCORE.PERFECT:
                this.score += 30000;
                text = CLEAR_STRINGS.PERFECT;
                return [text, 30000];
				playSound(SOUNDS.ERASE4);
        }
        if(last&&this.b2b) calc = calc*1.5
        calc = calc*mult;
        this.score += calc;

        return [text,calc];
    }

    addDropScore = n => this.score+=n;
    
    scoreToText = () => {
        let temp = ""+ this.score;
        while(temp.length<7) {
            temp = "0" + temp;
        }
        return temp;
    }

    getGoal = () => (this.gameMode == GAMEMODE.STATIC)?10:(this.level+1)*5;

    sendGarbage = (mode) => {
		let lines = LINES_ARR[mode];
		if(!lines) lines = 0;
		lines += (this.b2b>1)?1:0;
		
		let vsBubbling = lines;
		if(this.vsBubbling){
			switch(mode) {
				case SCORE.TSD:
					vsBubbling -= 1;
					break;
				case SCORE.TST:
					vsBubbling -= 2;
					break;
				case SCORE.PERFECT:
					vsBubbling -= 4;
					break;
			}
		}	

		vsBubbling += COMBO_GARB_NERF[Math.min(this.combo,COMBO_GARB_NERF.length-1)];
        lines += COMBO_GARB[Math.min(this.combo,COMBO_GARB.length-1)];
		
		let eventName = (this.vsBubbling?'AddGauge':'garbCount');
		
        document.dispatchEvent(
            new CustomEvent(eventName,{
                detail:{
                    n: lines,
					m: vsBubbling
                }
            })
        );
    }
	
	executeGauge = n => {
		if(n==0) return;
		let garbBubbling = GAUGE_TO_TRASH[n];
		socket.emit('sendAttack', garbBubbling);
		socket.emit('fireGarb');
	}
}

const LINES_ARR = {
	[SCORE.SINGLE]: 0,
	[SCORE.DOUBLE]: 1,
	[SCORE.TRIPLE]: 2,
	[SCORE.TETROCKS]: 4,
	[SCORE.MTS]:0,
	[SCORE.MTSS]:2,
	[SCORE.TS]:0,
	[SCORE.TSS]:2,
	[SCORE.TSD]:4,
	[SCORE.TST]:6,
	[SCORE.PERFECT]:10,
};