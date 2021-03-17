import {CHAIN_BONUS,COLOR_BONUS,GROUP_SIZE_BONUS,VS_TETRIS_SCORE,playSound,VOICES,SOUNDS} from '../constants.js';

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
		this.leftOverVsTetris = 0;
		
		this.remaining = 0;
		
		this.vsTetris = false;
		
		this.gameStartedAt = Date.now();
		
        this.keyMap = this.initKeyMap()
    }

	setGameStarted = () => {
		this.gameStatedAt = Date.now();
	}
	
	setOpponent = type =>{
		if(type==='TETRIS') {
			this.vsTetris = true;
		}
	}
	
    getIndexInc = () => this.index++;
    getIndex = () => this.index;

    initKeyMap = () =>
    {
        let arr = [];
        for(let i = 0; i<101; i++)
            arr.push(false);
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
		
		playSound(playSound(VOICES.ARLE.COMBO(this.chain++)));

		this.sendAttack();
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
		let vsTetris = 0;
		let sc = ds;
		let threshold = 0;
		let nextThreshold;
		let index = 0;
		
		console.log(sc);
		// vs PUYO calculation
		garbs = ds / (60/multiplier|0) + this.leftOver;
		this.leftOver = garbs % 1;		
		garbs = garbs | 0;
		
		// vs TET calculation
		while(index < VS_TETRIS_SCORE.length){
			nextThreshold = ( VS_TETRIS_SCORE[index] /multiplier | 0);
			console.log(nextThreshold);
			if(sc<nextThreshold) break;
			threshold = nextThreshold;
			index++;
		}
		
		vsTetris = Math.min(index,VS_TETRIS_SCORE.length);

		this.leftOverVsTetris += (sc-threshold)/nextThreshold;

		if(this.chain>=8 && (this.chain-8%3 == 0)){
			if(this.leftOverVsTetris>1){
				vsTetris++;
				this.leftOverVsTetris -= 1;
			}
		}
		
		console.log(vsTetris);
        document.dispatchEvent(
            new CustomEvent(`garbCountP${this.user}`,{
                detail:{
                    n:garbs,
					m:vsTetris
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
			let exp = Math.max((1 + dt/14000 ) | 0,14);
			multiplier = Math.pow(0.75, exp);
		}
		return multiplier;
	}
}