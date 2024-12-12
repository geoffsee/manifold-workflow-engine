// src/logger.ts
import { Logger, ILogObj } from "tslog";

const log: Logger<ILogObj> = new Logger({
  name: "manifold-workflow-engine",
  prettyLogTemplate: "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} [{{name}}] ",
  prettyLogTimeZone: "local"
});

export default log;
