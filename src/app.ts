console.log("[MAIN]: Initializing...");
import { ArgumentParser } from 'argparse';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { HellionWarden } from './index';

interface HellionWardenArgs
{
   datadir: string;
}

export interface PackageMeta
{
   name: string;
   version: string;
}

export interface HellionWardenConfig
{
   prefix: string;
   token: string;
   console: boolean;
   logfile: string;
}

const PACKAGE: PackageMeta = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

console.log("[MAIN]: Hellion Warden version: " + PACKAGE.version);

console.log("[MAIN]: Parsing command line...");
const argparser = new ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('datadir', {
   type: 'str',
   help: 'Set a directory to be used to storage and load the configuration file.'
});

let args: HellionWardenArgs = argparser.parse_args();

console.log("[MAIN]: Loading...");

let datapath = resolve(args.datadir);

if (!existsSync(datapath))
{
   mkdirSync(datapath);
   console.warn("[MAIN]: Creating data directory...");
}

let configpath = resolve(datapath, "config.json");

if (!existsSync(configpath))
{
   console.warn("[MAIN]: Configuration file don't exists, creating one...");

   writeFileSync(configpath, JSON.stringify({
      prefix: 'h!',
      token: ''
   }, null, 4));

   console.warn(`[MAIN]: Edit '${configpath}' before running Hellion Warden again.`);
   process.exit(1);
}
else
{
   const CONFIG: HellionWardenConfig = JSON.parse(readFileSync(configpath, 'utf-8'));

   const DiscordBot = new HellionWarden(PACKAGE, CONFIG);
   DiscordBot.login();
}