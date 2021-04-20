export default class Randomizer{
    constructor(seed){
		this.engine = new Math.seedrandom(seed);
        this.bag = [];
        this.pieces = [];
		this.bubblings = [];
		
		this.initBubblingBag();
		this.initPieces();
    }

    getPiece = (index) => {
        while(this.pieces.length<index+8) this.addPiece();
        return this.pieces[index];
    }

    /**
     * 다음 n 번째 블럭을 가져옵니다.
     * @param {int} n 
     */
    nextPieces = (index) => this.pieces.slice(index,index+7);
    
    /**
     * 첫 7개 블럭을 생성합니다.
     */
    initPieces = () => {
		this.refillBag();
        for(var i = 0; i<7;i++){
            this.addPiece();
        }
    }

    addPiece = () => {
        let rand = this.engine()*this.bag.length|0;
		let pulled = this.bag.splice(rand,1)[0];
		this.pieces.push(pulled);
		
		this.refillBag();
    }

    refillBag = () => {if(!this.bag.length) for(let i = 0; i<7; i++)this.bag.push(i);}
	
	getBubbling = (index = 0) => {
		index = index % this.bubblings.length;
        return this.bubblings[index];
    }
	
	getNextBubblings = index => {
		this.bubblings.slice(index,index+3);
	}
	
	initBubblingBag = () => {
		let arr = [];
		for(let i = 0; i<16; i++) {	
			for(let j = 0; j<16; j++) {
				arr.push(j);	
			}
			while(arr.length){
				let rand = this.engine()*arr.length|0;
				let pulled = arr.splice(rand,1);
				this.bubblings.push(pulled);	
			}
		}
		while(this.checkIfIllegalStart()) this.shuffleInitBag();
	}
	
	checkIfIllegalStart = () => {
		let p0 = this.bubblings[0];
		let p1 = this.bubblings[1];
		const c0 = ( p0 & 0xc ) / 0x4;
		const c1 = p0 % 0x4;
		const c2 = ( p1 & 0xc ) / 0x4;
		const c3 = p1 % 0x4;
		let result = 0b0000;
		
		result = result | (0b0001 << c0) | (0b0001 << c1) | (0b0001 << c2) | (0b0001 << c3);
		return result == 0b1111;
	}
	
	shuffleInitBag = () => {
		let rand = 2 + (this.engine() * 14 | 0);
		let temp = this.bubblings[rand];
		this.bubblings[rand] = this.bubblings[0];
		this.bubblings[0] = temp;
	}
}