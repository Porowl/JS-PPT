import {XY_OFFSETS,DIRECTION,KICK} from '../constants.js'

export default class MultBubblings{
    constructor(piece1, piece2)
    {
        this.mainPiece = piece1;
        this.subPiece = piece2;
        this.subPiece.setPos(2,-1);
        this.rotation = 0;
        this.tempRotation = 0;
    }

    getPos = (direction = DIRECTION.NONE) =>
    {
        let data = {
            color1: this.mainPiece.type,
            x: this.mainPiece.x + direction[0],
            y: this.mainPiece.y + direction[1],

            color2: this.subPiece.type,
            dx: XY_OFFSETS[this.rotation][0],
            dy: XY_OFFSETS[this.rotation][1],

            rotation: this.rotation,
            tempRotation: this.tempRotation
        }
        return data;
    }

    rotate = (direction,kick) =>
    {
        switch(kick)
        {
            case KICK.DONT_PUSH:
                break;
            case KICK.PUSH_LEFT:
                this.move(-1,0);
                break;
            case KICK.PUSH_RIGHT:
                this.move(1,0);
                break;
            case KICK.PUSH_UP:
                this.move(0,-1);
                break;
        }

        this.rotation = (this.rotation + 4 + direction + this.tempRotation)%4;
        this.tempRotation = 0;
        
        this.subPiece.setPos(this.mainPiece.x+XY_OFFSETS[this.rotation][0],
                            this.mainPiece.y+XY_OFFSETS[this.rotation][1]);
        this.subPiece.rotation = this.rotation;
        this.subPiece.direction = direction;
        this.subPiece.onRotate = true;
    }

    move = (x = 0,y = 0) =>
    {
        if(x===0&&y===0)console.error(`CAUTION: x,y not passed`);

        this.mainPiece.movePos(x,y);
        this.subPiece.movePos(x,y);
    }

    toggleTempRotation = () =>
    {
        this.tempRotation = this.tempRotation ^ 1
    }
}