import { ref } from "vue";

/*
A global data structure to store variables that can be 
accessed through the program
*/
export const store = ref({
    jwtToken: null,
    userAccount: null,
    gameRoom: null,
    gameMode: null
});

// Restores the variables from sessionStorage on reloading the client
export function restoreStore() {
    store.value.jwtToken = sessionStorage.getItem("jwtToken");
    store.value.userAccount = JSON.parse(sessionStorage.getItem("userAccount"));
    store.value.gameRoom = JSON.parse(sessionStorage.getItem("gameRoom"));
};


// Preserves the variables in the store into the sessionsStorage
export function preserveStore() {
    sessionStorage.setItem("jwtToken", store.value.jwtToken);
    sessionStorage.setItem("userAccount", JSON.stringify(store.value.userAccount));
    // sessionStorage.setItem("gameRoom", JSON.stringify(store.value.gameRoom));
}

// Resets the variables of the store if needed
export function resetStore() {
    store.value.jwtToken = null;
    store.value.userAccount = null;
    store.value.gameRoom = null;
    store.value.gameMode = null;
}