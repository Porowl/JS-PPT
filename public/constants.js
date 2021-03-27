/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HTML TAGS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
export const canvas0 = document.getElementById("board");
export const canvas1 = document.getElementById("mino");
export const canvas2 = document.getElementById("infos");
export const canvas3 = document.getElementById("animation");
export const ctx0 = canvas0.getContext("2d");
export const ctx1 = canvas1.getContext("2d");
export const ctx2 = canvas2.getContext("2d");
export const ctx3 = canvas3.getContext("2d");

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~STRINGS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const NEXT = "NEXT";
export const HOLD = "HOLD";
export const LEVEL = "LEVEL";
export const REMAINING = "LINES REMAINING:"
export const DEATH_MESSAGE = i => `Player ${i+1} topped out.`;

export const CLEAR_STRINGS = Object.freeze(
{
    SINGLE: "SINGLE",
    DOUBLE: "DOUBLE",
    TRIPLE: "TRIPLE",
    TETROCKS: "TETROCKS",
    MINI: "MINI ",
    T_SPIN: "T-SPIN ",
    PERFECT: "PERFECT"
});

export const GAMEMODE_NAMES = Object.freeze(
{
    0: "NORMAL",
    1: "VARIABLE",
    2: "VERSUS"
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GRAPHIC MEASUREMENTS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const BUBBLING_BOARD_WIDTH = 6;
export const BUBBLING_BOARD_HEIGHT = 13;
export const BUBBLING_VISIBLE_HEIGHT = 12;

export const BUBBLING_SIZE = 32;

export const BOARD_HEIGHT  = 40;
export const BOARD_WIDTH   = 10;

export const VISIBLE_HEIGHT = 20;

export const BLOCK_SIZE = 18;
export const NEXT_BLOCK_SIZE = 10;
export const HOLD_BLOCK_SIZE = 15;

export const BLOCK_SIZE_OUTLINE = BLOCK_SIZE+1;
export const NEXT_BLOCK_SIZE_OUTLINE = NEXT_BLOCK_SIZE+1;
export const HOLD_BLOCK_SIZE_OUTLINE = HOLD_BLOCK_SIZE+1;

export const X_OFFSET = 160;
export const Y_OFFSET = 40;

export const BOARD_CENTER_X = X_OFFSET + BLOCK_SIZE_OUTLINE*5;
export const BOARD_CENTER_Y = Y_OFFSET + BLOCK_SIZE_OUTLINE*10;
export const BOARD_END_Y = Y_OFFSET + BLOCK_SIZE_OUTLINE*20;

export const NEXT_X_OFFSET = X_OFFSET 
                    + BLOCK_SIZE_OUTLINE*BOARD_WIDTH
                    + 30;
export const NEXT_Y_OFFSET = Y_OFFSET;
export const DIST_BTW_NEXTS = 3*NEXT_BLOCK_SIZE_OUTLINE;

export const HOLD_X_OFFSET = X_OFFSET - 126;
export const HOLD_Y_OFFSET = Y_OFFSET;

export const GAUGE_X_OFFSET = X_OFFSET - 42;
export const GAUGE_Y_OFFSET = Y_OFFSET + VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE - NEXT_BLOCK_SIZE_OUTLINE*20;


export const PLAYER_OFFSET = 500;

export const DAS = 12;
export const BUBBLING_DAS = 8;
export const ARR = 2;
export const ENTRY_DELAY = 6;

export const LINE_CLEAR_FRAMES = 20;
export const LOCK_ANIMATION_FRAMES = 15;
export const HARDDROP_ANIMATION_FRAMES = 2;
export const ACTION_LOCKDELAY_REFRESH_MAX = 16;

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ENUMS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const GRAVITY = Object.freeze([
    1.0,
    0.793,
    0.618,
    0.473,
    0.355,
    0.262,
    0.190,
    0.135,
    0.094,
    0.064,
    0.043,
    0.028,
    0.018,
    0.011,
    0.007
]);

export const COMBO_GARB = Object.freeze(
    [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5,]
);
export const COMBO_GARB_NERF = Object.freeze(
    [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5]
);

export const KEY = {
    SHIFT:  16,     //hold
    CTRL:   17,     //rotate counterclockwise
    SPACE:  32,     //harddrop
    LEFT:   37,
    UP:     38,     //rotate clockwise
    RIGHT:  39,
    DOWN:   40,     //softdrop
    C:      67,     //hold
    X:      88,     //rotate clockwise
    Z:      90,      //rotate counterclockwise
    G:      78,     //Toggle Ghost
    P:      80,     //Pause
};

export const KEYSTATES = Object.freeze(
{
    LR: 0,
    L : 1,
    R : 2,
    UZ : 3,
    U : 4,
    Z : 5
});

export const DRAWMODE = Object.freeze(
{
    DRAWPIECE: 0,
    HIDEPIECE: 1,
    DRAWGHOST: 2,
    HIDEGHOST: 3
});

export const GAMEMODE = Object.freeze(
{
    STATIC: 0,
    VARIABLE: 1,
    VERSUS: 2
});

export const SCORE = Object.freeze(
{
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    TETROCKS: 4,
    MTS: 5,
    MTSS: 6,
    TS: 7,
    TSS: 8,
    TSD: 9,
    TST: 10,
    PERFECT: 11
});

export const MOVES = 
{
    [KEY.LEFT]:  p=>({...p, x: p.x-1, lastMove: LAST_MOVE.MOVE}),
    [KEY.RIGHT]: p=>({...p, x: p.x+1, lastMove: LAST_MOVE.MOVE}),
    [KEY.DOWN]:  p=>({...p, y: p.y+1, lastMove: LAST_MOVE.MOVE}),
};

export const LAST_MOVE = Object.freeze(
{
    NONE: 0,
    MOVE: 1,
    SPIN: 2,
});

export const T_SPIN_STATE =
{
    NONE: 0,
    PROP: 1,
    MINI: 2
}

export const BUBBLING_TYPE = Object.freeze(
    {
        EMPTY: -1,
        R: 0,
        G: 1,
        B: 2,
        Y: 3,
        P: 4,
        TRASH: 5
    }
);

export const BUBBLING_STATE = Object.freeze({
	N : 0,
	D : 1,
	U : 2,
	UD : 3,
	R : 4,
	DR : 5,
	UR : 6,
	UDR : 7,
	L : 8,
	DL : 9,
	UL : 10,
	UDL : 11,
	LR : 12,
	DLR : 13,
	ULR : 14,
	UDLR : 15  
});

export const KICK = Object.freeze({
    NO_ROTATION: -1,
    DONT_PUSH: 0,
    PUSH_LEFT: 1,
    PUSH_RIGHT: 2,
    PUSH_UP: 3,
    DOUBLE_ROTATION:4
});

export const GAME_STATE = Object.freeze({
	WIN:0,
	LOST:1,
	READY:2,
	
	PLAY_AGAIN: 98,
	DISCONNECTED: 99
});

export const GROUP_SIZE_BONUS = Object.freeze([0,0,0,0,0,2,3,4,5,6,7,10]);
export const CHAIN_BONUS = Object.freeze([   0,   8,  16,  32,  64,  96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512]);
export const COLOR_BONUS = Object.freeze([0,3,6,12,24]);
export const VS_TETROCKS_SCORE = Object.freeze([0,210,630,1050,1710,3500,7000,14000,28000,56000]);
export const GAUGE_TO_TRASH = Object.freeze([0,4,5,6,8,10,13,16,20,24,28,33,38,43,49,55,61,68,75,83,92,102,113,125,138,152,167,183,200,218,237,257,278,300,323,347,372,398,425,453,482,512,543,575,608,642,677,713,750,788,827,867,908,950,993,1037,1082,1128,1175,1223,1272
]);

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~COLORS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
export const COLOR_BLACK =         "rgb(000,000,000)";
export const COLOR_GREY =          "rgb(040,040,040)";
export const COLOR_WHITE =         "rgb(255,255,255)";
export const COLOR_GHOST =         "rgb(080,080,080)";
export const LINE_CLEAR_WHITE =    "rgba(255,255,255,0.15)";
export const LINE_CLEAR_BLACK =    "rgba(000,000,000,0.15)";
export const PIECE_3D_ADD = "rgba(0,0,0,0.3)";

export const LOCK_WHITE = "rgba(255,255,255,0.07)";

export const COLOR_MAP =  Object.freeze(
[
    "rgba(114,203,059,1.0)",     //S
    "rgba(255,050,019,1.0)",     //Z
    "rgba(160,000,241,1.0)",     //T
    "rgba(255,151,028,1.0)",     //L
    "rgba(003,065,174,1.0)",     //J
    "rgba(000,224,187,1.0)",     //I
    "rgba(255,213,000,1.0)",     //O
    "rgba(200,200,200,1.0)"      //GARBAGE
]);

export const GHOST_COLOR_MAP = Object.freeze(
[
    "rgba(000,240,000,0.5)",     //S
    "rgba(240,000,000,0.5)",     //Z
    "rgba(160,000,241,0.5)",     //T
    "rgba(239,160,000,0.5)",     //L
    "rgba(000,000,240,0.75)",    //J
    "rgba(000,224,187,0.5)",     //I
    "rgba(240,240,000,0.5)"      //O
]);

export const BUBBLING_COLOR = Object.freeze({
	R:"rgba(255,050,019,1.0)",
	G:"rgba(114,203,059,1.0)",
	B:"rgba(003,065,174,1.0)",
	P:"rgba(160,000,241,1.0)",
	Y:"rgba(255,213,000,1.0)",
	TRASH:"rgba(200,200,200,1.0)"
});

export const P1_COLORS = Object.freeze(
[
	"rgb(000,161,224)",
	"rgb(004,107,148)"
]
);
export const P2_COLORS = Object.freeze(
[
	"rgb(225,154,046)",
	"rgb(181,112,038)"
]
);


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~LOGICS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const PIECE_MAP = Object.freeze(
[
    [ 0x6C00, 0x4620, 0x06C0, 0x8C40 ], // 'S' 
    [ 0xC600, 0x2640, 0x0C60, 0x4C80 ], // 'Z' 
    [ 0x4E00, 0x4640, 0x0E40, 0x4C40 ], // 'T' 
    [ 0x2E00, 0x4460, 0xE800, 0xC440 ], // 'L' 
    [ 0x8E00, 0x6440, 0xE200, 0x44C0 ], // 'J' 
    [ 0x0F00, 0x2222, 0x00F0, 0x4444 ], // 'I' 
    [ 0x6600, 0x6600, 0x6600, 0x6600 ]  // 'O'
]);

export const OFFSETS = Object.freeze(
[
    [[0,0],[-1,0],[-1, 1],[0,-2],[-1,-2]],  // 0: 0 -> 1
    [[0,0],[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],  // 1: 1 -> 2
    [[0,0],[ 1,0],[ 1, 1],[0,-2],[ 1,-2]],  // 2: 2 -> 3
    [[0,0],[-1,0],[-1,-1],[0, 2],[-1, 2]],  // 3: 3 -> 0

    [[0,0],[ 1,0],[ 1, 1],[0,-2],[ 1,-2]],  // 4: 0 -> 3 
    [[0,0],[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],  // 5: 1 -> 0
    [[0,0],[-1,0],[-1, 1],[0,-2],[-1,-2]],  // 6: 2 -> 1
    [[0,0],[-1,0],[-1,-1],[0, 2],[-1, 2]],  // 7: 3 -> 2
]);

export const I_OFFSETS = Object.freeze(
[
    [[0,0],[-2,0],[ 1,0],[-2,-1],[ 1, 2]],  // 0: 0 -> 1
    [[0,0],[-1,0],[ 2,0],[-1, 2],[ 2,-1]],  // 1: 1 -> 2
    [[0,0],[ 2,0],[-1,0],[ 2, 1],[-1,-2]],  // 2: 2 -> 3
    [[0,0],[ 1,0],[-2,0],[ 1,-2],[-2, 1]],  // 3: 3 -> 0

    [[0,0],[-1,0],[ 2,0],[-1, 2],[ 2,-1]],  // 4: 0 -> 3
    [[0,0],[ 2,0],[-1,0],[ 2, 1],[-1,-2]],  // 5: 1 -> 0
    [[0,0],[ 1,0],[-2,0],[ 1,-2],[-2, 1]],  // 6: 2 -> 1
    [[0,0],[-2,0],[ 1,0],[-2,-1],[ 1, 2]],  // 7: 3 -> 2
]);

export const XY_OFFSETS = Object.freeze(
[
	[ 0,-1],
	[ 1, 0],
	[ 0, 1],
	[-1, 0]
]
);

export const DIRECTION = Object.freeze({
	NONE:  [0,0],
	LEFT:  [-1,0],
	RIGHT: [1,0],
	DOWN:  [0,1],
	UP: [0,-1],
	CW: 1,
	ACW: -1,
	DOUBLE: 2
});


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~IMAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const SPRITE_IMAGE = new Image();
SPRITE_IMAGE.src ='./Images/bubbs.png'

export const BUBBLING_BUTTON = new Image();
BUBBLING_BUTTON.src ='./Images/p.png'

export const TETROCKS_BUTTON = new Image();
TETROCKS_BUTTON.src ='./Images/t.jpg'

export const POP_SPRITE = Object.freeze(
[
    [9,11],     //R
    [9,13],     //G
    [10,0],     //B
    [10,2],     //Y
    [10,4],     //P
	[12,6]		//T
]);

export const NUISANCE_QUEUE = {
	VALUE : {
		CROWN: 720,
		STAR: 360,
		COMET: 180,
		ROCK: 30,
		BIG: 6,
		SMALL: 1
	},
	SPRITES : {
		CROWN: [10,11],
		STAR: [11,11],
		COMET: [12,11],
		ROCK: [12,12],
		BIG: [13,12],
		SMALL: [14,12],
	}
}

export const DX_DY = Object.freeze(
[
	[ 0,-1],
	[ 0, 1],
	[-1, 0],
	[ 1, 0]
]);
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~SOUNDS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
//sounds are from https://onlinesequencer.net/#t0
export const SOUNDS = {
	COMBO1: './sounds/soundEffects/combo_1.mp3',
	COMBO2: './sounds/soundEffects/combo_2.mp3',
	COMBO3: './sounds/soundEffects/combo_3.mp3',
	COMBO4: './sounds/soundEffects/combo_4.mp3',
	COMBO5: './sounds/soundEffects/combo_5.mp3',
	COMBO6: './sounds/soundEffects/combo_6.mp3',
	COMBO7: './sounds/soundEffects/combo_7.mp3',
	COMBO8: './sounds/soundEffects/combo_8.mp3',
	COMBO9: './sounds/soundEffects/combo_9.mp3',
	CHANGE: './sounds/soundEffects/lock.mp3',
	ERASE: './sounds/soundEffects/clear1.mp3',
	ERASE4: './sounds/soundEffects/clear4.mp3',
	HARDDROP: './sounds/soundEffects/lock.mp3',
	HOLD: './sounds/soundEffects/lock.mp3',
	MOVE: './sounds/soundEffects/lock.mp3',
	TSPIN: './sounds/soundEffects/lock.mp3',
	TSPINC: './sounds/soundEffects/lock.mp3',
	PLAYER_JOIN: './sounds/soundEffects/player_join.mp3',
	GAMEOVER: './sounds/soundEffects/gameover.mp3'
}

export const VOICES = {
	ARLE: {
		COMBO: n =>{
			return SOUNDS['COMBO'+Math.min(n,9)];
		}
	},
}

export const playSound = url => {
	let aud = new Audio(url);
	aud.volume = 0.35;
	aud.play();
	return;
}