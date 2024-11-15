// src/logger.ts
import { Logger, ILogObj } from "tslog";

export const log: Logger<ILogObj> = new Logger({
  name: "workflow-function-manifold",
  prettyLogTemplate: "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} [{{name}}] ",
  prettyLogTimeZone: "local"
});

export default log;