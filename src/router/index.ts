import { createMemoryHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import ExecuteCode from "../views/ExecuteCode.vue";
import ScoreBoard from "../views/ScorePage.vue";
import ScoreTable from "../views/ScoreTable.vue";
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/execute",
    name: "ExecuteCode",
    component: ExecuteCode,
  },
  {
    path: "/scoreboard",
    name: "ScoreBoard",
    component: ScoreBoard,
  },
  {
    path: "/scoretable",
    name: "ScoreTable",
    component: ScoreTable,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
