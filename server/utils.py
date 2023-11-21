import sqlite3
# import mysql.connector as sql_conn

from cryptography.fernet import Fernet
import jwt

"""
Reformats a record from the database's cursor into a organized
dictionary
"""
def pretty_rec(db_cursor):
    cursor_table_desc = db_cursor.description
    rec = db_cursor.fetchone()
    if rec is None:
        return None
    
    new_rec = {}
    for i in range(0, len(cursor_table_desc)):
        field_name = cursor_table_desc[i][0]
        field_data = rec[i]
        
        new_rec[field_name] = field_data
    
    return new_rec

"""
Reformats records from the database's cursor into a list of organized
dictionaries
"""
def pretty_recs(db_cursor):
    cursor_table_desc = db_cursor.description
    recs = db_cursor.fetchall()
    if recs is None:
        return None
    
    res = []
    for rec in recs:
        new_rec = {}
        for i in range(0, len(cursor_table_desc)):
            field_name = cursor_table_desc[i][0]
            field_data = rec[i]

            new_rec[field_name] = field_data

        res.append(new_rec)
    
    return res

"""
Returns a matching account from the table of existing users
"""
def get_matched_account(db_cursor, data: dict):
    try:
        db_cursor.execute("""SELECT * FROM Accounts WHERE user_id = ?;""", (data["user_id"],))
        
        # db_cursor.execute("""SELECT * FROM Accounts WHERE user_id = %s;""", (data["user_id"],))
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
    
    return pretty_rec(db_cursor)

"""
Returns a matching account from the table of active users
"""
def get_active_account(db_cursor, data: dict):
    try:
        db_cursor.execute("""SELECT * FROM ActiveAccounts WHERE user_id = ?;""", (data["user_id"],))
    
        # db_cursor.execute("""SELECT * FROM ActiveAccounts WHERE user_id = %s;""", (data["user_id"],))
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
    
    return pretty_rec(db_cursor)



"""
Creates an account in the existing user's table 
"""
def create_account(db_conn, db_cursor, crypt_cipher, data: dict):
    try:
        no_similar_recs = db_cursor.execute(
            """SELECT COUNT(*) FROM Accounts WHERE user_id LIKE ?;""",
            (data["user_id"] + "#%",)
        ).fetchone()[0]
        
        
        # no_similar_recs = db_cursor.execute(
        #     """SELECT COUNT(*) FROM Accounts WHERE user_id LIKE %s;""",
        #     (data["user_id"] + "#%",)
        # ).fetchone()[0]
                
        
        discriminator = no_similar_recs + 1
        
        user_id = f"""{data["user_id"]}#{discriminator}"""
        encrypted_passwd = crypt_cipher.encrypt(data["passwd"].encode()).decode()
        db_cursor.execute(
            """INSERT INTO Accounts VALUES (?, ?)""", 
            (user_id, encrypted_passwd)
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """INSERT INTO Accounts VALUES (%s, %s)""", 
        #     (user_id, encrypted_passwd)
        # )
        # db_conn.commit()
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        return None
    else:
        return get_matched_account(
            db_cursor,
            {
                "user_id": user_id,
                "passwd": data["passwd"]
            }
        )

"""
Creates a JWT token for the user from their account
"""
def create_jwt_token(db_cursor, crypt_cipher, SERVER_SECRET_KEY, data: dict):
    matched_account = get_matched_account(db_cursor, data)
    data_none = lambda: matched_account["passwd_hash"] is None or matched_account["passwd_hash"] is None
    passwd_correct = lambda: data["passwd"] == crypt_cipher.decrypt(matched_account["passwd_hash"].encode()).decode()

    if data_none() or passwd_correct():
        token = jwt.encode(payload=data, key=SERVER_SECRET_KEY, algorithm='HS256')
        user_account = { "user_id": matched_account["user_id"] }
        return {
            "jwt_token": token,
            "user_account": user_account
        }
    else:
        print("""Error: User-entered password is invalid.""")
        return None

# Login.vue
"""
Makes the logged in user active
"""
def make_user_active(db_conn, db_cursor, data: dict):
    try:
        db_cursor.execute(
            """INSERT INTO ActiveAccounts VALUES (?, ?, ?, ?);""",
            (data["user_id"], data["socketio_id"], data["jwt_token"], 0)
        )
        db_conn.commit()
        
        # db_cursor.execute(
        #     """INSERT INTO ActiveAccounts VALUES (%s, %s, %s, %s);""",
        #     (data["user_id"], data["socketio_id"], data["jwt_token"], 0)
        # )
        # db_conn.commit()
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        return None
    else:
        return get_active_account(db_cursor, data)

"""
Makes the logged in user inactive
"""
def make_user_inactive(db_conn, db_cursor, data: dict):
    try:
        db_cursor.execute(
            """DELETE FROM ActiveAccounts WHERE socketio_id = ?;""",
            (data["socketio_id"],)
        )
        db_conn.commit()
        
        
        # db_cursor.execute(
        #     """DELETE FROM ActiveAccounts WHERE socketio_id = %s;""",
        #     (data["socketio_id"],)
        # )
        # db_conn.commit()
    except sqlite3.Error as err:
        print(f"""Error: SQL command execution failed\n"{err}" """)
        return False
    else:
        return True