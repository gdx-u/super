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
    2.5, 2, 2.5,
    2,   3,   2,
    2.5, 2, 2.5
];

let empty_free_advantages = {
    1: 0,
    2: 4,
    3: 3,
    4: 3,
    5: 2,
    6: 2,
    7: 2,
    8: 1,
    9: 1
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

    // Has won?
    for (let [a, b, c] of win_patterns) {
        if (
            win_map[a] == win_map[b] &&
            win_map[b] == win_map[c] &&
            (win_map[c] == O || win_map[c] == X)
        ) {
            if (win_map[a] == X) return 100;
            return -100;
        }
    }

    // Has a win in one move?
    let [xwp, owp, xws, ows] = has_chance(win_map);
    if (free_move) {
        if (player == X) {
            if (xwp) {
                for (let square of xws) {
                    if (has_chance(boards[square])[0]) return 100;
                    advantage += 20;
                }
            }

            advantage -= 40 * ows.length;
        } else {
            if (owp) {
                for (let square of ows) {
                    if (has_chance(boards[square])[1]) return -100;
                    advantage -= 20;
                }
            }

            advantage += 40 * xws.length;
        }
    } else {
        if (player == X) {
            if (xws.includes(intended_board) && has_chance(boards[intended_board])[0]) return 100;
            if (xws.includes(intended_board)) advantage += 20;
            advantage -= 10 * ows.length;
        } else {
            if (ows.includes(intended_board) && has_chance(boards[intended_board])[1]) return -100;
            if (ows.includes(intended_board)) advantage -= 20;
            advantage += 10 * xws.length;
        }
    }

    if (raw) console.log(advantage);

    if (free_move) {
        win_map.forEach((mb, i) => {
            if (mb == 0) {
                let [xmc, omc, xms, oms] = has_chance(boards[i]);
                if (player == X) {
                    for (let win of xms) advantage += 1.5 * tile_powers[i];
                    for (let win of oms) advantage -= 3 * tile_powers[i];
                }

                else if (player == O) {
                    for (let win of oms) advantage -= 1.5 * tile_powers[i];
                    for (let win of xms) advantage += 3 * tile_powers[i];
                }
            }
        });
    } else {
        let mb = intended_board;
        let [xmc, omc, xms, oms] = has_chance(boards[mb]);
        if (player == X) {
            for (let win of xms) advantage += 1.5 * tile_powers[mb];
            for (let win of oms) advantage -= 3 * tile_powers[mb];
        }

        else if (player == O) {
            for (let win of oms) advantage -= 1.5 * tile_powers[mb];
            for (let win of xms) advantage += 3 * tile_powers[mb];
        }
    }

    if (raw) console.log(advantage);

    if (free_move) {
        if (player == X) advantage += 2 * empty_free_advantages[count(win_map, 0)];
        else if (player == O) advantage -= 2 * empty_free_advantages[count(win_map, 0)];
    }

    if (raw) console.log(advantage);

    boards.forEach((board, i) => {
        if (win_map[i] == 0) {
            let [xc, oc, xp, op] = has_chance(board);
            if (player == X) {
                advantage += tile_powers[i] * xp.length / 6;
                advantage -= tile_powers[i] * op.length / 3;
            }
            else if (player == O) {
                advantage -= tile_powers[i] * op.length / 6;
                advantage += tile_powers[i] * xp.length / 3;
            }
        } else {
            if (win_map[i] == X) advantage += 8 * tile_powers[i];
            else if (win_map[i] == O) advantage -= 8 * tile_powers[i];
        }
    });

    if (raw) console.log(advantage);

    let possible = find_possible_moves(boards, intended_board);
    let t = possible.length;
    let n = 0;
    let center = 0;
    for (let option of possible) {
        if (win_map[option % 9] != 0) {
            n++;
            if (option % 9 == 4) center += 1;
        }
    }

    if (raw) console.log(advantage);

    if (player == X) advantage -= ((n + center * 2) * empty_free_advantages[count(win_map, 0)]) / (1.8 * t);
    else if (player == O) advantage += ((n + center * 2) * empty_free_advantages[count(win_map, 0)]) / (1.8 * t);

    if (raw) console.log(advantage);

    if (!free_move) {
        if (player == X) advantage += tile_powers[intended_board] * 0.2;
        else if (player == O) advantage -= tile_powers[intended_board] * 0.2;
    }

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

let MAX_DEPTH = 6;

function recurse(boards, win_map, player, intended_board, depth, alpha, beta) {
    let options = find_possible_moves(boards, intended_board);
    if (depth == MAX_DEPTH || options.length == 0) {
        return [null, analyze(boards, win_map, intended_board, player)];
    }
    alpha = alpha || -Math.Infinity;
    beta = beta || Math.Infinity;
    let best_move;
    let best_score = (player == X) ? -Infinity : Infinity;
    for (let option of options) {
        let [nb, nw, nwinner] = place(boards, win_map, option, player);
        let score;
        if (nwinner) {
            score = (nwinner == X ? 100 : -100) + (player == X ? -depth : depth);
        } else {
            let [_, child_score] = recurse(nb, nw, player == X ? O : X, option % 9, depth + 1, alpha, beta);
            score = child_score;
        }
        if ((player == X && score > best_score) || (player == O && score < best_score)) {
            best_score = score;
            best_move = option;
        }
        if (player == X) alpha = Math.max(alpha, best_score);
        else beta = Math.min(beta, best_score);
        if (beta <= alpha) break;
    }

    if (depth == 1) console.log(best_score);
    return [best_move, best_score];
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
                
                if (typeof(ai_move) == "object" && ai_move !== null) ai_move = ai_move[0];

                if (typeof(ai_move) == 'number') {
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
