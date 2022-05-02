#!/bin/node

console.log("Initializing...");
import { ArgumentParser } from 'argparse';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { HellionWardenInformation, discord, logger } from '.';

interface HellionWardenArgs {
   datadir: string;
   verbose: string;
}

export interface HellionWardenConfig {
   prefix: string;
   token: string;
   logfile: string;
   errorfile: string;
}

const argparser = new ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('datadir', {
   type: 'str',
   help: 'Set a directory to be used to storage and load the configuration file.'
});

argparser.add_argument('--verbose', {
   type: 'str',
   help: 'Set the verbose level of the console logger',
   choices: ['debug', 'default', 'none'],
   default: 'default'
});

argparser.add_argument('-v', '--version', {
   action: 'version',
   version: HellionWardenInformation.VERSION
});

let args: HellionWardenArgs = argparser.parse_args();

let datapath = resolve(args.datadir);

if (!existsSync(datapath)) {
   mkdirSync(datapath);
}

let configpath = resolve(datapath, "config.json");

if (!existsSync(configpath)) {
   writeFileSync(configpath, JSON.stringify({
      prefix: 'h!',
      token: '',
      logfile: 'logfile.log',
      errorfile: 'errorfile.log'
   }, null, 4));

   console.warn("Config file doesn't exists, creating one...");
   console.log("Please edit the config file before running Hellion Warden again.");
   process.exit(1);
}
else {
   const CONFIG: HellionWardenConfig = JSON.parse(readFileSync(configpath, 'utf-8'));

   if (args.verbose == 'debug' || args.verbose == 'default')
      logger.HellionLogger.addTransporter('console', new logger.transporters.HellionConsoleTransporter(
         new logger.formatters.HellionColorizeFormatter(),
         (args.verbose == 'debug') ? 'debug' : 'info'
      ));

   if (CONFIG.logfile)
      logger.HellionLogger.addTransporter('logfile', new logger.transporters.HellionFileTransporter(resolve(datapath, CONFIG.logfile), new logger.HellionLoggerFormatter(), 'debug'));

   if (CONFIG.errorfile)
      logger.HellionLogger.addTransporter('errorfile', new logger.transporters.HellionFileTransporter(resolve(datapath, CONFIG.errorfile), new logger.HellionLoggerFormatter(), 'warn'));

   const DiscordBot = new discord.HellionWarden(CONFIG.token, CONFIG.prefix);

   DiscordBot.once('ready', () => {
      logger.HellionLogger.getLogger('Discord').info("Discord bot is ready.");
   });

   DiscordBot.once('logged', () => {
      logger.HellionLogger.getLogger('Discord').info("Discord bot has connected.");
   });

   DiscordBot.on('debug', (type: "debug" | "info" | "warn", message: string) => {
      logger.HellionLogger.getLogger('Discord').log(type, message);
   })

   DiscordBot.on('error', (err: Error) => {
      logger.HellionLogger.getLogger('Discord').error("A error has occoured: ", err);
      process.exit(1);
   });

   DiscordBot.handler.on('ready', () => {
      logger.HellionLogger.getLogger('Command Handler').info("Command handler initialized.");
   });

   DiscordBot.handler.on('debug', (type: "debug" | "info" | "warn", message: string) => {
      logger.HellionLogger.getLogger('Command Handler').log(type, message);
   });

   DiscordBot.handler.on('error', (err: Error) => {
      logger.HellionLogger.getLogger('Command Handler').error("A error has occoured: ", err);
   });

   DiscordBot.handler.on('cmdDebug', (command: string, type: "debug" | "info" | "warn", message: string) => {
      logger.HellionLogger.getLogger(`Command '${command}'`).log(type, message);
   });

   DiscordBot.handler.on('cmdError', (command: string, err: Error) => {
      logger.HellionLogger.getLogger(`Command '${command}'`).error("A error has occoured: ", err);
   });

   DiscordBot.start().catch((err) => {
      logger.HellionLogger.getLogger('Discord').error("A error has occoured: ", err);
   });
}