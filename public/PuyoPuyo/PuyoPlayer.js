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
            let garbs = this.Board.deductGarbage(event.detail.n)
			console.log(garbs);
            if(garbs>0) {
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

    update = () =>
    {
        //console.log(`Current Phase is: ${this.phase}`);
        switch(this.phase)
        {
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
					if(this.Board.garbage>0){
						this.phase = PHASE.GARB;
					} else {
						this.phase = PHASE.NEW_PUYO;
					};
				}
                break;
            }

			case PHASE.GARB:
			{
                let arr = this.Board.executeGarbage();
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
				console.log(arr);

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
				this.View.drawNexts();

                this.phase = PHASE.DROP;
                break;
            }

            case PHASE.GAME_OVER:
            {
                this.gameOver = true;
                return false;   
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
	
	setOpponent = () => {};
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