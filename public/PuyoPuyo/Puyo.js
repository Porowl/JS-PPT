import {PUYO_SIZE,DIRECTION,PUYO_STATE,PUYO_BOARD_HEIGHT} from '../constants.js';

export default class Puyo{
    constructor(type)
    {
        this.type = type;
        this.initPos();
        this.velocity = 0;
        this.direction = DIRECTION.CW;
        this.rotation = 0;
        this.onRotate = false;
        this.angle = 0;
        this.state = PUYO_STATE.N;
    }

    initPos = () =>
    {
        this.x = 2;
        this.y = 0;
        this.gX = this.x*PUYO_SIZE //Graphic X
        this.gY = this.y*PUYO_SIZE
        this.limit = PUYO_BOARD_HEIGHT;
    }

    movePos = (x,y) =>
    {
        this.x += x;
        this.y += y;
    }

    setPos = (x,y) =>
    {
        this.x = x;
        this.y = y;
        this.gX = x*PUYO_SIZE;
        this.gY = y*PUYO_SIZE;
    }

    setLimit = y =>
    {
        this.limit = y;
    }

    /**
     * Returns true if fall completed;
     */
    fall = () =>
    {
        this.velocity += 0.25;
        this.gY += this.velocity;

        if(this.gY>this.limit*PUYO_SIZE)
        {
            this.velocity = 0;
            this.setPos(this.x, this.limit);
            return true;
        }

        return false;
    }

    move = () => {
        let dx = (this.x * PUYO_SIZE - this.gX) * 0.4 | 0;
        let dy = (this.y * PUYO_SIZE - this.gY) * 0.4 | 0;

        if(dx == 0)
            this.gX = this.x * PUYO_SIZE;
        if(dy == 0)
            this.gY = this.y * PUYO_SIZE;

        this.gX += dx;
        this.gY += dy;
    }

    moveRotate = (x,y) => {
        if(this.onRotate)
        {
            this.angle += Math.PI/2/7 * this.direction;
            this.angle = (this.angle+Math.PI*2) % (Math.PI*2);
            this.gX = x+Math.sin(this.angle)*PUYO_SIZE
            this.gY = y-Math.cos(this.angle)*PUYO_SIZE 
            let targetAngle = Math.PI/2 * this.rotation;
            if(Math.abs(this.angle-targetAngle)<0.001) this.onRotate = false;
        } else {
            this.move();
        }
    }
}