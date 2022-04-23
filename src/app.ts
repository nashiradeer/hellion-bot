console.log("Initializing...");
import { ArgumentParser } from 'argparse';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { HellionWardenInformation, discord } from '.';

interface HellionWardenArgs
{
   datadir: string;
}

export interface HellionWardenConfig
{
   prefix: string;
   token: string;
   console: boolean;
   logfile: string;
}

const argparser = new ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('datadir', {
   type: 'str',
   help: 'Set a directory to be used to storage and load the configuration file.'
});

let args: HellionWardenArgs = argparser.parse_args();

let datapath = resolve(args.datadir);

if (!existsSync(datapath))
{
   mkdirSync(datapath);
}

let configpath = resolve(datapath, "config.json");

if (!existsSync(configpath))
{
   writeFileSync(configpath, JSON.stringify({
      prefix: 'h!',
      token: ''
   }, null, 4));

   process.exit(1);
}
else
{
   const CONFIG: HellionWardenConfig = JSON.parse(readFileSync(configpath, 'utf-8'));

   const DiscordBot = new discord.HellionWarden(CONFIG.token, CONFIG.token);

   DiscordBot.once('ready', () => {
      DiscordBot.login();
   });

   DiscordBot.on('error', (err) => {
      process.exit(1);
   });
}