export default class Randomizer{
    constructor(seed){
		this.engine = new Math.seedrandom(seed);
        this.bag = [];
        this.pieces = [];
		this.puyos = [];
		
		this.initPuyoBag();
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
        for(var i = 0; i<7;i++){
            this.addPiece;
        }
        return tempArr;
    }

    addPiece = () => {
        let rand = this.engine()*this.bag.length|0;
		let pulled = this.bag.splice(rand,1);
		this.pieces.push(pulled);
		
		this.refillBag();
    }

    refillBag = () =>
    {
        if(this.bag.length == 0) {
			for(var i = 0; i<7; i++){
				this.bag.push(i);
			}
		}
    }
	
	getPuyo = (index = 0) =>
    {
		index = index % this.puyos.length;
        return this.puyos[index];
    }
	
	getNextPuyos = index =>
	{
		this.puyos.slice(index,index+3);
	}
	
	initPuyoBag = () => {
		let arr = [];
		
		for(let i = 0; i<16; i++) {	
			for(let j = 0; j<16; j++) {
				arr.push(j);	
			}
			while(arr.length>0){
				let rand = this.engine()*arr.length|0;
				let pulled = arr.splice(rand,1);
				this.puyos.push(pulled);				
			}
		}
	}
}