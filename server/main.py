import uuid

import eventlet
import socketio
import sqlite3
# import mysql.connector as sql_conn

from utils import *


"""
SocketIO server instance to talk to the client through a web socket 
connection
"""
sio = socketio.Server(cors_allowed_origins="*")

"""
Instance of a Web Server Gateway Interface app with the SocketIO instance
passed in as a parameter
"""
app = socketio.WSGIApp(sio)

"""
Secret server key to encrypt the JWT token 
"""
SERVER_SECRET_KEY = b"2OBj_EgC4dUDzMupN_TmTEUL-ppl6OiXqG9AY4xS7l0="

"""
Database connection and cursor instances
"""
db_conn = sqlite3.connect('./server_db.db')
db_cursor = db_conn.cursor()

# db_conn = sql_conn.connect(host="localhost", user="root", passwd="root", database="server_db")
# db_cursor = db_conn.cursor()
"""
Fernet encryption cipher instance 
"""
crypt_cipher = Fernet(SERVER_SECRET_KEY)



@sio.event
def connect(sid, environ):
    print("User connected:", sid)

@sio.event
def disconnect(sid):
    print("User disconnected:", sid)
    
    # Make the user inactive if logged in
    is_inactive = make_user_inactive(
        db_conn, 
        db_cursor,
        {
            "socketio_id": sid
        } 
    )
    
    if is_inactive:
        print("Success: Deactivated account.")
    else:
        print("Error: Failed to deactivated account.")

# Login.vue
@sio.event
def create_user(sid, data: dict):
    res = {
        "account_create_status": "",
        "user_id": ""
    }
    
    # Create new account with the given data
    user_account = create_account(db_conn, db_cursor, crypt_cipher, data)
    if user_account is not None:
        res["account_create_status"] = "success"
        res["user_id"] = user_account["user_id"]
    else:
        res["account_create_status"] = "error"
    
    return res

@sio.event
def authenticate_user(sid, data: dict):
    res = {
        "account_auth_status": "",
        "jwt_token": "",
        "user_account": ""
    }
    
    token_data = create_jwt_token(db_cursor, crypt_cipher, SERVER_SECRET_KEY, data)
    if token_data is not None:
        res["account_auth_status"] = "success"
        res["jwt_token"] = token_data["jwt_token"]
        res["user_account"] = token_data["user_account"]
        
        # Make user activate with the given data inserted into the database
        player_active_res = make_user_active(
            db_conn, 
            db_cursor,
            {
                "user_id": token_data["user_account"]["user_id"],
                "socketio_id": sid,
                "jwt_token": token_data["jwt_token"]
            }
        )
        if player_active_res is not None:
            print(f"""Success: user "{token_data["user_account"]["user_id"]}" activated.""")
        else:
            print(f"""Error: user "{token_data["user_account"]["user_id"]}" couldn't be activated.""")
    else:
        res["account_auth_status"] = "error"

    return res


# Socket.ts
@sio.event
def activate_user(sid, data: dict):
    res = {
        "activate_user_status": ""
    }
    
    if make_user_active(db_conn, db_cursor, data) is not None:
        res["activate_user_status"] = "success"
    else:
        res["activate_user_status"] = "error"
    
    return res



# PlayerSelect.vue
@sio.event
def fetch_active_players(sid, data: dict):
    res = None
    
    try:
        """
        Fetches the active players in the database 
        without the user's own profile and without 
        any users in game
        """
        
        db_cursor.execute(
            """SELECT user_id, socketio_id FROM ActiveAccounts WHERE user_id != ? AND in_game = 0;""",
            (data["user_id"],)
        )
        
        
        # db_cursor.execute(
        #     """SELECT user_id, socketio_id FROM ActiveAccounts WHERE user_id != %s AND in_game = 0;""",
        #     (data["user_id"],)
        # )
        
        
        res = pretty_recs(db_cursor)
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        
    return res

@sio.event
def send_game_request(sid, data: dict):
    res = {
        "send_game_req_status": ""
    }
    
    try:
        broadcast_game_request(data)
        res["send_game_req_status"] = "success"
    except:
        res["send_game_req_status"] = "error"
        
    return res

def broadcast_game_request(data):
    sio.emit("broadcast_game_request", data, room = data["res_player"]["socketio_id"])

@sio.event
def create_game_room(sid, data: dict):
    res = None
    
    try:
        # Generate a unique UUID for the game room
        socketio_room = str(uuid.uuid4())
        db_cursor.execute(
            """INSERT INTO GameSessions VALUES (?, ?, ?, ?, ?, ?, ?);""",
            (data["req_player"]["user_id"], 0, data["req_player"]["socketio_id"], data["res_player"]["user_id"], 0, data["res_player"]["socketio_id"], socketio_room)
        )
        db_cursor.execute(
            """SELECT * FROM GameSessions WHERE socketio_room = ?;""",
            (socketio_room,)
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """INSERT INTO GameSessions VALUES (%s, %s, %s, %s, %s, %s, %s);""",
        #     (data["req_player"]["user_id"], 0, data["req_player"]["socketio_id"], data["res_player"]["user_id"], 0, data["res_player"]["socketio_id"], socketio_room)
        # )
        # db_cursor.execute(
        #     """SELECT * FROM GameSessions WHERE socketio_room = %s;""",
        #     (socketio_room,)
        # )
        # db_conn.commit()
        
        
        game_room = pretty_rec(db_cursor)
        
        # Add players to the created game room
        sio.enter_room(data["req_player"]["socketio_id"], game_room["socketio_room"])
        sio.enter_room(data["res_player"]["socketio_id"], game_room["socketio_room"])
        # print(f"""Active Game Rooms for {data["req_player"]["user_id"]}: {sio.rooms(data["req_player"]["socketio_id"])}""")
        # print(f"""Active Game Rooms for {data["res_player"]["user_id"]}: {sio.rooms(data["res_player"]["socketio_id"])}""")
        
        # Change players in-game statuses to true
        db_cursor.execute(
            """UPDATE ActiveAccounts SET in_game = 1 WHERE user_id = ? OR user_id = ?""",
            (data["req_player"]["user_id"], data["res_player"]["user_id"])
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """UPDATE ActiveAccounts SET in_game = 1 WHERE user_id = %s OR user_id = %s""",
        #     (data["req_player"]["user_id"], data["res_player"]["user_id"])
        # )
        # db_conn.commit()
        
        
        # Broadcast the game room to the requesting player
        broadcast_game_room(data, game_room)
        
        res = game_room
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
    
    print(res)
    return res
    
def broadcast_game_room(data: dict, game_room: dict):
    sio.emit("broadcast_game_room", game_room, room = data["req_player"]["socketio_id"])



# Game.vue
@sio.event
def broadcast_game(sid, data):
    sio.emit("sync_game", data, room = data["gameRoom"]["socketio_room"])
    
@sio.event
def sync_game_room(sid, data):
    res = {
        "sync_game_room_status": ""
    }
    
    try:
        # Update the score in the database from the user
        db_cursor.execute(
            """UPDATE GameSessions SET player1_score = ?, player2_score = ? WHERE socketio_room = ?;""",
            (data["gameRoom"]["player1_score"], data["gameRoom"]["player2_score"], data["gameRoom"]["socketio_room"])
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """UPDATE GameSessions SET player1_score = %s, player2_score = %s WHERE socketio_room = %s;""",
        #     (data["gameRoom"]["player1_score"], data["gameRoom"]["player2_score"], data["gameRoom"]["socketio_room"])
        # )
        # db_conn.commit()
        
        
        res["sync_game_room_status"] = "success"
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        res["sync_game_room_status"] = "error"
        
    return res

@sio.event
def leave_game(sid, data):
    res = {
        "leave_game_status": ""
    }
    
    try:
        # Change players in-game statuses to false
        db_cursor.execute(
            """UPDATE ActiveAccounts SET in_game = 0 WHERE user_id = ? OR user_id = ?""",
            (data["gameRoom"]["player1_id"], data["gameRoom"]["player2_id"])
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """UPDATE ActiveAccounts SET in_game = 0 WHERE user_id = %s OR user_id = %s""",
        #     (data["gameRoom"]["player1_id"], data["gameRoom"]["player2_id"])
        # )
        # db_conn.commit()
        
        
        end_game(data)
        
        res["leave_game_status"] = "success"
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        res["leave_game_status"] = "error"
        
    return res

def end_game(data: dict):
    sio.emit("end_game", room = data["gameRoom"]["socketio_room"])



if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 3000)), app)