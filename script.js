var player = 1;
var player1Score = 0;
var player2Score = 0;
var Board = getBoard();
var selectSound = new Howl({
    src: ['audio/select.wav']
});

function $(element, isAll){
    if(!isAll){
        return document.querySelector(element);
    }else if(isAll){
        return document.querySelectorAll(element);
    }
}

function getGrid(i, j){
    if(j != undefined){
        var index = (i * 3) + (j + 1);
        return $(" .grid-" + index);
    }
    else{
        return $(" .grid-" + i);
    }
}

function getBoard(){
    var Board = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
    ];

    for(var i = 0; i < 3; i++){
        for(var j = 0; j < 3; j++){
            Board[i][j] =  getGrid(i, j).innerHTML;
        }
    }

    return Board;
}

function minimax(isMaximizing) {
    var gameState = checkGameState();

    if (gameState == 1) {
        return 1;
    }
    else if (gameState == -1) {
        return -1;
    }
    else if (gameState == 0) {
        return 0;
    }

    if (isMaximizing) {
        var bestEval = -Infinity;

        var mark = "X";

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (Board[i][j] == "") {
                    Board[i][j] = mark;
                    var Evaluation = minimax(false);
                    Board[i][j] = "";
                    if (Evaluation > bestEval) {
                        bestEval = Evaluation;
                    }
                }
            }
        }
        return bestEval;
    }
    else {
        var bestEval = Infinity;

        var mark = "O";

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (Board[i][j] == "") {
                    Board[i][j] = mark;
                    var Evaluation = minimax(true);
                    Board[i][j] = "";
                    if (Evaluation < bestEval) {
                        bestEval = Evaluation;
                    }
                }
            }
        }
        return bestEval;
    }
}

function animateWinSeq(){
    for (var i = 0; i < 3; i++) {                   //Checks horizontally and vertically
        if ((Board[i][0] == "X" && Board[i][1] == "X" && Board[i][2] == "X") 
            || (Board[i][0] == "O" && Board[i][1] == "O" && Board[i][2] == "O")) {
            for (var j = 0; j < 3; j++) {
                getGrid(i, j).classList.add("grid-win");
            }
            return;
        } else if ((Board[0][i] == "X" && Board[1][i] == "X" && Board[2][i] == "X")
            || (Board[0][i] == "O" && Board[1][i] == "O" && Board[2][i] == "O")) {
            for (var j = 0; j < 3; j++) {
                getGrid(j, i).classList.add("grid-win");
            }
            return;
        }

    }

    if ((Board[0][0] == "X" && Board[1][1] == "X" && Board[2][2] == "X")        //Checks diagonally
        || (Board[0][0] == "O" && Board[1][1] == "O" && Board[2][2] == "O")) {  
        for (var i = 0; i < 3; i++) {
            getGrid(i, i).classList.add("grid-win");
        }
        return;
    } else if ((Board[0][2] == "X" && Board[1][1] == "X" && Board[2][0] == "X")
        || (Board[0][2] == "O" && Board[1][1] == "O" && Board[2][0] == "O")) {
        for (var i = 0, j = 2; i < 3; i++, j--) {
            getGrid(i, j).classList.add("grid-win");
        }
        return;
    }
}

function reloadGame(){
    player = 1;
    
    for(var i = 0; i < 3; i++){
        for(var j = 0; j < 3; j++){
            getGrid(i, j).innerHTML = "";
        }
    }

    Board = getBoard();

    for(var i = 1; i < 10; i++){
        getGrid(i).classList.remove("grid-win");
    }

    $(".sub-heading").textContent = "Player 1's Turn";
    $(".sub-heading").classList.remove("sub-heading-X-win");
    $(".sub-heading").classList.remove("sub-heading-O-win");
}

function checkGameState() {
    for (var i = 0; i < 3; i++) {                                  //Checks horizontally and vertically
        if ((Board[i][0] == "X" && Board[i][1] == "X" && Board[i][2] == "X") 
            || (Board[0][i] == "X" && Board[1][i] == "X" && Board[2][i] == "X")) {
            return 1;
        }
        else if ((Board[i][0] == "O" && Board[i][1] == "O" && Board[i][2] == "O")
            || (Board[0][i] == "O" && Board[1][i] == "O" && Board[2][i] == "O")){
            return -1;
        }
    }

    if ((Board[0][0] == "X" && Board[1][1] == "X" && Board[2][2] == "X")        //Checks diagonally
        || (Board[0][2] == "X" && Board[1][1] == "X" && Board[2][0] == "X")){        
        return 1;
    }
    else if ((Board[0][0] == "O" && Board[1][1] == "O" && Board[2][2] == "O")
        || (Board[0][2] == "O" && Board[1][1] == "O" && Board[2][0] == "O")) {
        return -1;
    }

    if (Board[0][0] != "" && Board[0][1] != "" && Board[0][2] != "" && Board[1][0] != "" && Board[1][1] != "" && Board[1][2] != "" && Board[2][0] != "" && Board[2][1] != "" && Board[2][2] != "") 
    {
        return 0;            //Checks Draw
    }
    else {
        return 2;            //Game in Progress
    }
}

function gameStatus(player){
    var gameState = checkGameState();
    var subHeading = $(".sub-heading");
    var delayToReload = 1800;

    if(gameState == 1){
        subHeading.textContent = "Player 1 wins!";
        subHeading.classList.add("sub-heading-X-win");
        animateWinSeq();
        setTimeout(function(){
            reloadGame();
        }, delayToReload);
    }
    else if(gameState == -1){
        subHeading.textContent = "Player 2 wins!";
        subHeading.classList.add("sub-heading-O-win");
        animateWinSeq();
        setTimeout(function(){
            reloadGame();
        }, delayToReload);
    }
    else if(gameState == 0){
        subHeading.textContent = "Draw!";
        subHeading.classList.add("sub-heading-win");
        animateWinSeq();
        setTimeout(function(){
            reloadGame();
        }, delayToReload);
    }else if(gameState == 2){
        subHeading.textContent = "Player " + player + "'s Turn";
    }
}

function playerScores(){
    var gameState = checkGameState();

    if (gameState == 1){
        player1Score++;
        $(".player-1-score").textContent = "X - " + player1Score;
    }
    else if (gameState == -1){
        player2Score++;
        $(".player-2-score").textContent = "O - " + player2Score;
    }
}
if($("#normal-checkbox").checked){
    changeMode("normal");
}else if($("#ai-checkbox").checked){
    changeMode("ai");
}

$("#normal-checkbox").addEventListener("change", function(){
    changeMode("normal");
});


$("#ai-checkbox").addEventListener("change", function(){
    changeMode("ai");
});

function changeMode(modeType){
    if(modeType == "normal"){
        for(var i = 0; i < 9; i++){
            $(".grid-item", true)[i].removeEventListener("click", aiBoardMarker);
            $(".grid-item", true)[i].addEventListener("click", normalBoardMarker);
        }
    }else if(modeType = "ai"){
        for(var i = 0; i < 9; i++){
            $(".grid-item", true)[i].removeEventListener("click", normalBoardMarker);
            $(".grid-item", true)[i].addEventListener("click", aiBoardMarker);
        }
    }

    reloadGame();
}

function normalBoardMarker(){
    var gameState = checkGameState();
    
    console.log("Game State: " + gameState);
    if(this.innerHTML != "X" && this.innerHTML != "O" && gameState == 2){
        if (player == 1) {
            this.textContent = "X";
            selectSound.play();
            player++;
            Board = getBoard();
            gameStatus(player);
            playerScores();
        }
        else if (player == 2){
            this.textContent = "O";
            selectSound.play();
            player--;
            Board = getBoard();
            gameStatus(player);
            playerScores();
        }
    }
}

function aiBoardMarker(){
    var gameState = checkGameState();

    console.log("Game State: " + gameState);
    if(this.innerHTML != "X" && this.innerHTML != "O" && gameState == 2){
        if (player == 1) {
            this.textContent = "X";
            selectSound.play();
            player++;
            Board = getBoard();
            gameStatus(player);
            playerScores();
            gameState = checkGameState();
        }
        if (player == 2 && gameState == 2) {
            var k = 0;

            var bestEval = Infinity;
            var gridToMark;

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    k++;
                    if (Board[i][j] == "") {
                        Board[i][j] = "O";
                        var Evaluation = minimax(true);
                        Board[i][j] = "";
                        if (Evaluation < bestEval) {
                            bestEval = Evaluation;
                            gridToMark = getGrid(i, j);
                        }
                    }
                }
            }

            gridToMark.textContent = "O";
            player--;
            Board = getBoard();
            gameStatus(player);
            playerScores();
        }
    }
}