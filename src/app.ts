#!/usr/bin/env node

console.log("Initializing...");
import { ArgumentParser } from 'argparse';
import { HellionWardenInformation, discord, logger } from '.';

interface HellionWardenArgs {
   token: string;
   prefix: string;
   botowner: string;
   public: string;
   verbose: logger.HellionLoggerLevel | 'none';
}

const argparser = new ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('--token', {
   type: 'str',
   help: 'A token from the Discord used during login.',
   default: process.env.TOKEN || ''
});

argparser.add_argument('--prefix', {
   type: 'str',
   help: 'Change the bot command prefix.',
   default: process.env.PREFIX || 'h!'
});

argparser.add_argument('--verbose', {
   type: 'str',
   help: 'Set the verbose level of the console logger',
   choices: ['debug', 'info', 'warn', 'error', 'none'],
   default: 'info'
});

argparser.add_argument('--public', {
   type: 'str',
   help: 'Enable the invite command',
   choices: ['yes', 'no'],
   default: process.env.BOT_PUBLIC || 'no'
});

argparser.add_argument('--botowner', {
   type: 'str',
   help: 'Set the bot owner ID.',
   default: process.env.BOT_OWNER || ''
})

argparser.add_argument('-v', '--version', {
   action: 'version',
   version: HellionWardenInformation.VERSION
});

let args: HellionWardenArgs = argparser.parse_args();


if (args.verbose && args.verbose != 'none')
   logger.HellionLogger.addTransporter('console', new logger.transporters.HellionConsoleTransporter(
      new logger.formatters.HellionColorizeFormatter(),
      args.verbose
   ));


const DiscordBot = new discord.HellionWarden(args.token, args.prefix, {
   botpublic: args.public == "yes",
   botowner: args.botowner,
   intents: discord.HellionWarden.REQUIRED_INTENTS
});

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