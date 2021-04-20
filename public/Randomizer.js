export default class Randomizer{
    constructor(seed){
		this.engine = new Math.seedrandom(seed);
        this.bag = [];
        this.pieces = [];
		this.bubblings = [];
		
		this.initBubblingBag();
		this.initPieces();
    }

    getPiece = (index) =>
    {
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
	
	getBubbling = (index = 0) =>
    {
		index = index % this.bubblings.length;
        return this.bubblings[index];
    }
	
	getNextBubblings = index =>
	{
		this.bubblings.slice(index,index+3);
	}
	
	initBubblingBag = () => {
		let arr = [];
		
		for(let i = 0; i<16; i++) {	
			for(let j = 0; j<16; j++) {
				arr.push(j);	
			}
			while(arr.length>0){
				let rand = this.engine()*arr.length|0;
				let pulled = arr.splice(rand,1);
				this.bubblings.push(pulled);				
			}
		}
	}
}