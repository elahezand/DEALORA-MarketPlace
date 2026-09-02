
const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? (
  process.env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug
);

function timestamp() {
  return new Date().toISOString();
}

function log(level, ...args) {
  if (LEVELS[level] > currentLevel) return;

  const line = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(line, ...args);
  } else if (level === "warn") {
    console.warn(line, ...args);
  } else {
    console.log(line, ...args);
  }
}

const logger = {
  error: (...args) => log("error", ...args),
  warn: (...args) => log("warn", ...args),
  info: (...args) => log("info", ...args),
  http: (...args) => log("http", ...args),
  debug: (...args) => log("debug", ...args),
};

module.exports = logger;
