const winston = require("winston");
require("winston-daily-rotate-file");

// Format log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Transportasi untuk menyimpan log ke file dengan rotasi harian
const fileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
});

// Transportasi untuk error khusus
const errorTransport = new winston.transports.File({
  filename: "logs/error.log",
  level: "error",
});

// Logger utama
const logger = winston.createLogger({
  level: "info", // Level default
  format: logFormat,
  transports: [
    new winston.transports.Console({ level: "debug" }), // Debug hanya muncul di console
    fileTransport,
    errorTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

module.exports = logger;
