import Board from './Board.js';
import Stats from './Stats.js';
import PuyoView from './PuyoView.js';
import Puyo from './Puyo.js';
import MultPuyos from './MultPuyos.js';

import {DIRECTION,KICK,PUYO_BOARD_WIDTH} from '../constants.js';
import {socket} from '../main.js';

export default class PuyoPlayer{
    constructor(user = 0)
    {
        this.user = user;
        this.Board = new Board();
        this.Stats = new Stats(user);
        this.Puyo = {};
        this.popArr = {arr:[]};
        this.View = new PuyoView(0);
		this.random = {};

        this.phase = PHASE.NEW_PUYO;
        this.frame = 0;

        this.gameOver = false;

        document.addEventListener(`keydown`,event =>
        {
            if(this.phase == PHASE.DROP)
            {
                if(event.keyCode == 37) setTimeout(()=>
                {
                    if(this.Board.valid(this.Puyo.getPos(DIRECTION.LEFT)))
                    {
                        this.Puyo.move(-1,0);
                    }
                },0)
                else if(event.keyCode == 39) setTimeout(()=>
                {
                    if(this.Board.valid(this.Puyo.getPos(DIRECTION.RIGHT)))
                    {
                        this.Puyo.move(1,0);
                    }
                },0)

                else if(event.keyCode == 38||event.keyCode == 90) setTimeout(()=>
                {
                    let dir = event.keyCode==38?DIRECTION.CW:DIRECTION.ACW
                    let result = this.Board.validRotation(this.Puyo.getPos(),dir)
                    if(result==KICK.NO_ROTATION)
                    {
                        if(this.Puyo.rotation%2==0) this.Puyo.tempRotation = 1;
                    }
                    else this.Puyo.rotate(dir, result);
                },0)

                else if(event.keyCode == 40) setTimeout(()=>
                {
                    if(this.Board.valid(this.Puyo.getPos(DIRECTION.DOWN)))
                    {
                        this.Puyo.move(0,1);
                    }
                },0)
            }
            //this.Stats.keyMap[event.keyCode] = true;
        });

        document.addEventListener(`up`,event =>
        {
            //this.Stats.keyMap[event.keyCode] = false;
        });
		
		document.addEventListener(`garbCountP${this.user}`, event=> {
            let garbs = this.Board.deductGarbage(event.detail.n);
			if(this.Stats.vsTetris){
				if(garbs!=0) {
					console.log(event.detail.m);
					socket.emit(`attackFromP${this.user}`,event.detail.m);
				}
			} else if(garbs>0) {
				console.log(garbs);
				socket.emit(`attackFromP${this.user}`,garbs);	
			}
		});
		
		socket.on(`attackOnP${this.user}`,data=>
        {
            this.Board.addGarbage(data);
            this.View.showGarbage(this.Board.garbage); 
        });
    }

	gameStart = () =>{
		this.Stats.setGameStarted();
	}
	
    update = () =>
    {
        //console.log(`Current Phase is: ${this.phase}`);
        switch(this.phase)
        {
			case PHASE.STAND_BY:
			{
				break;
			}
            case PHASE.DROP:
            {
                this.View.moveCycle();
                this.frame++;
                if(this.frame%60===0)
                {
                    if(this.Board.valid(this.Puyo.getPos(DIRECTION.DOWN)))
                        this.Puyo.move(0,1);
                    else{
                        this.phase++;
                    }
                }
                break;
            }

            case PHASE.LOCK:
            {
                this.Board.lockMult(this.Puyo)
                    this.phase++;
				this.View.drawBoard(this.Board);
                break;
            }

            case PHASE.FALL:
            {
                let array = this.Board.fall();
                this.View.drawBoard(this.Board);
                this.View.fallingPuyos(array);
                this.phase++;
                break;
            }

            case PHASE.FALL_ANIMATION:
            {
                if(!this.View.fallCycle()) this.phase++;
                break;
            }

            case PHASE.FALL_ANIMATION_END:
            {
                let arr = this.View.getPuyoArr();

                for(let x = 0; x<PUYO_BOARD_WIDTH;x++)
                {
                    for(let puyo of arr[x])
                    {
                        this.Board.lockSingle(puyo);
                    }
                }
                this.View.emptyArray();
                this.View.drawBoard(this.Board);
                this.phase++;
                break;
            }

            case PHASE.CALC:
            {
                this.phase++;
                this.popArr = this.Board.calc();
                break;
            }

            case PHASE.POP:
            {
                this.View.popFrame = 0;
                if(this.popArr.arr.length>0)
                {
                    this.Stats.calcScore(this.popArr);
                    this.Board.pop(this.popArr.arr);
                    this.View.drawBoard(this.Board);
                    this.phase++;
				} else {
					this.phase = PHASE.NEW_PUYO;
				}
                break;
            }

            case PHASE.POP_ANIMATION:
            {
                if(this.View.popCycle(this.popArr.arr)) {
						this.phase = PHASE.NEW_PUYO;
				}
	            this.View.showGarbage(this.Board.garbage); 
                break;
            }

			case PHASE.GARB:
			{
                let arr = this.Board.executeGarbage();
				this.View.showGarbage(this.Board.garbage)
                this.View.fallingPuyos(arr);
				this.phase++;
				break;
			}
			
			case PHASE.GARB_FALL:
			{
                if(!this.View.fallCycle()) this.phase++;
				break;
			}
            case PHASE.GARB_FALL_ANIMATION_END:
            {
				let arr = this.View.getPuyoArr();

				for(let x = 0; x<PUYO_BOARD_WIDTH;x++) {
					for(let puyo of arr[x]) {
						this.Board.lockSingle(puyo);
					}
				}
				this.View.emptyArray();
				this.View.drawBoard(this.Board);
				this.phase++;
                break;
            }

            case PHASE.NEW_PUYO:
            {
                if(this.popArr.arr.length>0){this.phase = PHASE.FALL; break;}
                if(this.Board.garbage>0){this.phase = PHASE.GARB; break;}
				
				this.popArr.arr.length = 0;
				
                if(this.Board.blocked()) {
					this.phase = PHASE.GAME_OVER;
					break;
				}
				
                this.Stats.resetChain();
                this.Puyo = this.getPuyo();

                this.View.emptyArray();
                this.View.addMultPuyo(this.Puyo);
				
				let i = this.Stats.getIndex()
				let p1 = this.random.getPuyo(i);
				let p2 = this.random.getPuyo(i+1);
				this.View.drawNexts(p1,p2);

                this.phase = PHASE.DROP;
                break;
            }

            case PHASE.GAME_OVER:
            {
				this.phase = PHASE.STAND_BY;
				socket.emit('gameOver');
                break;   
            }
        }
        return true;
    }

    getPuyo = () =>
    {
        const ranNum = this.random.getPuyo(this.Stats.getIndexInc());
        const p1 = ( ranNum & 0o70 ) / 0o10;
        const p2 = ranNum % 0o10;
        return new MultPuyos(new Puyo(p1),new Puyo(p2))
    }
	
	setOpponent = type => {
		this.Stats.setOpponent(type);
	};
}

const PHASE = 
{
    DROP: 0,
    LOCK: 1,
    FALL: 2,
    FALL_ANIMATION: 3,
    FALL_ANIMATION_END: 4,
    CALC: 5,
    POP:6,
    POP_ANIMATION:7,
	GARB:8,
	GARB_FALL:9,
	GARB_FALL_ANIMATION_END:10,
    NEW_PUYO:11,

    GAME_OVER:99
}