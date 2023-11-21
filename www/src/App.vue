<script setup lang="ts">
import { ref, watch, onMounted, onUpdated } from "vue";

import Game from "./game-components/Game.vue";
import Login from "./game-components/Login.vue";
import PlayerSelect from "./game-components/PlayerSelect.vue"

import { store, restoreStore } from "./store";

// Vue built-in function to run any code during the mounting phase of the Vue component
onMounted(() => {
  // Restore all values to the store for sessionStorage (if any)
  restoreStore();
});
</script>

<template>
  <div class="content-wrapper">
    <div class="content">
      <h1 class="main-heading">Tic-Tac-Toe</h1>
      <!--JWT auth token is provided to the client 
        after successfully logging in-->
      <template v-if="store.jwtToken === null">
        <Login />
      </template>
      <!--Game room is provided once the player selects 
      an opponent to play against in normal mode-->
      <template v-else-if="store.gameRoom === null && store.gameMode === null">
        <PlayerSelect />
      </template>
      <!--Once the user is logged in, a mode is selected or an opponent is selected. The game component 
      can be loaded in-->
      <template v-else>
        <Game />
      </template>
    </div>
  </div>
</template>

<style>
/*
CSS styles for the body, content wrapper and the heading
*/
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400;700&family=Oswald:wght@300;400;500&family=Cormorant+Unicase:wght@300;500&display=swap'); 

*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #fcbb7e;
  text-align: center;
  user-select: none;
}

.content-wrapper{
  height: 100vh;
  display: grid;
  place-items: center;
}

.main-heading {
  color: #583d72;
  font-size: 6rem;
  font-family: 'Roboto Slab', serif;
  font-weight: 700;
}

@media(max-width: 600px){
  .main-heading {
    font-size: 4rem;
  }
}

@media(max-width: 390px){
  .main-heading {
    font-size: 3rem;
  }
}
</style>
