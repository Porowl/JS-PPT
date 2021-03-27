import {LAST_MOVE} from '../constants.js'; 

/**
 * Mino is a class that contains information of each mino
 */
export default class Mino {
	constructor(i) {
		this.typeId = i;
		this.x = 3;
		this.y = 18;
		this.rotation = 0;
		this.rotTest = 0;
		this.lastMove = LAST_MOVE.NONE;
		this.hardDropped = false;
	}

	/**
     * store hardDropped value as true. Used as triggered to move on to lock phase.
     */
	hardDrop = () => {
		this.hardDropped = true;
	}

    /**
     * Move Mino by x and y
     * @param {Number} x 
     * @param {Number} y 
     */
	move = (x, y) => {
		if (this.hardDropped) return;
		this.x += x;
		this.y += y;
		this.lastMove = LAST_MOVE.MOVE;
	}

    /**
     * Rotate Mino by dir. 1 = CW, 3 = CCW
     * @param {Number} dir 
     */
	rotate = dir => {
		this.rotation = (this.rotation + dir) % 4;
		this.lastMove = LAST_MOVE.SPIN;
	}
}