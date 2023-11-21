<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Howl } from "howler";

import { store, preserveStore } from "../store";
import { socket } from "../socket";

let player = ref(1);
// Variables to be used when the player is playing the AI mode
let aiModeVars = {
  player1Score: 0,
  player2Score: 0
}

/*
Different end states of the game for the AI to determine the best
possible moves.
*/
const GameStates = {
  player1: 1,
  player2: -1,
  draw: 0,
  inProgress: Infinity
}

// Game grid to store the player mark (X or O) and the elements CSS class list.
class GameGrid{
  textContent;
  classList;
  
  constructor(textContent: string, classList: string = ""){
    this.textContent = textContent;
    this.classList = classList;
  }
}

// Game board composed of game grids to be rendered in the template
let Board = ref([
  [new GameGrid(""), new GameGrid(""), new GameGrid("")],
  [new GameGrid(""), new GameGrid(""), new GameGrid("")],
  [new GameGrid(""), new GameGrid(""), new GameGrid("")]
]);

// Audio for playing after each player marks on the board 
let selectSound = new Howl({
  src: ['audio/select.wav']
});


// Utility function to cause delay when needed
function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

//==================================GAME LOGIC==================================
type GameState = {state: number, seq: any[] | null}
// Provides game state after checking the current position of the markers on the board.
function getGameState(testBoard): GameState {
  const getWinSeq = (plyChar: string) => {
    let winSeq: any[] | null = null;

    for (let i = 0; i < testBoard.length; i++) {
      // Check rows
      let rowTruthyArray = [];
      for (let j = 0; j < testBoard.length; j++) {
        if (testBoard[i][j].textContent == plyChar) { rowTruthyArray.push({ i: i, j: j }); }
      }
      if (rowTruthyArray.length == testBoard.length) {
        winSeq = rowTruthyArray;
        return winSeq;
      }

      // Check columns
      let colTruthyArray = [];
      for (let j = 0; j < testBoard.length; j++) {
        if (testBoard[j][i].textContent == plyChar) { colTruthyArray.push({ i: j, j: i }); }
      }
      if (colTruthyArray.length == testBoard.length) {
        winSeq = colTruthyArray;
        return winSeq;
      }
    }

    // Check Left-To-Right Diagonal
    let ltrTruthyArray = [];
    for (let i = 0, j = 0; i < testBoard.length && j < testBoard.length; i++, j++) {
      if (testBoard[i][j].textContent == plyChar) { ltrTruthyArray.push({ i: i, j: j }); }
    }
    if (ltrTruthyArray.length == testBoard.length) {
      winSeq = ltrTruthyArray;
      return winSeq;
    }

    // Check Right-To-Left Diagonal
    let rtlTruthyArray = [];
    for (let i = 0, j = testBoard.length - 1; i < testBoard.length && j >= 0; i++, j--) {
      if (testBoard[i][j].textContent == plyChar) { rtlTruthyArray.push({ i: i, j: j }); }
    }
    if (rtlTruthyArray.length == testBoard.length) {
      winSeq = rtlTruthyArray;
      return winSeq;
    }

    return winSeq;
  };
  const checkDraw = () => {
    let drawTruthyCntr = 0;
    for (let i = 0; i < testBoard.length; i++) {
      for (let j = 0; j < testBoard.length; j++) { if (testBoard[i][j].textContent !== "") drawTruthyCntr++; }
      if (drawTruthyCntr == (testBoard.length * testBoard.length)) { return true; }
    }

    return false;
  };

  if (getWinSeq("X") != null)  return {state: GameStates.player1, seq: getWinSeq("X")};      //Checks Winner X
  if (getWinSeq("O") != null)  return {state: GameStates.player2, seq: getWinSeq("O")};      //Checks Winner O   
  if (checkDraw() != false)    return {state: GameStates.draw, seq: null};                   //Checks Draw
  return {state: GameStates.inProgress, seq: null};                                          //Game in Progress
}

//==================================GAME UI==================================
// Returns the player 1's id after checking the selected game mode
const getPlayer1Id = () => {
  if (store.value.gameMode === "normal") {
    return store.value.gameRoom["player1_id"];
  }
  else if (store.value.gameMode === "ai") {
    return store.value.userAccount["user_id"];
  }
};

// Returns the player 2's id after checking the selected game mode
const getPlayer2Id = () => {
  if (store.value.gameMode === "normal") {
    return store.value.gameRoom["player2_id"];
  }
  else if (store.value.gameMode === "ai") {
    return "AI";
  }
};

/*
Updates the game status element after checking the 
current state of the game
*/
const updateGameStatusEle = () => {
  switch (getGameState(Board.value).state) {
    case GameStates.player1:
      gameStatus.value = `Player "${getPlayer1Id()}" Wins!`;
      gameStatusClass.value = "game-status-X-win";
      break;
    case GameStates.player2:
    gameStatus.value = `Player "${getPlayer2Id()}" Wins!`;
      gameStatusClass.value = "game-status-O-win";
      break;
    case GameStates.draw:
      gameStatus.value = "Draw";
      gameStatusClass.value = "game-status-win";
      break;
    case GameStates.inProgress:
      if (player.value == 1) {
        gameStatus.value = `Player "${getPlayer1Id()}"'s Turn`;
        gameStatusClass.value = "";
      }
      else if (player.value == 2) {
        gameStatus.value = `Player "${getPlayer2Id()}"'s Turn`;
        gameStatusClass.value = "";
      }

      break;
  }
};

// Animate the win sequence of the player.
const animateWinSeq = () => {
  getGameState(Board.value).seq?.forEach((winGrid) => {
    Board.value[winGrid.i][winGrid.j].classList = "grid-win";
  });
};

// Update the scores of the players after each game
const updatePlayerScores = () => {
  let gameState = getGameState(Board.value).state;

  if (store.value.gameMode === "normal") {
    switch (gameState) {
      case GameStates.player1:
        store.value.gameRoom["player1_score"]++;
        break;
      case GameStates.player2:
        store.value.gameRoom["player2_score"]++;
        break;
    }
  }
  else if (store.value.gameMode === "ai") {
    switch (gameState) {
      case GameStates.player1:
        aiModeVars.player1Score++;
        break;
      case GameStates.player2:
        aiModeVars.player2Score++;
        break;
    }
  }
}

// Logic to update the game's overall UI
let gameStatusClass = ref("")
let gameStatus = ref(`Player "${getPlayer1Id()}"'s Turn`)
function updateGameUI() {
  updateGameStatusEle();
  animateWinSeq();
  updatePlayerScores();

  if (getGameState(Board.value).state !== GameStates.inProgress) {
    let delayToReload = 1800;

    setTimeout(() => {
      player.value = 1;
      
      for (let i = 0; i < Board.value.length; i++) {
        for (let j = 0; j < Board.value.length; j++) {
          Board.value[i][j] = new GameGrid("");
        }
      }

      updateGameStatusEle();
    }, delayToReload);
  }
}

//==================================NORMAL MODE SPECIFIC==================================
// Sends the data to be synced, with the opponent player, to the server
function broadcastGame() {
  socket.emit("broadcast_game", {
    "Board": Board.value, 
    "player": player.value, 
    "gameRoom": store.value.gameRoom
  });
}

// Listens to syncing of the game, with the current player, from the sever
function syncGame() {
  socket.on("sync_game", (res) => {
    Board.value = res["Board"];
    player.value = res["player"];
    store.value.gameRoom = res["gameRoom"];

    socket.emit("sync_game_room", {
      "gameRoom": store.value.gameRoom
    });

    updateGameUI();
    selectSound.play();
  });
}

// Unlistens to syncing of the game after the game component is unmounted
function unsyncGame() {
  socket.off("sync_game");
}

// Logic for the leave game button for any player to leave the game in between
function leaveGame() {
  if (store.value.gameMode === "normal") {
    socket.emit("leave_game", {"gameRoom": store.value.gameRoom}, (res) => {
      if (res["leave_game_status"] == "success") {
        console.log("Success: left game room.");
      }
      else {
        console.log("Error: couldn't leave game room.");
      }
    });
  }
  else if (store.value.gameMode === "ai") {
    store.value.gameRoom = null;
    store.value.gameMode = null;
  }
}

// Logic to listen to any end game requests for either players
function listenEndGame() {
  socket.on("end_game", (res) => {
    store.value.gameRoom = null;
    store.value.gameMode = null;
  });
}

// Logic to unlisten to end game requests after the component is unmounted
function unlistenEndGame() {
  socket.off("end_game");
}


//==================================AI MODE SPECIFIC==================================
/*
Maximize the chance of any player to win while assuming that the other player
will always choose the best possible move for himself.
*/
function minimax(testBoard, depth, alpha, beta, isMaximizing) {
  let gameState = getGameState(testBoard).state;
  
  if (gameState == GameStates.player1) {
    return GameStates.player1;
  }
  else if (gameState == GameStates.player2) {
    return GameStates.player2;
  }
  else if (gameState == GameStates.draw || depth == 0) {
    return GameStates.draw;
  }

  if (isMaximizing) {
    let bestEval = -Infinity;
    let mark = "X";

    loop1:
    for (let i = 0; i < testBoard.length; i++) {
      loop2:
      for (let j = 0; j < testBoard.length; j++) {
        if (testBoard[i][j].textContent == "") {
          testBoard[i][j].textContent = mark;
          let evaluation = minimax(testBoard, depth - 1, alpha, beta, false);
          testBoard[i][j].textContent = "";
          
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
    for (let i = 0; i < testBoard.length; i++) {
      loop2:
      for (let j = 0; j < testBoard.length; j++) {
        if (testBoard[i][j].textContent == "") {
          testBoard[i][j].textContent = mark;
          let evaluation = minimax(testBoard, depth - 1, alpha, beta, true);
          testBoard[i][j].textContent = "";

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

/*
Uses the minimax algorithm to maximize the chance of the AI player to win
*/ 
function getAIMove() {
  let testBoard = JSON.parse(JSON.stringify(Board.value))
  let bestEval = Infinity;
  let bestMov = { i: 0, j: 0 };

  for (let i = 0; i < testBoard.length; i++) {
    for (let j = 0; j < testBoard.length; j++) {
      if (testBoard[i][j].textContent == "") {
        testBoard[i][j].textContent = "O";
        let evaluation = minimax(testBoard, Infinity, -Infinity, Infinity, true);
        testBoard[i][j].textContent = "";

        // console.log("");
        // console.log(`i: ${i}, j: ${j}`);
        // console.log(`evaluation: ${evaluation}`);
        // console.log(`bestEval: ${bestEval}`);
        // console.log("");

        if (evaluation < bestEval) {
          bestEval = evaluation;
          bestMov = { i: i, j: j };
        }
      }
    }
  }

  return bestMov;
}

/*
Logic for the game grids to execute after a click is detected on them
*/
async function boardMarker(event: Event, i: number, j: number) {
  // console.log("I got clicked!");
  // console.log("Game Mode: ", gameMode.value);
  // console.log("Game State: ", getGameState());

  if (Board.value[i][j].textContent !== "" || getGameState(Board.value).state !== GameStates.inProgress) return;

  if (store.value.gameMode === "normal") {
    if (player.value === 1 && socket.id === store.value.gameRoom["player1_socketio_id"]) { 
      Board.value[i][j].textContent = "X"; 
      player.value++;
      broadcastGame();
    }
    else if (player.value === 2 && socket.id === store.value.gameRoom["player2_socketio_id"]) { 
      Board.value[i][j].textContent = "O"; 
      player.value--;
      broadcastGame();
    }
  }
  else if (store.value.gameMode === "ai") {
    Board.value[i][j].textContent = "X";
    player.value++;
    updateGameUI();

    await sleep(300);
    if (getGameState(Board.value).state != GameStates.inProgress) return;

    let aiMov = getAIMove();
    Board.value[aiMov.i][aiMov.j].textContent = "O";
    player.value--;
    selectSound.play();
    updateGameUI();
  }
}

// Vue built-in function to run any code during the mounting phase of the Vue component
onMounted(() => {
  syncGame();
  listenEndGame();
});

// Vue built-in function to run any code during the unmounting phase of the Vue component
onUnmounted(() => {
  unsyncGame();
  unlistenEndGame();
});
</script>

<template>
    <h3 class="game-status" :class="gameStatusClass">{{ gameStatus }}</h3>
    <div class="board-wrapper">
      <div class="board">
        <!--Rendering the grids for the board variable declared above-->
        <template v-for="(row, i) in Board">
          <template v-for="(ele, j) in row">
            <div class="game-grid center" :class="Board[i][j].classList" v-on:click="(event) => boardMarker(event, i, j)"> {{ Board[i][j].textContent }} </div>
          </template>
        </template>
      </div>
    </div>
    <button class="leave-game-btn" v-on:click="leaveGame">Leave Game</button>
    <div class="scores">
      <!--Rendering the players scores based on the game mode-->
      <template v-if="store.gameMode === 'normal'">
        <span class="player-1-score">X - {{ store.gameRoom["player1_score"] }}</span>
        <span class="player-2-score">O - {{ store.gameRoom["player2_score"] }}</span>
      </template>
      <template v-else-if="store.gameMode === 'ai'">
        <span class="player-1-score">X - {{ aiModeVars.player1Score }}</span>
        <span class="player-2-score">O - {{ aiModeVars.player2Score }}</span>
      </template>
    </div>
</template>

<style>
/*
CSS Styles for the game status, player scores, board wrapper, game board, 
game grid and the leave game button
*/
.game-status {
  color: #9f5f80;
  font-size: 3rem;
  font-family: 'Cormorant Unicase', serif;
  font-weight: 400;
  transition-property: color;
  transition-duration: 500ms;
  transition-timing-function: ease-in;
}

.game-status-X-win {
  color: #fc7130;
  font-weight: 500;
}

.game-status-O-win {
  color: #c02a1f;
  font-weight: 500;
}

.scores {
  font-family: 'Roboto Slab', serif;
  margin: 1%;
  font-weight: 400;
  font-size: 2rem;
}

.player-1-score {
  color: #fc7130;
  margin: 0% 3%;
}

.player-2-score {
  color: #c02a1f;
  margin: 0% 3%;
}

.board-wrapper{
  display: grid;
  place-items: center;
  margin: 1% 0%;
}

.board {
  border-radius: 5px;
  height: 18rem;
  width: 18rem;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 3fr);
  grid-auto-rows: 33.33%;
}

.center{
  display: grid;
  place-items: center;
}

.game-grid {
  border: 3px solid #fcbb7e;
  border-radius: 5px;
  background-color: #fc7130;
  color: #c02a1f;
  cursor: pointer;
  text-align: center;
  font-size: 3rem;
  font-family: 'Oswald', sans-serif;
  font-weight: 300;
  transition-property: color;
  transition-duration: 200ms;
  transition-timing-function: ease-in;
}

.game-grid:focus{
  outline: none;
}

.grid-win {
  color: #ffc996;
}

.leave-game-btn {
  background-color: #FFFFFF;
  border: 0;
  border-radius: 5px;
  box-sizing: border-box;
  color: #9f5f80;
  font-family:  'Roboto Slab', serif;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.25rem;
  padding: 0.5rem 1rem;
  margin: 1%;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.leave-game-btn:hover {
  background-color: rgb(249, 250, 251);
}

.leave-game-btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.leave-game-btn:focus-visible {
  box-shadow: none;
}


@media(max-width: 600px){
  .game-status {
    font-size: 2rem;
  }
}

@media(max-width: 390px){
  .game-status {
    font-size: 1.5rem;
  }
  
  .board {
    height: 16rem;
    width: 16rem;
  }

  .game-grid {
    font-size: 2.5rem;
  }

  .scores {
    font-size: 1.5rem;
  }
}
</style>