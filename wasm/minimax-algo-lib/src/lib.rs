use wasm_bindgen::prelude::*;
use serde_derive::{
    Serialize,
    Deserialize
};

#[wasm_bindgen]
extern "C"{
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: String);
}


#[derive(Serialize, Deserialize)]
pub struct GameVars{
    player: u32,
    player1Score: u32,
    player2Score: u32,
    board: Vec<Vec<String>>
}


pub unsafe fn log_game_board(board: &Vec<Vec<String>>, game_state: i32) -> (){
    let mut board_formatted = String::new();

    for i in 0..board.len(){
        board_formatted += &format!("{:?}\n", board[i]);
    }

    log( format!( "From Rust:\n{}Game State is: {}", board_formatted, game_state ) );

    if game_state != 2{
        log( format!("\n") );
    }

    return;
}

#[wasm_bindgen]
pub unsafe fn checkGameState(js_game_vars: JsValue) -> i32 {
    let game_vars: GameVars = serde_wasm_bindgen::from_value(js_game_vars).unwrap();
    return check_game_state_rs(&game_vars);
}

fn check_game_state_rs(game_vars: &GameVars) -> i32 {
    let check_win = |ply_char| {
        for i in 0..game_vars.board.len() {
            //Check rows
            let mut row_truthy_cntr = 0;
            for j in 0..game_vars.board.len() {
                if game_vars.board[i][j] == ply_char {
                    row_truthy_cntr += 1;
                }
            }
            if row_truthy_cntr == game_vars.board.len() {
                return true;
            }

            //Check columns
            let mut col_truthy_cntr = 0;
            for j in 0..game_vars.board.len() {
                if game_vars.board[j][i] == ply_char {
                    col_truthy_cntr += 1;
                }
            }
            if col_truthy_cntr == game_vars.board.len() {
                return true;
            }
        }

        //Check LTR Diagonal
        let mut ltr_truthy_cntr = 0;
        
        let mut j = 0;
        for i in 0..game_vars.board.len() {
            if game_vars.board[i][j] == ply_char {
                ltr_truthy_cntr += 1;
            }

            if !j < game_vars.board.len(){
                break;
            }
            else {
                j += 1;
            }
        }
        if ltr_truthy_cntr == game_vars.board.len() {
            return true;
        }

        //Check RTL Diagonal
        let mut rtl_truthy_cntr = 0;

        let mut j = game_vars.board.len() - 1;
        for i in 0..game_vars.board.len() {
            if game_vars.board[i][j] == ply_char {
                rtl_truthy_cntr += 1;
            }

            if !(j as i32) > -1 {
                break;
            }
            else {
                j -= 1;
            }
        }
        if rtl_truthy_cntr == game_vars.board.len() {
            return true;
        }

        return false;
    };
    let check_draw = || {
        let mut draw_truthy_cntr = 0;
        for i in 0..game_vars.board.len() {
            for j in 0..game_vars.board.len() {
                if game_vars.board[i][j] != "" {
                    draw_truthy_cntr += 1;
                }
            }
            if draw_truthy_cntr == (game_vars.board.len() * game_vars.board.len()) {
                return true;
            }
        }

        return false;
        // return Board[0][0] != "" && Board[0][1] != "" && Board[0][2] != "" && Board[1][0] != "" && Board[1][1] != "" && Board[1][2] != "" && Board[2][0] != "" && Board[2][1] != "" && Board[2][2] != "";
    };

    if check_win("X") { return 1; }      //Checks Winner X
    if check_win("O") { return -1; }     //Checks Winner O   
    if check_draw() { return 0; }       //Checks Draw
    return 2;                         //Game in Progress
}

#[wasm_bindgen]
pub unsafe fn minimax(js_game_vars: JsValue, js_depth: i32, js_alpha: i32, js_beta: i32, js_is_maximizing: bool) -> i32 {
    let mut game_vars: GameVars = serde_wasm_bindgen::from_value(js_game_vars).unwrap();
    return minimax_rs(&mut game_vars, js_depth, js_alpha, js_beta, js_is_maximizing);
}

unsafe fn minimax_rs(game_vars: &mut GameVars, depth: i32, mut alpha: i32, mut beta: i32, is_maximizing: bool) -> i32 {
    let game_state = check_game_state_rs(&game_vars);

    //log_game_board(&game_vars.board, game_state);

    if game_state == 1 {
        return 1;
    }
    else if game_state == -1 {
        return -1;
    }
    else if game_state == 0 || depth == 0 {
        return 0;
    }

    if is_maximizing {
        let mut best_eval: i32 = -f32::INFINITY as i32;
        let mark: String = String::from("X");

        'loop1:
        for i in 0..game_vars.board.len() {
            'loop2:
            for j in 0..game_vars.board.len() {
                if game_vars.board[i][j] == "" {
                    game_vars.board[i][j] = mark.clone();

                    let evaluation: i32 = minimax_rs(game_vars, depth - 1, alpha, beta, false);

                    game_vars.board[i][j] = String::from("");
                    
                    best_eval = std::cmp::max(best_eval, evaluation);

                    alpha = std::cmp::max(alpha, evaluation);
                    if beta <= alpha {
                        break 'loop1;
                    }
                }
            }
        }
        return best_eval;
    }
    else {
        let mut best_eval: i32 = f32::INFINITY as i32;
        let mark: String = String::from("O");

        'loop1:
        for i in 0..game_vars.board.len() {
            'loop2:
            for j in 0..game_vars.board.len() {
                if game_vars.board[i][j] == "" {
                    game_vars.board[i][j] = mark.clone();

                    let evaluation: i32 = minimax_rs(game_vars, depth - 1, alpha, beta, true);
                    
                    game_vars.board[i][j] = String::from("");
                    
                    best_eval = std::cmp::min(best_eval, evaluation);

                    beta = std::cmp::min(beta, evaluation);
                    if beta <= alpha {
                        break 'loop1;
                    }
                }
            }
        }
        return best_eval;
    }
}