// jshint esversion: 8
let player = 1;
let player1Score = 0;
let player2Score = 0;
let Board = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
];
let selectSound = new Howl({
    src: ['audio/select.wav']
});

// This creates a new (clone) Node and appending it to the DOM makes this a reference to it
// To use as a copy/template make sure to clone the Node before appending to the DOM
// const contentNodeCopy = $(".content").cloneNode(deep = true);

function $(element, type = null) {
    switch(type){
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

function getGrid(i, j = null) {
    if (j != null) {
        let gridNo = (i * Board.length) + (j + 1);
        return $(" .grid-" + gridNo);
    }
    else {
        return $(" .grid-" + i);
    }
}

function getBoard() {
    let newBoard = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ];

    for (let i = 0; i < newBoard.length; i++) {
        for (let j = 0; j < newBoard.length; j++) {
            newBoard[i][j] = getGrid(i, j).textContent;
        }
    }

    return newBoard;
}

function minimax(depth, alpha, beta, isMaximizing) {
    let gameState = checkGameState();

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
        for (let i = 0; i < Board.length; i++) {
            loop2:
            for (let j = 0; j < Board.length; j++) {
                if (Board[i][j] == "") {
                    Board[i][j] = mark;
                    let evaluation = minimax(depth - 1, alpha, beta, false);
                    Board[i][j] = "";

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
        for (let i = 0; i < Board.length; i++) {
            loop2:
            for (let j = 0; j < Board.length; j++) {
                if (Board[i][j] == "") {
                    Board[i][j] = mark;
                    let evaluation = minimax(depth - 1, alpha, beta, true);
                    Board[i][j] = "";

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




function checkGameState() {
    const checkWin = (plyChar) => {
        for (let i = 0; i < Board.length; i++) {
            //Check rows
            let rowTruthyCntr = 0;
            for (let j = 0; j < Board.length; j++) { 
                if (Board[i][j] == plyChar) { rowTruthyCntr++; }
            }
            if (rowTruthyCntr == Board.length) { return true; }
            
            //Check columns
            let colTruthyCntr = 0;
            for (let j = 0; j < Board.length; j++) { 
                if (Board[j][i] == plyChar) { colTruthyCntr++; }
            }
            if (colTruthyCntr == Board.length) { return true; }
        }

        //Check LTR Diagonal
        let ltrTruthyCntr = 0;
        for (let i = 0, j = 0; i < Board.length && j < Board.length; i++, j++) {
            if (Board[i][j] == plyChar) { ltrTruthyCntr++; }
        }
        if (ltrTruthyCntr == Board.length) { return true; }
          
        //Check RTL Diagonal
        let rtlTruthyCntr = 0;
        for (let i = 0, j = Board.length - 1; i < Board.length && j > -1; i++, j--) { 
            if (Board[i][j] == plyChar) { rtlTruthyCntr++; }
        }
        if (rtlTruthyCntr == Board.length) { return true; }

        return false;
    };
    const checkDraw = () => {
        let drawTruthyCntr = 0;
        for (let i = 0; i < Board.length; i++) {
            for (let j = 0; j < Board.length; j++) { if (Board[i][j] !== "") drawTruthyCntr++; }
            if(drawTruthyCntr == (Board.length*Board.length)) { return true; }
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

        for (let i = 0; i < Board.length; i++) {
            //Animate rows
            let rowTruthyArray = [];
            for (let j = 0; j < Board.length; j++) { 
                if (Board[i][j] == plyChar) { rowTruthyArray.push({ i: i, j: j }); }
            }
            if(rowTruthyArray.length == Board.length) { 
                winSeq = rowTruthyArray; 
                return winSeq;
            }

            //Animate columns
            let colTruthyArray = [];
            for (let j = 0; j < Board.length; j++) { 
                if (Board[j][i] == plyChar) { colTruthyArray.push({ i: j, j: i }); }
            }
            if(colTruthyArray.length == Board.length) { 
                winSeq = colTruthyArray; 
                return winSeq;
            }
        }

        //Animate LTR Diagonal
        let ltrTruthyArray = [];
        for (let i = 0, j = 0; i < Board.length && j < Board.length; i++, j++) {
            if (Board[i][j] == plyChar) { ltrTruthyArray.push({ i: i, j: j }); }
        }
        if(ltrTruthyArray.length == Board.length) { 
            winSeq = ltrTruthyArray; 
            return winSeq;
        }

        //Animate RTL Diagonal
        let rtlTruthyArray = [];
        for (let i = 0, j = Board.length - 1; i < Board.length && j >= 0; i++, j--) {
            if (Board[i][j] == plyChar) { rtlTruthyArray.push({ i: i, j: j }); }
        }
        if(rtlTruthyArray.length == Board.length) { 
            winSeq = rtlTruthyArray; 
            return winSeq;
        }

        return winSeq;
    };

    // console.log(getWinSeq("X"),  getWinSeq("O"));

    getWinSeq("X").forEach((winGrid) => {
        const { i, j } = winGrid;
        getGrid(i, j).classList.add("grid-win");
    });

    getWinSeq("O").forEach((winGrid) => {
        const { i, j } = winGrid;
        getGrid(i, j).classList.add("grid-win");
    });
}

function updateGameStatus() {
    let gameState = checkGameState();
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
            subHeading.textContent = "Player " + player + "'s Turn";
            return;
    }
    animateWinSeq();
    setTimeout(function () {
        reloadGame();
    }, delayToReload);
}

function updatePlayerScores() {
    let gameState = checkGameState();

    switch (gameState) {
        case 1:
            player1Score++;
            sessionStorage.setItem("player1Score", player1Score.toString());
            $(".player-1-score").textContent = "X - " + player1Score;
            break;
        case -1:
            player2Score++;
            sessionStorage.setItem("player2Score", player2Score.toString());
            $(".player-2-score").textContent = "O - " + player2Score;
            break;
    }
}

function reloadGame() {
    player = 1;

    for (let i = 0; i < Board.length; i++) {
        for (let j = 0; j < Board.length; j++) {
            getGrid(i, j).textContent = "";
        }
    }

    Board = getBoard();

    for (let i = 1; i <= $(".grid-item", "all").length; i++) {
        getGrid(i).classList.remove("grid-win");
    }

    $(".sub-heading").textContent = "Player 1's Turn";
    $(".sub-heading").classList.remove("sub-heading-X-win");
    $(".sub-heading").classList.remove("sub-heading-O-win");
}


async function boardMarker() {
    console.log("I got clicked!");
    if (this.textContent !== "" || checkGameState() !== 2) return;


    if ($("#normal-checkbox").checked) {
        if (player == 1) { this.textContent = "X"; player++; }
        else if (player == 2) { this.textContent = "O"; player--; }
        selectSound.play();
        Board = getBoard();
        updateGameStatus();
        updatePlayerScores();
    } 
    else if ($("#ai-checkbox").checked) {
        this.textContent = "X";
        player++;
        Board = getBoard();
        updateGameStatus();
        updatePlayerScores();

        await sleep(200);
        if (checkGameState() != 2) return;

        let bestEval = Infinity;
        let gridToMark;

        for (let i = 0; i < Board.length; i++) {
            for (let j = 0; j < Board.length; j++) {
                if (Board[i][j] == "") {
                    Board[i][j] = "O";
                    let evaluation = minimax(8, -Infinity, Infinity, true);
                    Board[i][j] = "";

                    if (evaluation < bestEval) {
                        bestEval = evaluation;
                        gridToMark = getGrid(i, j);
                    }
                }
            }
        }

        gridToMark.textContent = "O";
        player--;
        selectSound.play();
        Board = getBoard();
        updateGameStatus();
        updatePlayerScores();
    }
}

$("#normal-checkbox").addEventListener("input", function () {
    for (let i = 0; i < $(".grid-item", "all").length; i++) {
        $(".grid-item", "all")[i].addEventListener("click", boardMarker);
    }
    reloadGame();
});


$("#ai-checkbox").addEventListener("input", function () {
    for (let i = 0; i < $(".grid-item", "all").length; i++) {
        $(".grid-item", "all")[i].addEventListener("click", boardMarker);
    }
    reloadGame();
});

document.body.onload = () => {
    if (sessionStorage.getItem("player1Score") !== null) {
        player1Score = parseInt(sessionStorage.getItem("player1Score"));
        $(".player-1-score").textContent = "X - " + player1Score;
    }
    if (sessionStorage.getItem("player2Score") !== null) {
        player2Score = parseInt(sessionStorage.getItem("player2Score"));
        $(".player-2-score").textContent = "O - " + player2Score;
    }
};

$("#ai-checkbox").click();