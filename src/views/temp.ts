const record = {
  id: 21,
  student_ID: "0",
  student_name: "TA",
  last_submit_time: null,
  puzzle_amount: 3,
  passed_puzzle_amount: 0,
  puzzle_results: {
    puzzle1_status: false,
    "puzzle1-1-1": false,
    "puzzle1-1-2": false,
    "puzzle1-1-3": false,
    "puzzle1-1-4": false,
    "puzzle1-2-1": false,
    "puzzle1-2-2": false,
    puzzle2_status: false,
    "puzzle2-1-1": false,
    "puzzle2-1-2": false,
    "puzzle2-1-3": false,
    "puzzle2-1-4": false,
    "puzzle2-2-1": false,
    "puzzle2-2-2": false,
    puzzle3_status: false,
    "puzzle3-1-1": false,
    "puzzle3-1-2": false,
    "puzzle3-1-3": false,
    "puzzle3-1-4": false,
    "puzzle3-2-1": false,
    "puzzle3-2-2": false,
  },
};

let lastScores = 0;
const userData = record.puzzle_results;

for (const key in userData) {
