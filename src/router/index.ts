import { createWebHashHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import ExecuteCode from "../views/ExecuteCode.vue";
import ScoreBoard from "../views/ScorePage.vue";
import ScoreTable from "../views/ScoreTable.vue";
import Anticheat from "../views/Anticheat.vue";
import LogViewer from "../views/LogViewer.vue";
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
  {
    path: "/anticheat",
    name: "Anticheat",
    component: Anticheat,
  },
  {
    path: "/logviewer",
    name: "LogViewer",
    component: LogViewer,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
