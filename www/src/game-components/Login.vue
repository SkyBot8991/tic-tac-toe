<script setup lang="ts">
import { ref, onMounted, onUpdated } from "vue";
import { store, preserveStore } from "../store";
import { socket } from "../socket";

// Logic for the toggle button to switch between user login and new user account creation
let signIn = ref(true)
function toggleLoginPage() {
  signIn.value = !signIn.value;
}

// Logic to create new account for a new user
let newUserid = ref("");
let newPasswd = ref("");
let confirmPasswd = ref("");
function createUser() {
  if (newPasswd.value !== confirmPasswd.value) {
    alert("Error: Confirm password is not the same, Try again!");
    return;
  }

  // Sending the new user's credentials to the server via socketIO
  socket.emit("create_user", {user_id: newUserid.value.toLowerCase(), passwd: newPasswd.value}, (res) => {
    if (res["account_create_status"] === "error") {
      alert("Error: Account creation failed!");
      return;
    }
    
    alert(`Account created successfully! User ID is: '${res["user_id"]}'`);
    signIn.value = true;

    // Reseting the variables for new account entry
    newUserid.value = "";
    newPasswd.value = "";
    confirmPasswd.value = "";
  });
}

// Logic for existing users to login
let userid = ref("");
let passwd = ref("");
function authenUser() {
  // Sending the user's credentials to the server via socketIO
  socket.emit('authenticate_user', {user_id: userid.value.toLowerCase(), passwd: passwd.value}, (res) => {
    if (res["account_auth_status"] == "error") {
      alert("Error: Failed to authenticate!");
      return;
    }

    // Copying the JWT auth token and account details to the store
    store.value.jwtToken = res["jwt_token"];
    store.value.userAccount = res["user_account"];
    preserveStore();

    console.log("JWT Token: ", res["jwt_token"]);
    console.log("User Account: ", res["user_account"]);
  });
}
</script>

<template>
  <div class="login-wrapper">
    <h3 class="login-heading">Game Login</h3>
    <!--Button to switch between the forms-->
    <button class="login-page-toggle" v-on:click="toggleLoginPage">{{ signIn ? "New here? Click to create a new account..." : "Go back to login..."}}</button>
    <!--Login form-->
    <template v-if="signIn">
      <form v-on:submit.prevent="authenUser" class="login">
        <div class="userid">
          <label for="userid" class="login-label">UserID:</label>
          <input type="text" class="login-input" id="userid" v-model="userid" required />
        </div>
        <div class="passwd">
          <label for="passwd" class="login-label">Password:</label>
          <input type="password" class="login-input" id="passwd" v-model="passwd" required />
        </div>
        <button type="submit" class="login-submit">Login</button>
      </form>
    </template>
    <!--Account creation form-->
    <template v-else>
      <form v-on:submit.prevent="createUser" class="login">
        <div class="new-userid">
          <label for="new-userid" class="login-label">New UserID:</label>
          <input type="text" class="login-input" id="new-userid" v-model="newUserid" required />
        </div>
        <div class="new-passwd">
          <label for="new-passwd" class="login-label">New Password:</label>
          <input type="password" class="login-input" id="new-passwd" v-model="newPasswd" required />
        </div>
        <div class="confirm-passwd">
          <label for="confirm-passwd" class="login-label">Confirm Password:</label>
          <input type="password" class="login-input" id="confirm-passwd" v-model="confirmPasswd" required />
        </div>
        <button type="submit" class="create-submit">Create</button>
      </form>
    </template>
  </div>
</template>

<style>
/*
CSS styles for the login wrapper, login heading, the page toggle button, the form layout,
the login labels, the submit and create buttons
*/
.login-wrapper {
  display: grid;
  place-items: center;
  text-align: left;
}

.login-heading {
  color: #9f5f80;
  font-size: 3rem;
  font-family: 'Cormorant Unicase', serif;
  font-weight: 500;
  padding: 3%, 0;
}

.login-page-toggle {
  background-color: #FFFFFF;
  border: 0;
  border-radius: 0.5rem;
  box-sizing: border-box;
  color: #9f5f80;
  font-family:  'Roboto Slab', serif;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25rem;
  margin: 2%;
  padding: 0.5rem 1rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.login-page-toggle:hover {
  background-color: rgb(249, 250, 251);
}

.login-page-toggle:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.login-page-toggle:focus-visible {
  box-shadow: none;
}

.login {
  height: 14rem;
  width: 14rem;
}

.login-label {
  color: #9f5f80;
  font-family: 'Roboto Slab', serif;
  margin: 1%;
  font-weight: 400;
  font-size: 1rem;
}

.login-submit, .create-submit {
  background-color: #FFFFFF;
  border: 0;
  border-radius: 0.2rem;
  box-sizing: border-box;
  color: #9f5f80;
  font-family:  'Roboto Slab', serif;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25rem;
  padding: 0.2rem 1rem;
  margin: 2%;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.login-submit:hover, .create-submit:hover {
  background-color: rgb(249, 250, 251);
}

.login-submit:focus, .create-submit:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.login-submit:focus-visible, .create-submit:focus-visible {
  box-shadow: none;
}

.login-input {
  border-radius: 0.5rem;
  padding: 5%;
  margin: 1%;
}

@media(max-width: 600px){
  .login-heading {
    font-size: 2rem;
  }
}

@media(max-width: 390px){
  .login-heading {
    font-size: 1.5rem;
  }
}
</style>
