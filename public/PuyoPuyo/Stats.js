import {CHAIN_BONUS,COLOR_BONUS,GROUP_SIZE_BONUS} from '../constants.js';

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
		
		this.remaining = 0;
		
		this.gameStartedAt = Date.now();
		
        this.keyMap = this.initKeyMap()
    }

	setGameStarted = () => {
		this.gameStatedAt = Date.now();
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
		
        this.chain++;
		console.log(score);
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
		
		let margin = this.getMargin();

		garbs = ds / margin + this.leftOver;
		
		this.leftOver = (garbs>1) ? garbs % 1 : 0;

		garbs = garbs | 0;
		if (garbs == 0) return;
		
		console.log(garbs);
		
        document.dispatchEvent(
            new CustomEvent(`garbCountP${this.user}`,{
                detail:{
                    n:garbs
                }
            })
        );
	}
	
	getMargin = () => {
		let margin = 60;
		
		let dt = Date.now() - this.gameStartedAt;
		if(dt>=96000) {
			dt -= 96000;
			let exp = Math.max((1 + dt/14000 ) | 0,14);
			margin = Math.pow(margin,exp)|0;
		}
		return margin;
	}
}