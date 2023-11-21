<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { store, preserveStore } from "../store";
import { socket } from "../socket";

// Logic to fetch active accounts from the server
let activePlayers = ref([]);
function fetchActivePlys() {
  socket.emit("fetch_active_players", {"user_id": store.value.userAccount["user_id"]}, (res) => {
    activePlayers.value = res;
    // console.log(res);
  });
}

// Logic for the AI mode button
function playAImode() {
  store.value.gameMode = "ai";
}

// Logic to send a game request to the user-chosen opponent player
function sendGameRequest(player_data) {
  let req_player = {
    "user_id": store.value.userAccount["user_id"],
    "socketio_id": socket.id
  }
  let data = {
    req_player: req_player,
    res_player: player_data
  };

  console.log(data);

  socket.emit("send_game_request", data, (res) => {
    if (res["send_game_req_status"] == "success") {
      console.log(`Success: send request to user '${data["res_player"]["user_id"]}'.`);
    }
    else {
      console.log(`Error: request to user '${data["res_player"]["user_id"]}' couldn't be send.`)
    }
  });
}

// Logic for the opponent player to listen to any incoming game requests
function listenGameRequests() {
  socket.on("broadcast_game_request", (res) => {
    // console.log(res);

    // Confirmation to create a new game room
    if (confirm(`You have a game request from '${res["req_player"]["user_id"]}'`)) {
      // Asks the server to a create a new game room for the players to play in
      socket.emit("create_game_room", res, (res) => {
        // console.log(res);

        store.value.gameRoom = res;
        store.value.gameMode = "normal";
        preserveStore();
      });
    }
    else {
      console.log("Game request rejected.")
    }
  });
}

/*
Logic to listen the game room details that will be send by the server after 
creation of new game room.
*/
function listenGameRoom() {
  socket.on("broadcast_game_room", (res) => {
    // console.log(res);
    
    store.value.gameRoom = res;
    store.value.gameMode = "normal";
    preserveStore();
  });
}

// Logic to turn the game request listener after the component is unmounted
function unlistenGameRequests() {
  socket.off("broadcast_game_request");
}

// Logic to turn the game room details listener after the component is unmounted
function unlistenGameRoom() {
  socket.off("broadcast_game_room");
}

let activePlysIntervalId;
// Vue built-in function to run any code during the mounting phase of the Vue component
onMounted(() => {
  /*
  Setting an interval for the fetching of active players on the network that will execute
  after every 100 milliseconds.
  */
  activePlysIntervalId = setInterval(fetchActivePlys, 100);
  listenGameRequests();
  listenGameRoom();
});

// Vue built-in function to run any code during the unmounting phase of the Vue component
onUnmounted(() => {
  clearInterval(activePlysIntervalId);
  unlistenGameRequests();
  unlistenGameRoom();
});
</script>

<template>
  <h3 class="plys-list-heading">Pick an opponent</h3>
  <div class="plys-list center">
    <!--Button to choose single player mode with the AI-->
    <button class="play-aimode-btn" v-on:click="playAImode">Want to play alone? Play with AI</button>
    <!--No active players available message-->
    <div class="no-player-msg" v-if="activePlayers.length === 0">
      No player currently online...
    </div>
    <!--List of active players, with a request button, on the network (if any)-->
    <div v-for="player in activePlayers" :key="player.user_id" class="ply-details">
      <img src="/img/ply_select_avatar.png" alt="Player Avatar" class="player-icon"/>
      <h2 class="player-id">{{ player["user_id"] }}</h2>
      <button v-on:click="sendGameRequest(player)" class="request-btn">Request Game</button>
    </div>
  </div>
</template>

<style>
/*
CSS styles for the active players list and its heading, aimode selector button, 
for the no active players message, player details and request game button
*/
.plys-list-heading {
  color: #9f5f80;
  font-size: 3rem;
  font-family: 'Cormorant Unicase', serif;
  font-weight: 500;
  padding: 3%, 0;
}

.plys-list {
  margin: 1%;
}

.center{
  display: grid;
  place-items: center;
}

.play-aimode-btn {
  background-color: #FFFFFF;
  border: 0;
  border-radius: 0.5rem;
  box-sizing: border-box;
  color: #9f5f80;
  font-family:  'Roboto Slab', serif;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25rem;
  padding: 0.5rem 1rem;
  margin: 2%;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.play-aimode-btn:hover {
  background-color: rgb(249, 250, 251);
}

.play-aimode-btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.play-aimode-btn:focus-visible {
  box-shadow: none;
}

.no-player-msg {
  color: #9f5f80;
  font-size: 2rem;
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-weight: 600;
  margin: 2%;
}

.ply-details{
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  margin: 1%;
  padding: 2%;
  width: 50%;
  display: grid;
  justify-items: start;
  grid-template-columns: minmax(0, 2fr) minmax(0, 4fr) minmax(0, 2fr);
  grid-auto-rows: 100%;
}

.player-icon, .player-id, .request-btn {
  margin: 1%;
}

.player-icon {
  border-radius: 50%;
  height: 30px;
  width: 30px;
}

.player-id {
  color: #9f5f80;
  font-family: 'Roboto Slab', serif;
  font-weight: 400;
  font-size: 1rem;
}

.request-btn {
  background-color: #FFFFFF;
  border: 0;
  border-radius: 0.5rem;
  box-sizing: border-box;
  color: #9f5f80;
  font-family:  'Roboto Slab', serif;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.2rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
</style>
