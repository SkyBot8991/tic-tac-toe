#[derive(PartialEq)]
#[derive(Clone)]
#[derive(Serialize, Deserialize)]
#[derive(Debug)]
enum PlyAvatar {
    X,
    O,
    Empty
}

impl PlyAvatar {
    fn to_str(&self) -> &str {
        match self {
            PlyAvatar::X => return "X",
            PlyAvatar::O => return "O",
            PlyAvatar::Empty => return ""
        };
    }

    fn to_string(&self) -> String {
        match self {
            PlyAvatar::X => return "X".to_string(),
            PlyAvatar::O => return "O".to_string(),
            PlyAvatar::Empty => return "".to_string()
        };
    }

    fn to_num(&self) -> String {
        match self {
            PlyAvatar::X => return "1".to_string(),
            PlyAvatar::O => return "2".to_string(),
            PlyAvatar::Empty => return "".to_string()
        };
    }
}

#[derive(Clone)]
#[derive(Serialize, Deserialize)]
#[derive(Debug)]
struct Player{
    pub avatar: PlyAvatar,
    pub score: u32,
    pub is_curr: bool
}

impl Player {
    pub fn new(new_avatar: PlyAvatar, new_score: u32, new_is_curr: bool) -> Self {
        return Player { 
            avatar: new_avatar, 
            score: new_score, 
            is_curr: new_is_curr
        };
    }
}

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
struct Players {
    X: Player,
    O: Player
}

impl Players {
    pub fn new() -> Self {
        return Players { 
            X: Player::new(PlyAvatar::X, 0, true), 
            O: Player::new(PlyAvatar::O, 0, false) 
        };
    }

    pub fn reset_curr_bool(&mut self) {
        self.X.is_curr = true;
        self.O.is_curr = false;
    }

    pub fn get_by_curr_bool(&mut self, flag: bool) -> &mut Player {
        if flag == true {
            // Method of Contradiction
            if self.X.is_curr == true {
                return &mut self.X;
            }
            else {
                return  &mut self.O;
            }
        }
        else {
            // Method of Contradiction
            if self.X.is_curr == false {
                return &mut self.X;
            }
            else {
                return  &mut self.O;
            }
        }
    }

    pub unsafe fn pass_to_next_ply(&mut self) {
        // Method of Contradiction
        if self.X.is_curr {
            self.X.is_curr = false;
            self.O.is_curr = true;
        }
        else {
            self.X.is_curr = true;
            self.O.is_curr = false;
        }
    }
}

// To rank the runtime generated win sequences
#[derive(Serialize, Deserialize)]
#[derive(Debug)]
struct GameWinSeq{
    pub vec: Vec<(usize, usize)>,
    pub state: f64,
}

#[derive(Serialize, Deserialize)]
struct Board{
    pub vec: Vec<Vec<String>>,
    pub len: usize
}

impl Board {
    pub unsafe fn new(new_len: usize) -> Self{
        let mut new_vec: Vec<Vec<String>> = Vec::new();

        for i in 0..new_len{
            let mut row_vec = Vec::new();
            for j in 0..new_len{
                row_vec.push(
                    Board::get_ui_grid_content(new_len, i, Some(j))
                );
            }
            new_vec.push(row_vec);
        } 
        
        return Board {
            vec: new_vec,
            len: new_len
        };
    }

    pub unsafe fn get_ui_grid_content(board_length: usize, i: usize, j: Option<usize>) -> String{
        match j {
            Some(j) => {
                let grid_no = (i * board_length) + (j + 1);
                let ele_name = format!(" .grid-{}", grid_no);
                return window()
                    .expect("Error: Couldn't find global DOM window!")
                    .document()
                    .expect("Error: Couldn't find global DOM document!")
                    .query_selector(ele_name.as_str())
                    .expect("Error: Cannot get Element!")
                    .expect("Error: Element is empty!")
                    .text_content()
                    .expect("Error: Cannot get text_content!");
            },
            None => {
                let ele_name = format!(" .grid-{}", i);
                return window()
                    .expect("Error: Couldn't find global DOM window!")
                    .document()
                    .expect("Error: Couldn't find global DOM document!")
                    .query_selector(ele_name.as_str())
                    .expect("Error: Cannot get Element!")
                    .expect("Error: Element is empty!")
                    .text_content()
                    .expect("Error: Cannot get text_content!");
            }
        }
    }

    pub unsafe fn refresh(&mut self){
        for i in 0..self.len{
            for j in 0..self.len{
                self.vec[i][j] = Board::get_ui_grid_content(self.len, i, Some(j));
            }
        }
    }

    pub unsafe fn clear(&mut self){
        for i in 0..self.len{
            for j in 0..self.len{
                self.vec[i][j] = PlyAvatar::Empty.to_string();
            }
        }
    }
}


#[derive(Serialize, Deserialize)]
struct Game {
    board: Board,
    game_win_seqs: Vec<GameWinSeq>,
    players: Players
}

impl Game {
    pub unsafe fn new(board_length: usize) -> Self{
        return Game {
            board: Board::new(board_length),
            game_win_seqs: Game::generate_win_seqs(board_length),
            players: Players::new()
        }
    }

    pub unsafe fn reset_game_data(&mut self){
        self.board.clear();
        self.players.reset_curr_bool();
    }


    pub unsafe fn get_ui_grid(board_len: usize, i: usize, j: Option<usize>) -> Element{
        match j {
            Some(j) => {
                let grid_no = (i * board_len) + (j + 1);
                let ele_name = format!(" .grid-{}", grid_no);
                return window()
                    .expect("Error: Couldn't find global DOM window!")
                    .document()
                    .expect("Error: Couldn't find global DOM document!")
                    .query_selector(ele_name.as_str())
                    .expect("Error: Cannot get Element!")
                    .expect("Error: Element is empty!");
            },
            None => {
                let ele_name = format!(" .grid-{}", i);
                return window()
                    .expect("Error: Couldn't find global DOM window!")
                    .document()
                    .expect("Error: Couldn't find global DOM document!")
                    .query_selector(ele_name.as_str())
                    .expect("Error: Cannot get Element!")
                    .expect("Error: Element is empty!");
            }
        }
    }

    pub unsafe fn update_ui(&mut self){
        let win_seq = self.get_corrtd_win_seq();
        let sub_heading_ele: Element =  window()
            .expect("Error: Couldn't find global DOM window!")
            .document()
            .expect("Error: Couldn't find global DOM document!")
            .query_selector(".sub-heading")
            .expect("Error: Cannot get Element!")
            .expect("Error: Element is empty!");

        if win_seq.state == 1.0{
            for seq_pos in &win_seq.vec {
                let (i, j) = seq_pos.clone();
                Game::get_ui_grid(self.board.len as usize, i, Some(j))
                    .class_list()
                    .add_1("grid-win")
                    .expect("Error: Couldn't add name 'grid-win' to class list!");
            }

            sub_heading_ele
                .set_text_content(
                    Some("Player 1 Wins!")
                );

            sub_heading_ele
                .class_list()
                .add_1("sub-heading-X-win")
                .expect("Error: Couldn't add name 'sub-heading-X-win' to class list!");

            self.reset_ui();
            self.reset_game_data();
        }
        else if win_seq.state == -1.0{
            for seq_pos in &win_seq.vec {
                let (i, j) = seq_pos.clone();
                Game::get_ui_grid(self.board.len as usize, i, Some(j))
                    .class_list()
                    .add_1("grid-win")
                    .expect("Error: Couldn't add name 'grid-win' to class list!");
            }

            sub_heading_ele
                .set_text_content(
                    Some("Player 2 Wins!")
                );

            sub_heading_ele
                .class_list()
                .add_1("sub-heading-O-win")
                .expect("Error: Couldn't add 'sub-heading-O-win' name to class list!");


            self.reset_ui();
            self.reset_game_data();
        }
        else if win_seq.state == 0.0 {
            sub_heading_ele
                .set_text_content(
                    Some("Draw!")
                );

            self.reset_ui();
            self.reset_game_data();
        }
        else {
            let current_ply = self.players.get_by_curr_bool(true);
            
            sub_heading_ele
                .set_text_content(
                    Some(
                        format!("Player {}'s Turn", current_ply.avatar.to_num()).as_str()
                    )
                );
        }
    }

    pub unsafe fn reset_ui(&mut self){
        for i in 0..self.board.len {
            for j in 0..self.board.len {
                Game::get_ui_grid(self.board.len as usize, i, Some(j))
                    .set_text_content(
                        Some(
                            PlyAvatar::Empty.to_str()
                        )
                    );
            }
        }
        
        let grid_item_len: usize =  window()
            .expect("Error: Couldn't find global DOM window!")
            .document()
            .expect("Error: Couldn't find global DOM document!")
            .query_selector_all(".grid-item")
            .expect("Error: Cannot get NodeList for 'grid-item'!")
            .length() as usize;

        for i in 1..grid_item_len {
            Game::get_ui_grid(self.board.len as usize, i, None)
                .class_list()
                .remove_1("grid-win")
                .expect("Error: Couldn't remove 'grid-win' from the grid div!");
        }

        let sub_heading_ele: Element =  window()
            .expect("Error: Couldn't find global DOM window!")
            .document()
            .expect("Error: Couldn't find global DOM document!")
            .query_selector(".sub-heading")
            .expect("Error: Cannot get Element for 'sub-heading'!")
            .expect("Error: 'sub-heading' Element is empty!");
        
        sub_heading_ele
            .set_text_content(
                Some(
                    format!("Player {}'s Turn", PlyAvatar::X.to_num()).as_str()
                )
            );
        sub_heading_ele
            .class_list()
            .remove_1("sub-heading-X-win")
            .expect("Error: Couldn't remove 'sub-heading-X-win' from class list!");
        sub_heading_ele
            .class_list()
            .remove_1("sub-heading-O-win")
            .expect("Error: Couldn't remove 'sub-heading-O-win' from class list!");
    }


    fn generate_win_seqs(board_length: usize) -> Vec<GameWinSeq>{
        let mut game_win_seqs: Vec<GameWinSeq> = Vec::new();

        for i in 0..board_length {
            {
                let mut game_win_seq = GameWinSeq{
                    vec: Vec::new(),
                    state: 0.0
                };

                for j in 0..board_length {
                    game_win_seq.vec.push(
                       (i, j)
                    ); 
                }

                game_win_seqs.push(
                    game_win_seq
                );
            }

            {
                let mut game_win_seq = GameWinSeq{
                    vec: Vec::new(),
                    state: 0.0
                };
                
                for j in 0..board_length {
                    game_win_seq.vec.push(
                        (j, i)
                    ); 
                }

                game_win_seqs.push(
                    game_win_seq
                );
            }
        }

        {
            let mut game_win_seq = GameWinSeq{
                vec: Vec::new(),
                state: 0.0
            };

            let mut j = 0;
            for i in 0..board_length {
                game_win_seq.vec.push(
                   (i, j)
                );
    

                j += 1;
                if !j < board_length{
                    break;
                }
            }

            game_win_seqs.push(
                game_win_seq
            );
        }

        {

            let mut game_win_seq = GameWinSeq{
                vec: Vec::new(),
                state: 0.0
            };

            let mut j = board_length - 1;
            for i in 0..board_length {
                game_win_seq.vec.push(
                   (i, j)
                );
    
                j -= 1;
                if !(j as i32) > -1 {
                    break;
                }
            }

            game_win_seqs.push(
                game_win_seq
            );
        }

        return game_win_seqs;
    }

    unsafe fn update_win_seqs_states(&mut self) -> () {
        self.board.refresh();

        for game_win_seq in &mut self.game_win_seqs{
            let mut win_seq_state: f64 = 0.0;
            let state_step_val: f64 = 1.0/(self.board.len as f64);

            for seq_pos in &game_win_seq.vec {
                let (i, j) = seq_pos.clone();

                if self.board.vec[i][j] == PlyAvatar::X.to_string(){
                    win_seq_state += state_step_val;
                }
                else if self.board.vec[i][j] == PlyAvatar::O.to_string() {
                    win_seq_state -= state_step_val;
                }
            }

            game_win_seq.state = win_seq_state;
        }
    }

    // Corrects any errors in the floating point state (rank) value
    pub unsafe fn get_corrtd_win_seq(&mut self) -> GameWinSeq{
        self.update_win_seqs_states();

        let mut corrtd_win_seq: GameWinSeq = GameWinSeq { 
            vec: Vec::new(), 
            state: 0.0
        };
        for win_seq in &self.game_win_seqs {
            if win_seq.state.abs() > corrtd_win_seq.state.abs() {
                corrtd_win_seq.vec = win_seq.vec.clone();
                corrtd_win_seq.state = win_seq.state;
            }
        }

        let mut draw_truthy_cntr = 0;
        for row in &self.board.vec {
            for grid in row {
                if *grid != PlyAvatar::Empty.to_string() {
                    draw_truthy_cntr += 1;
                }
            }
        }

        let board_size: f64 = self.board.len as f64;
        let state_step_val: f64 = 1.0/board_size;

        let state_upper_bound = (board_size - 1.0) * state_step_val;
        let state_lower_bound = -((board_size - 1.0) * state_step_val);

        if corrtd_win_seq.state > state_upper_bound && corrtd_win_seq.state < 1.0 {
            corrtd_win_seq.state = 1.0;              //Checks Winner X
        }
        else if corrtd_win_seq.state > -1.0 && corrtd_win_seq.state < state_lower_bound {
            corrtd_win_seq.state = -1.0;             //Checks Winner O
        }
        else if draw_truthy_cntr == self.board.len.pow(2)  {
            corrtd_win_seq.state = 0.0;             //Checks Draw
        }
        else {
            //No correction                        //Game in Progress
        }

        return corrtd_win_seq;    
    }

    unsafe fn minimax(&mut self, depth: i32, mut alpha: f64, mut beta: f64, is_maximizing: bool) -> f64 {
        let game_state = self.get_corrtd_win_seq().state;

        if game_state == 1.0 {
            return 1.0;
        }
        else if game_state == -1.0 {
            return -1.0;
        }
        else if game_state == 0.0 || depth == 0 {
            return 0.0;
        }
    
        if is_maximizing {
            let mut best_eval: f64 = -f64::INFINITY;
            let mark: String = PlyAvatar::X.to_string();
    
            'loop1:
            for i in 0..self.board.len {
                'loop2:
                for j in 0..self.board.len {
                    if self.board.vec[i][j] == PlyAvatar::Empty.to_string() {
                        self.board.vec[i][j] = mark.clone();
    
                        let evaluation: f64 = self.minimax(depth - 1, alpha, beta, false);
    
                        self.board.vec[i][j] = PlyAvatar::Empty.to_string();
                        
                        best_eval = best_eval.max(evaluation);
    
                        alpha = alpha.max(evaluation);
                        if beta <= alpha {
                            break 'loop1;
                        }
                    }
                }
            }
            return best_eval;
        }
        else {
            let mut best_eval: f64 = f64::INFINITY;
            let mark: String = PlyAvatar::O.to_string();
    
            'loop1:
            for i in 0..self.board.len {
                'loop2:
                for j in 0..self.board.len {
                    if self.board.vec[i][j] == PlyAvatar::Empty.to_string() {
                        self.board.vec[i][j] = mark.clone();
    
                        let evaluation: f64 = self.minimax(depth - 1, alpha, beta, true);
                        
                        self.board.vec[i][j] = PlyAvatar::Empty.to_string();
                        
                        best_eval = best_eval.min(evaluation);
    
                        beta = beta.min(evaluation);
                        if beta <= alpha {
                            break 'loop1;
                        }
                    }
                }
            }
            return best_eval;
        }
    }
}

pub unsafe fn start() -> Result<(), JsValue> {
    let run = Closure::wrap(
        Box::new(
            || {
                let game_board_len = 5;
                let mut game = Game::new(game_board_len);

                game.reset_ui();
                let board_marker = Closure::wrap(
                    Box::new(
                        move |event: MouseEvent| {
                            let target = event
                                .target()
                                .expect("Error: target is empty!");
                            let clicked_ele = target
                                .dyn_ref::<HtmlElement>()
                                .expect("Error: target should be a HtmlElement!");
                            let is_clicked_ele_filled = || {
                                return clicked_ele.text_content().unwrap_or_default() != "";
                            };
                            let is_game_end = |game: &mut Game| -> bool { 
                                return game.get_corrtd_win_seq().state == -1.0 || game.get_corrtd_win_seq().state == 1.0 || game.get_corrtd_win_seq().state == 0.0;
                            };
                            let mut is_start = true;

                            log(
                                format!("{:?}", &game.game_win_seqs).to_string()
                            );
                            log(
                                format!("{:?}", &game.board.vec).to_string()
                            );
                            
                            if  (is_clicked_ele_filled() || is_game_end(&mut game)) && !is_start { 
                                if is_start {
                                    is_start = false;
                                }
                                return (); 
                            }
                        
                            let js_normal_checkbox = window()
                                .expect("Error: Couldn't find global DOM window!")
                                .document()
                                .expect("Error: Couldn't find global DOM document!")
                                .query_selector("#normal-checkbox")
                                .expect("Error: Couldn't get element normal-checkbox!")
                                .expect("Error: Element is empty!");
                            let normal_checkbox_ele = js_normal_checkbox
                                .dyn_into::<HtmlInputElement>()
                                .expect("Error: target should be a HtmlElement!");
                        
                            let js_ai_checkbox = window()
                                .expect("Error: Couldn't find global DOM window!")
                                .document()
                                .expect("Error: Couldn't find global DOM document!")
                                .query_selector("#ai-checkbox")
                                .expect("Error: Couldn't get element normal-checkbox!")
                                .expect("Error: Element is empty!");
                            let ai_checkbox_ele = js_ai_checkbox
                                .dyn_into::<HtmlInputElement>()
                                .expect("Error: target should be a HtmlElement!");
                        
                            if normal_checkbox_ele.checked() {
                                let current_ply = game.players.get_by_curr_bool(true);

                                clicked_ele.set_text_content(
                                    Some(current_ply.avatar.to_str())
                                );
                                game.players.pass_to_next_ply();
                        
                                game.update_win_seqs_states();
                                game.update_ui();
                            }
                            else if ai_checkbox_ele.checked() {
                                let current_ply = game.players.get_by_curr_bool(true);

                                clicked_ele.set_text_content(
                                    Some(current_ply.avatar.to_str())
                                );

                                game.players.pass_to_next_ply();
                        
                                game.update_win_seqs_states();
                                game.update_ui();
                        
                                // sleep(Duration::from_millis(200));
                                if is_game_end(&mut game)  { 
                                    return (); 
                                }
                        
                                let mut best_eval: f64 = f64::INFINITY;
                                let mut grid_to_mark: Option<Element> = None;
                        
                                for i in 0..game.board.len {
                                    for j in 0..game.board.len {
                                        if game.board.vec[i][j] == PlyAvatar::Empty.to_string() {
                                            game.board.vec[i][j] = PlyAvatar::O.to_string();
                        
                                            let evaluation = game.minimax(3, -f64::INFINITY, f64::INFINITY, true);
                        
                                            game.board.vec[i][j] = PlyAvatar::Empty.to_string();
                        
                                            if evaluation < best_eval {
                                                best_eval = evaluation;
                                                grid_to_mark = Some(
                                                    Game::get_ui_grid(game.board.len, i, Some(j))
                                                );
                                            }
                                        }
                                    }
                                }

                                let current_ply = game.players.get_by_curr_bool(true);

                                grid_to_mark
                                    .expect("Error: grid_to_mark is empty!")
                                    .set_text_content(
                                        Some(current_ply.avatar.to_str())
                                    );
                        
                                game.players.pass_to_next_ply();
                        
                                game.update_win_seqs_states();
                                game.update_ui();
                            }
                        }
                    ) as Box<dyn FnMut(MouseEvent)>
                );
            
                let grid_item_len: usize =  window()
                    .expect("Error: Couldn't find global DOM window!")
                    .document()
                    .expect("Error: Couldn't find global DOM document!")
                    .query_selector_all(".grid-item")
                    .expect("Error: Cannot get NodeList for 'grid-item'!")
                    .length() as usize;
        
                for i in 1..=grid_item_len {
                    Game::get_ui_grid(game_board_len, i, None)
                        .add_event_listener_with_callback("click", board_marker.as_ref().unchecked_ref())
                        .expect("Error: Couldn't attach callback to grid!")
                }
        
                board_marker.forget();
            }
        ) as Box<dyn FnMut()>
    );

    let js_normal_checkbox = window()
        .expect("Error: Couldn't find global DOM window!")
        .document()
        .expect("Error: Couldn't find global DOM document!")
        .query_selector("#normal-checkbox")
        .expect("Error: Couldn't get element normal-checkbox!")
        .expect("Error: Element is empty!");
    let normal_checkbox_ele = js_normal_checkbox
        .dyn_into::<HtmlInputElement>()
        .expect("Error: target should be a HtmlElement!");

    normal_checkbox_ele
        .add_event_listener_with_callback("input", run.as_ref().unchecked_ref())
        .expect("Error: Couldn't attach callback to checkbox!");
        
        
    let js_ai_checkbox = window()
        .expect("Error: Couldn't find global DOM window!")
        .document()
        .expect("Error: Couldn't find global DOM document!")
        .query_selector("#ai-checkbox")
        .expect("Error: Couldn't get element normal-checkbox!")
        .expect("Error: Element is empty!");
    let ai_checkbox_ele = js_ai_checkbox
        .dyn_into::<HtmlInputElement>()
        .expect("Error: target should be a HtmlElement!");

    ai_checkbox_ele
        .add_event_listener_with_callback("input", run.as_ref().unchecked_ref())
        .expect("Error: Couldn't attach callback to checkbox!");

    run.forget();
    return Ok(());
}