import { Router, type IRouter } from "express";
import healthRouter from "./health";
import proxyRouter from "./proxy";
import gamesRouter from "./games";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/proxy", proxyRouter);
router.use("/games", gamesRouter);

export default router;
