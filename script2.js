const X = 1;
const O = 2;
const _ = 3;

let boards = Array.from({length: 9});
for (let i = 0; i < 9; i++) {
    boards[i] = Array.from({length: 9}).fill(0);
}

let win_map = Array.from({length: 9}).fill(0);

let winner;

let win_patterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

let tile_powers = [
    3, 2, 3,
    2, 4, 2,
    3, 2, 3
];

let empty_free_advantages = {
    0: 0,
    1: 1,
    2: 6,
    3: 7,
    4: 7,
    5: 6,
    6: 5,
    7: 3,
    8: 2,
    9: 1,
}

function count(array, value) {
    return array.filter(e => e == value).length;
}



function place(boards, win_map, i, player) {
    // let new_ = structuredClone(boards); // Deep copy
    let new_ = JSON.parse(JSON.stringify(boards));
    let board = Math.floor(i / 9);
    let square = i % 9;

    new_[board][square] = player;
    new_win_map = win_map.slice(); // Shallow copy

    sub = new_[board];

    let broken = false;

    for (let [a, b, c] of win_patterns) {
        if (sub[a] == sub[b] && sub[b] == sub[c] && sub[c] == player) {
            new_win_map[board] = player;
            broken = true;
            break;
        }
    }

    if (!broken) {
        if (sub.every(e => Boolean(e))) { // Drawn board
            new_win_map[board] = _;
            // if (!boards.some(sub_ => !sub_.every(e => Boolean(e)))) {
            if (!new_win_map.some(e => !e)) {
                for (let [a, b, c] of win_patterns) {
                    if (
                        0 < new_win_map[a] &&
                        new_win_map[a] == new_win_map[b] &&
                        new_win_map[b] == new_win_map[c] &&
                        new_win_map[c] < _
                    ) return [new_, new_win_map, new_win_map[a]];
                }

                return [new_, new_win_map, _];
            }
        }

        return [new_, new_win_map, null];
    }

    if (sub.every(e => Boolean(e)) && !new_win_map[board]) { // Drawn board
        new_win_map[board] = _;
        // if (!boards.some(sub_ => !sub_.every(e => Boolean(e)))) {
        if (!new_win_map.some(e => !e)) {
            for (let [a, b, c] of win_patterns) {
                if (
                    0 < new_win_map[a] &&
                    new_win_map[a] == new_win_map[b] &&
                    new_win_map[b] == new_win_map[c] &&
                    new_win_map[c] < _
                ) {
                    return [new_, new_win_map, new_win_map[a]];
                }
            }

            return [new_, new_win_map, _];
        }
    }

    for (let [a, b, c] of win_patterns) {
        if (
            new_win_map[a] == new_win_map[b] &&
            new_win_map[b] == new_win_map[c] &&
            new_win_map[c] == player
        ) return [new_, new_win_map, player];
    }

    return [new_, new_win_map, null];
}

function has_chance(board) {
    let X_chance = false;
    let X_tiles = [];
    let O_chance = false;
    let O_tiles = [];

    for (let i = 0; i < 9; i++) {
        if (board[i] == 0) {
            board[i] = X;
            for (let [a, b, c] of win_patterns) {
                if (
                    board[a] == board[b] &&
                    board[b] == board[c] &&
                    board[c] == X
                ) {
                    X_chance = true;
                    X_tiles.push(i)
                    break;
                }
            }
            board[i] = 0;

            board[i] = O;
            for (let [a, b, c] of win_patterns) {
                if (
                    board[a] == board[b] &&
                    board[b] == board[c] &&
                    board[c] == O
                ) {
                    O_chance = true;
                    O_tiles.push(i);
                    break;
                }
            }
            board[i] = 0;
        }
    }

    return [X_chance, O_chance, X_tiles, O_tiles];
}

function analyze(boards, win_map, intended_board, player, raw) {
    raw = raw || false;
    let advantage = 0;
    let free_move = win_map[intended_board] != 0;

    let [XC, OC, XS, OS] = has_chance(win_map);
    if (XC && (free_move || XS.includes(intended_board)) && player == X) advantage += 100;
    else if (OC && (free_move || OS.includes(intended_board)) && player == O) advantage -= 100;
    if (raw) console.log(advantage);
    // Cannot be both as player-exclusive.

    win_map.forEach((board, i) => {
        if (board !== 0) {
            switch (board) {
                case X:
                    advantage += tile_powers[i] * 2.5;
                    break;
                case O:
                    advantage -= tile_powers[i] * 2.5;
                    break;
                case _: break;
            }
        } else {
            let [xc, oc, xs, os] = has_chance(boards[i]);
            if (player == O && xc) advantage += tile_powers[i] * 3;
            if (player == X && oc) advantage -= tile_powers[i] * 3;
        }
    });
    if (raw) console.log(advantage);

    if (free_move) {
        win_map.forEach((board, i) => {
            if (board == 0) {
                let [xc, oc, xs, os] = has_chance(boards[i]);
                if (xc && player == X) advantage += tile_powers[i] * 2;
                else if (oc && player == O) advantage -= tile_powers[i] * 2;
            }
        });
    } else {
        let [xc, oc, xs, os] = has_chance(boards[intended_board]);
        if (xc && player == X) advantage += tile_powers[intended_board] * 2;
        else if (oc && player == O) advantage -= tile_powers[intended_board] * 2;
    }
    if (raw) console.log(advantage);

    if (free_move) {
        if (player == X) advantage += empty_free_advantages[count(win_map, 0)];
        else if (player == O) advantage -= empty_free_advantages[count(win_map, 0)];
    }
    else {
        if (player == X) advantage += tile_powers[intended_board] * 0.4;
        else if (player == O) advantage -= tile_powers[intended_board] * 0.4;       
    }
    if (raw) console.log(advantage);
    
    let possible = find_possible_moves(boards, intended_board);
    let restricted = 0;
    for (let option of possible) {
        if (win_map[option % 9] != 0) {
            // if (player == X) advantage -= 0.1;
            restricted++;
        }
    }
    if (raw) console.log(advantage);

    if (player == X) advantage -= restricted / possible.length * empty_free_advantages[count(win_map, 0)]
    else if (player == O) advantage += restricted / possible.length * empty_free_advantages[count(win_map, 0)]
    if (raw) console.log(advantage);

    return advantage;
}

function find_possible_moves(boards, intended_board) {
    let out = [];
    if (win_map[intended_board] == 0) {
        for (let i = 0; i < 9; i++) {
            if (boards[intended_board][i] == 0) {
                out.push([intended_board * 9 + i]);
            }
        }

        return out;
    }

    for (let i = 0; i < 81; i++) {
        if (win_map[Math.floor(i / 9)] != 0) continue;
        if (boards[Math.floor(i / 9)][i % 9] == 0) out.push(i)
    }

    return out;
}

// WHY THE FUCK DOES THIS NOT WORK

let MAX_DEPTH = 6;

function recurse(boards, win_map, player, intended_board, depth) {
    let options = find_possible_moves(boards, intended_board);
    if (depth == MAX_DEPTH || !options.length) {
        return [null, analyze(boards, win_map, intended_board, player)];
    }

    let new_values = {};

    let best_curr;

    for (let option of options) {
        let [new_boards, new_win_map, new_winner] = place(boards, win_map, option, player);

        // let curr = analyze(new_boards, new_win_map, option % 9, _ - player);
        // if (
            // player == O && curr > Math.min(Object.values(new_values).length ? Object.values(new_values) : [100])
            // || player == X && curr < Math.max(Object.values(new_values).length ? Object.values(new_values) : [-100])
        // ) {
        // if (best_curr !== undefined && (player == O && curr > best_curr || player == X && curr < best_curr)) {
            // console.log(player, curr, new_values);
            // console.log(curr, new_values, Math.min(Object.values(new_values).length ? Object.values(new_values) : [100]));
            // continue;
        // }

        if (new_winner) {
            new_values[option] = new_winner == X ? 100 - depth : new_winner == O ? -100 + depth : 0;
        } else {
            let [__, value] = recurse(new_boards, new_win_map.slice(), _ - player, option % 9, depth + 1);
            // console.log(__, value, depth);
            new_values[option] = value || __;
            // if (best_curr == undefined || player == X && value > best_curr || player == O && value < best_curr) {
            //     best_curr = value;
            // }
        }
    }

    let keys = Object.keys(new_values);
    let best = keys.reduce((a, b) => {
        if (player == X) {
            if (new_values[a] > new_values[b] || (new_values[a] == new_values[b] && Math.random() <= 0.5)) return a;
            return b;
        } else if (player == O) {
            if (new_values[a] < new_values[b] || (new_values[a] == new_values[b] && Math.random() <= 0.5)) return a;
            return b;
        }
    });

    if (depth == 1) console.log(new_values);

    return [best, new_values[best]];
}

function create_boards() {
    let X = 0;
    let x = 0;
    let Y = 0;
    let y = 0;

    const tile_size = 48;
    for (let i = 0; i < 81; i++) {
        let el = document.createElement("div");
        el.className = "square";
        el.id = `${i}`;

        let ex = X * 3 + x;
        let ey = Y * 3 + y;

        el.style.left = `${ex * tile_size}px`;
        el.style.top = `${ey * tile_size}px`;

        el.onmousedown = (e) => {
            play(Number(e.target.id));
        }

        x += 1;
        if (x == 3) {
            y += 1;
            x = 0;
            if (y == 3) {
                let EL = document.createElement("div");
                EL.className = "big-square";
                EL.id = `big${Y * 3 + X}`;
                EL.style.left = `${X * (3 * tile_size + 1)}px`;
                EL.style.top = `${Y * (3 * tile_size + 1)}px`;
                document.body.appendChild(EL);


                y = 0;
                X += 1
                if (X == 3) {
                    X = 0;
                    Y += 1;
                }
            }
        }

        document.body.appendChild(el);
    }
}

function print_board() {
    win_map.forEach((board, i) => {
        let el = document.getElementById(`big${i}`);
        switch (board) {
            case 0: break;
            case X:
                el.style.backgroundColor = "red";
                el.innerText = "X";
                break;
            case O:
                el.style.backgroundColor = "lightblue";
                el.innerText = "O";
                break;
            case _:
                el.style.backgroundColor = "#aaa";
                el.innerText = "/";
                break;
        }
    });

    let allowed_boards = [];
    if (
        intended_board == null ||
        win_map[intended_board] != 0
    ) {
        for (let i = 0; i < 9; i++) {
            if (!win_map[i]) allowed_boards.push(i);
        }
    } else {
        allowed_boards = [intended_board];
    }

    for (let i = 0; i < 9; i++) {
        let el = document.getElementById(`big${i}`);
        if (allowed_boards.includes(i)) el.classList.add("targeted");
        else el.classList.remove("targeted");
    }

    for (let i = 0; i < 81; i++) {
        let el = document.getElementById(String(i));
        el.innerText = " XO"[boards[Math.floor(i / 9)][i % 9]];
        switch (boards[Math.floor(i / 9)][i % 9]) {
            case 0: break;
            case X: 
                el.style.color = "red";
                break;
            case O:
                el.style.color = "lightblue";
                break;
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function play(id) {
    if (turn == X && !winner) {
        if (Math.floor(id / 9) == intended_board || win_map[intended_board] != 0) {
            if (boards[Math.floor(id / 9)][id % 9] == 0) {
                intended_board = id % 9;
                [boards, win_map, winner] = place(boards, win_map, id, X);
                print_board();
                await sleep(100);
                if (winner) {
                    alert(`Winner is ${' XO_'[winner]}!`.replace("Winner is _!", "It was a draw!"));
                    print_board();
                    return;
                }

                turn = O;
                [ai_move, ai_analysis] = recurse(boards, win_map, O, intended_board, 1);
                if (ai_move) {
                    intended_board = ai_move % 9;
                    [boards, win_map, winner] = place(boards, win_map, ai_move, O);
                    if (winner) {
                        alert(`Winner is ${' XO_'[winner]}!`.replace("Winner is _!", "It was a draw!"));
                        print_board();
                        return;
                    }
                } else {
                    winner = 3;
                    alert(`Winner is ${' XO_'[winner]}!`.replace("Winner is _!", "It was a draw!"));
                    print_board();
                    return;
                }
                turn = X;
                print_board();
                document.title = `Super Tic-Tac-Toe (${Math.round(ai_analysis * 100) / 100})`;
            }
        }
    }
}

let turn = X;
let ai_analysis = null;
let ai_move = null;
let intended_board = null;
create_boards();