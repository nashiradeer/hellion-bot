#!/usr/bin/env node

import { Hellion } from './discord';
import { createLogger, format, transports } from 'winston';

console.log("[init] Initializing, please wait...");


const args = {
   token: process.env.HELLION_TOKEN,
   verbose: process.env.HELLION_VERBOSE,
   successColor: process.env.HELLION_SUCCESS_COLOR,
   infoColor: process.env.HELLION_INFO_COLOR,
   failColor: process.env.HELLION_FAIL_COLOR,
   iconUrl: process.env.HELLION_ICON_URL,
   debug: process.env.HELLION_DEBUG,
   localeDir: process.env.HELLION_LOCALES
}

const logger = createLogger({
   level: args.verbose,
   transports: [
      new transports.Console({
         format: format.combine(
            format.colorize(),
            format.splat(),
            format.simple()
         )
      })
   ]
});

logger.debug("[main] Checking if Discord Token isn't null...");
if (!args.token) {
   logger.error("[main] HELLION_TOKEN environment variable is null!");
   process.exit(1);
}

logger.debug("[main] Initializing Hellion instance...");
const DiscordBot = new Hellion({
   intents: Hellion.REQUIRED_INTENTS,
   successColor: (/^[a-f0-9]{1,6}$/gi.test(args.successColor ?? '')) ? args.successColor : null,
   failColor: (/^[a-f0-9]{1,6}$/gi.test(args.failColor ?? '')) ? args.failColor : null,
   infoColor: (/^[a-f0-9]{1,6}$/gi.test(args.infoColor ?? '')) ? args.infoColor : null,
   iconUrl: args.iconUrl || null,
   debug: args.debug === "on" || args.debug === "true",
   localeDir: args.localeDir
});

// Discord logger
const discordLogger = logger.child({});

DiscordBot.once('ready', (username: string) => {
   discordLogger.info(`[discord] Hellion is ready and connected to: ${username}`);
});

DiscordBot.on('debug', (message: string, ...meta) => {
   discordLogger.debug(`[discord] ${message}`, ...meta);
});

DiscordBot.on('info', (message: string, ...meta) => {
   discordLogger.debug(`[discord] ${message}`, ...meta);
});

DiscordBot.on('error', (message: string, ...meta) => {
   discordLogger.error(`[discord] ${message}`, ...meta);
   process.exit(1);
});

DiscordBot.start(args.token).catch((err) => {
   discordLogger.error("[discord] Can't login in Discord.", err);
   process.exit(1);
});

// Handler logger
const handlerLogger = logger.child({});

DiscordBot.handler.on('debug', (message: string, ...meta) => {
   handlerLogger.debug(`[handler] ${message}`, ...meta);
});

DiscordBot.handler.on('info', (message: string, ...meta) => {
   handlerLogger.info(`[handler] ${message}`, ...meta);
});

DiscordBot.handler.on('warn', (message: string, ...meta) => {
   handlerLogger.warn(`[handler] ${message}`, ...meta);
});

DiscordBot.handler.on('error', (message: string, ...meta) => {
   handlerLogger.error(`[handler] ${message}`, ...meta);
});