import { io } from "socket.io-client";
import { store, resetStore } from "./store"

/*
SocketIO client instance to talk to the sever through a full duplex 
web socket connection
*/
const wsPort = 3000;
export const socket = io(`http://${window.location.hostname}:${wsPort}`);

/*
Logic to run on the client-side when the user successfully connects to 
the server
*/
socket.on("connect", () => {
  console.log('SocketIO ID:', socket.id);

  /*
  Trying to set the user activate on the server if 
  disconnected in between
  */
  if (store.value.userAccount !== null) {
    let activate_user_data = {
      "user_id": store.value.userAccount["user_id"],
      "socketio_id": socket.id,
      "jwt_token": store.value.jwtToken
    }

    socket.emit("activate_user", activate_user_data, (res) => {
      if (res["activate_user_status"] == "success") {
        console.log(`Success: user '${activate_user_data["user_id"]}' activated.`);
      }
      else {
        console.log(`Failure: user '${activate_user_data["user_id"]}' couldn't be activated.`);
        resetStore();
      }
    });
  }
});