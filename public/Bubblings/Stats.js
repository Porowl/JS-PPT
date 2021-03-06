import {CHAIN_BONUS,COLOR_BONUS,GROUP_SIZE_BONUS,VS_TETROCKS_SCORE,playSound,VOICES,SOUNDS,P_KEY as KEY,KEYSTATES} from '../constants.js';
import {AudioManager} from '../dep/AudioManager.js';
import {socket} from '../main.js';

export default class Stats{
    constructor(user)
    {
        this.user = user;
        this.index = 0;
        this.score = 0;
        this.chain = 0;
		this.last = 0;
		this.leftOver = 0;
		this.leftOverVsTETROCKS = 0;
		
		this.remaining = 0;
		
		this.vsTETROCKS = false;
		
		this.gameStartedAt = Date.now();
		
        this.keyMap = this.initKeyMap()
    }

	setGameStarted = () => {
		this.gameStatedAt = Date.now();
	}
	
	setOpponent = type =>{
		if(type==='TETROCKS') {
			this.vsTETROCKS = true;
		}
	}
	
    getIndexInc = () => this.index++;
    getIndex = () => this.index;

    initKeyMap = () => {
        let arr = [];
        for(let i = 0; i<101; i++)
            arr.push(false);
		return arr;
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
	
    calcScore = (data) =>
    {
        //Score = (10 * NumPopped) * (ChainPower + ColorBonus + GroupBonus)
        //GarbageGenerated = Score / Margin + LeftoverPoints
        let numPopped = data.arr.length - data.numTrash;
        let chainPower = CHAIN_BONUS[Math.min(this.chain,CHAIN_BONUS.length-1)];
        let colorBonus = COLOR_BONUS[data.colors-1];
        let groupBonus = 0;
		
		for(var i in data.groups) {
			groupBonus += GROUP_SIZE_BONUS[i];
		}

        let multiplier = Math.max(1,(chainPower + colorBonus + groupBonus))
        let score = 10 * numPopped * multiplier;
		
        this.score += score;
		this.chain++;

		AudioManager.playVoice(VOICES.ARLE.COMBO(this.chain));

		this.sendAttack();
		
		let temp = ""+ numPopped*10;
        if(temp.length==2) temp += ' ';
		temp += 'x';
		
		let mult = "" + multiplier;
		while(temp.length<3)
        {
            mult = "0" + mult;
        }
        return temp + mult;
    }

	isOnChain = () => {
		return this.chain >0;
	}
	
    resetChain = () => {
        this.chain = 0;
    }
	
	sendAttack = () => {
		let garbs = 0;
		
		// GarbageGenerated = Score / Margin + LeftoverPoints
		
		let ds = this.score-this.last;
		this.last = this.score;
		let multiplier = this.getMargin();
		let vsTETROCKS = 0;
		let sc = ds;
		let threshold = 0;
		let nextThreshold;
		let index = 0;
		
		// vs BUBBLING calculation
		garbs = ds / (60 * multiplier|0) + this.leftOver;
		this.leftOver = garbs % 1;		
		garbs = garbs | 0;
		
		// vs TET calculation
		while(index < VS_TETROCKS_SCORE.length){
			nextThreshold = Math.max(1,VS_TETROCKS_SCORE[index] * multiplier|0);
			if(sc<nextThreshold) break;
			threshold = nextThreshold;
			index++;
		}
		
		vsTETROCKS = Math.min(index,VS_TETROCKS_SCORE.length);

		this.leftOverVsTETROCKS += (sc-threshold)/nextThreshold;

		if(this.chain>=8 && (this.chain-8%3 == 0)){
			if(this.leftOverVsTETROCKS>1){
				vsTETROCKS++;
				this.leftOverVsTETROCKS--;
			}
		}
		
		// send event
        document.dispatchEvent(
            new CustomEvent('garbCount',{
                detail:{
                    n:garbs,
					m:vsTETROCKS
                }
            })
        );
	}
	
	getMargin = () => {
		let dt = Date.now() - this.gameStartedAt;
		let exp = 1;
		let multiplier = 1;
		if(dt >= 96000) {
			dt -= 96000;
			let exp = Math.min((1 + dt/14000 ) | 0, 14);
			multiplier = Math.pow(0.75, exp);
		}
		return multiplier;
	}
	
	scoreToText = () => {
        let temp = "" + this.score;
        while(temp.length<7)
        {
            temp = "0" + temp;
        }
        return temp;
    }
}