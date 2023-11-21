// jshint esversion: 11
// import wasm_init, { minimax, checkGameState } from "../../minimax_algo_lib.js";

let gameVars = {
    player: 1,
    player1Score: 0,
    player2Score: 0,
    board: [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
    ]
};

let selectSound = new Howl({
    src: ['audio/select.wav']
});

function $(element, type = null) {
    switch (type) {
        case "all":
            return document.querySelectorAll(element);
        default:
            return document.querySelector(element);
    }
}

function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

function getGrid(gameVars, i, j = null) {
    if (j != null) {
        let gridNo = (i * gameVars.board.length) + (j + 1);
        return $(" .grid-" + gridNo);
    }
    else {
        return $(" .grid-" + i);
    }
}

function getBoard(gameVars) {
    let newBoard = [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
    ];

    for (let i = 0; i < newBoard.length; i++) {
        for (let j = 0; j < newBoard.length; j++) {
            newBoard[i][j] = getGrid(gameVars, i, j).textContent;
        }
    }

    return newBoard;
}

function minimax(gameVars, depth, alpha, beta, isMaximizing) {
    let gameState = checkGameState(gameVars);

    if (gameState == 1) {
        return 1;
    }
    else if (gameState == -1) {
        return -1;
    }
    else if (gameState == 0 || depth == 0) {
        return 0;
    }

    if (isMaximizing) {
        let bestEval = -Infinity;
        let mark = "X";

        loop1:
        for (let i = 0; i < gameVars.board.length; i++) {
            loop2:
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] == "") {
                    gameVars.board[i][j] = mark;
                    let evaluation = minimax(gameVars, depth - 1, alpha, beta, false);
                    gameVars.board[i][j] = "";
                    bestEval = Math.max(bestEval, evaluation);

                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) {
                        break loop1;
                    }
                }
            }
        }
        return bestEval;
    }
    else {
        let bestEval = Infinity;
        let mark = "O";

        loop1:
        for (let i = 0; i < gameVars.board.length; i++) {
            loop2:
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] == "") {
                    gameVars.board[i][j] = mark;
                    let evaluation = minimax(gameVars, depth - 1, alpha, beta, true);
                    gameVars.board[i][j] = "";
                    bestEval = Math.min(bestEval, evaluation);

                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) {
                        break loop1;
                    }
                }
            }
        }
        return bestEval;
    }
}




function checkGameState(gameVars) {
    const checkWin = (plyChar) => {
        for (let i = 0; i < gameVars.board.length; i++) {
            //Check rows
            let rowTruthyCntr = 0;
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] == plyChar) {
                    rowTruthyCntr++;
                }
            }
            if (rowTruthyCntr == gameVars.board.length) {
                return true;
            }

            //Check columns
            let colTruthyCntr = 0;
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[j][i] == plyChar) {
                    colTruthyCntr++;
                }
            }
            if (colTruthyCntr == gameVars.board.length) {
                return true;
            }
        }

        //Check LTR Diagonal
        let ltrTruthyCntr = 0;
        for (let i = 0, j = 0; i < gameVars.board.length && j < gameVars.board.length; i++, j++) {
            if (gameVars.board[i][j] == plyChar) {
                ltrTruthyCntr++;
            }
        }
        if (ltrTruthyCntr == gameVars.board.length) {
            return true;
        }

        //Check RTL Diagonal
        let rtlTruthyCntr = 0;
        for (let i = 0, j = gameVars.board.length - 1; i < gameVars.board.length && j > -1; i++, j--) {
            if (gameVars.board[i][j] == plyChar) {
                rtlTruthyCntr++;
            }
        }
        if (rtlTruthyCntr == gameVars.board.length) {
            return true;
        }

        return false;
    };
    const checkDraw = () => {
        let drawTruthyCntr = 0;
        for (let i = 0; i < gameVars.board.length; i++) {
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] !== "") {
                    drawTruthyCntr++;
                }
            }
            if (drawTruthyCntr == (gameVars.board.length * gameVars.board.length)) {
                return true;
            }
        }

        return false;
        // return Board[0][0] != "" && Board[0][1] != "" && Board[0][2] != "" && Board[1][0] != "" && Board[1][1] != "" && Board[1][2] != "" && Board[2][0] != "" && Board[2][1] != "" && Board[2][2] != "";
    };

    if (checkWin("X")) return 1;      //Checks Winner X
    if (checkWin("O")) return -1;     //Checks Winner O   
    if (checkDraw()) return 0;        //Checks Draw
    return 2;                         //Game in Progress
}

function animateWinSeq() {
    const getWinSeq = (plyChar) => {
        let winSeq = [];

        for (let i = 0; i < gameVars.board.length; i++) {
            //Animate rows
            let rowTruthyArray = [];
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] == plyChar) { rowTruthyArray.push({ i: i, j: j }); }
            }
            if (rowTruthyArray.length == gameVars.board.length) {
                winSeq = rowTruthyArray;
            }

            //Animate columns
            let colTruthyArray = [];
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[j][i] == plyChar) { colTruthyArray.push({ i: j, j: i }); }
            }
            if (colTruthyArray.length == gameVars.board.length) {
                winSeq = colTruthyArray;
            }
        }

        //Animate LTR Diagonal
        let ltrTruthyArray = [];
        for (let i = 0, j = 0; i < gameVars.board.length && j < gameVars.board.length; i++, j++) {
            if (gameVars.board[i][j] == plyChar) { ltrTruthyArray.push({ i: i, j: j }); }
        }
        if (ltrTruthyArray.length == gameVars.board.length) {
            winSeq = ltrTruthyArray;
        }

        //Animate RTL Diagonal
        let rtlTruthyArray = [];
        for (let i = 0, j = gameVars.board.length - 1; i < gameVars.board.length && j >= 0; i++, j--) {
            if (gameVars.board[i][j] == plyChar) { rtlTruthyArray.push({ i: i, j: j }); }
        }
        if (rtlTruthyArray.length == gameVars.board.length) {
            winSeq = rtlTruthyArray;
        }

        return winSeq;
    };

    // console.log(getWinSeq("X"),  getWinSeq("O"));

    getWinSeq("X").forEach((winGrid) => {
        const { i, j } = winGrid;
        getGrid(gameVars, i, j).classList.add("grid-win");
    });

    getWinSeq("O").forEach((winGrid) => {
        const { i, j } = winGrid;
        getGrid(gameVars, i, j).classList.add("grid-win");
    });
}

function updateGameStatus(gameVars) {
    let gameState = checkGameState(gameVars);
    let subHeading = $(".sub-heading");
    let delayToReload = 1800;

    switch (gameState) {
        case 1:
            subHeading.textContent = "Player 1 Wins!";
            subHeading.classList.add("sub-heading-X-win");
            break;
        case -1:
            subHeading.textContent = "Player 2 Wins!";
            subHeading.classList.add("sub-heading-O-win");
            break;
        case 0:
            subHeading.textContent = "Draw!";
            subHeading.classList.add("sub-heading-win");
            break;
        case 2:
            subHeading.textContent = "Player " + gameVars.player + "'s Turn";
            return;
    }
    animateWinSeq();
    setTimeout(function () {
        reloadGame();
    }, delayToReload);
}

function updatePlayerScores(gameVars) {
    let gameState = checkGameState(gameVars);

    switch (gameState) {
        case 1:
            gameVars.player1Score++;
            sessionStorage.setItem("player1Score", gameVars.player1Score.toString());
            $(".player-1-score").textContent = "X - " + gameVars.player1Score;
            break;
        case -1:
            gameVars.player2Score++;
            sessionStorage.setItem("player2Score", gameVars.player2Score.toString());
            $(".player-2-score").textContent = "O - " + gameVars.player2Score;
            break;
    }
}

function reloadGame() {
    gameVars.player = 1;

    for (let i = 0; i < gameVars.board.length; i++) {
        for (let j = 0; j < gameVars.board.length; j++) {
            getGrid(gameVars, i, j).textContent = "";
        }
    }
    
    for (let i = 1; i <= $(".grid-item", "all").length; i++) {
        getGrid(gameVars, i).classList.remove("grid-win");
    }
    
    $(".sub-heading").textContent = "Player 1's Turn";
    $(".sub-heading").classList.remove("sub-heading-X-win");
    $(".sub-heading").classList.remove("sub-heading-O-win");
    
    gameVars.board = getBoard(gameVars);
}


async function boardMarker() {
    // console.log("I got clicked!");
    if (this.textContent !== "" || checkGameState(gameVars) !== 2) return;


    if ($("#normal-checkbox").checked) {
        if (gameVars.player == 1) { this.textContent = "X"; gameVars.player++; }
        else if (gameVars.player == 2) { this.textContent = "O"; gameVars.player--; }
        selectSound.play();
        gameVars.board = getBoard(gameVars);
        updateGameStatus(gameVars);
        updatePlayerScores(gameVars);
    }
    else if ($("#ai-checkbox").checked) {
        this.textContent = "X";
        gameVars.player++;
        gameVars.board = getBoard(gameVars);
        updateGameStatus(gameVars);
        updatePlayerScores(gameVars);

        await sleep(200);
        if (checkGameState(gameVars) != 2) return;

        const Infinity = 99999999;
        let bestEval = Infinity;
        let gridToMark;

        for (let i = 0; i < gameVars.board.length; i++) {
            for (let j = 0; j < gameVars.board.length; j++) {
                if (gameVars.board[i][j] == "") {
                    gameVars.board[i][j] = "O";
                    let evaluation = minimax(gameVars, 5, -Infinity, Infinity, true);
                    gameVars.board[i][j] = "";
                    
                    if (evaluation < bestEval) {
                        bestEval = evaluation;
                        gridToMark = getGrid(gameVars, i, j);
                    }
                }
            }
        }

        // console.log(gridToMark);

        gridToMark.textContent = "O";
        gameVars.player--;
        selectSound.play();
        gameVars.board = getBoard(gameVars);
        updateGameStatus(gameVars);
        updatePlayerScores(gameVars);
    }
}

// $("#normal-checkbox").addEventListener("input", function () {
//     for (let i = 0; i < $(".grid-item", "all").length; i++) {
//         $(".grid-item", "all")[i].addEventListener("click", boardMarker);
//     }
//     reloadGame();
// });


// $("#ai-checkbox").addEventListener("input", function () {
//     for (let i = 0; i < $(".grid-item", "all").length; i++) {
//         $(".grid-item", "all")[i].addEventListener("click", boardMarker);
//     }
//     reloadGame();
// });

// document.body.onload = () => {
//     if (sessionStorage.getItem("player1Score") !== null) {
//         gameVars.player1Score = parseInt(sessionStorage.getItem("player1Score"));
//         $(".player-1-score").textContent = "X - " + gameVars.player1Score;
//     }
//     if (sessionStorage.getItem("player2Score") !== null) {
//         gameVars.player2Score = parseInt(sessionStorage.getItem("player2Score"));
//         $(".player-2-score").textContent = "O - " + gameVars.player2Score;
//     }
// };

(async () => {
    wasm_init();
})();

$("#ai-checkbox").click();