import {BUBBLING_SIZE,DIRECTION,BUBBLING_STATE,BUBBLING_BOARD_HEIGHT} from '../constants.js';

export default class Bubbling{
    constructor(type) {
		this.type = type;
		this.state = BUBBLING_STATE.N;
		this.initPos();
		this.velocity = 0;
		this.direction = DIRECTION.CW;
		this.rotation = 0;
		this.frame = 0;
		this.angle = 0;
    }

    initPos = () => {
		this.x = 2;
		this.y = 0;
		this.suby = 0;
		this.gX = this.x*BUBBLING_SIZE //Graphic X
		this.gY = this.y*BUBBLING_SIZE
		this.limit = BUBBLING_BOARD_HEIGHT;
    }

    movePos = (x,y) => {
		this.x += x;
		this.y += y;
    }

    setPos = (x,y) => {
		this.x = x;
		this.y = y;
		this.gX = x*BUBBLING_SIZE;
		this.gY = y*BUBBLING_SIZE;
    }

    setLimit = y => {
        this.limit = y;
    }

    /**
     * Returns true if fall completed;
     */
    fall = () => {
        this.velocity += 0.20;
        this.gY += this.velocity;

        if(this.gY>this.limit*BUBBLING_SIZE) {
            this.velocity = 0;
            this.setPos(this.x, this.limit);
            return true;
        }
        return false;
    }

    moveLR = () => {
        let dx = (this.x * BUBBLING_SIZE - this.gX) * 0.4 | 0;
        let dy = (this.y * BUBBLING_SIZE - this.gY + this.suby) * 0.4 | 0;

		if(dx == 0)
            this.gX = this.x * BUBBLING_SIZE;
        if(dy == 0)
            this.gY = this.y * BUBBLING_SIZE;
        this.gX += dx;
		this.gY += dy;
    }
	
	moveDown = keyDown => {
		this.suby += keyDown ? BUBBLING_SIZE/2 : BUBBLING_SIZE/16;
		if(this.suby>BUBBLING_SIZE) {
			this.suby -= BUBBLING_SIZE;
			this.y++
		};
	}

    moveRotate = (x,y, keyDown) => {
        if(this.frame>0) {
            this.angle += Math.PI/16 * this.direction;
            this.angle = (this.angle+Math.PI*2) % (Math.PI*2)
            this.gX = x + Math.sin(this.angle)*BUBBLING_SIZE
            this.gY = y - Math.cos(this.angle)*BUBBLING_SIZE 
            if(++this.frame>8) this.frame = 0;
        } else {
            this.moveLR();
        }
    }
	
	onRotate = () => this.frame !=0;
}