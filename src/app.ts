console.log("[APP]: Initializing Hellion Warden...");
import * as winston from 'winston';
import { ArgumentParser } from 'argparse';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve as pathResolve } from 'path';

interface HellionWardenArgs {
   datadir: string
}

interface HellionWardenConfig {
   prefix: string,
   token: string,
   console: boolean,
   logfile: string
}

console.log("[APP]: Parsing command line...");
const argparser = new ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('datadir', {
   type: 'str',
   help: 'Set a directory to be used to storage and load the configuration file.'
});

let args: HellionWardenArgs = argparser.parse_args();
let datapath = pathResolve(args.datadir);

console.log("[APP]: Loading...");
if (!existsSync(datapath))
{
   mkdirSync(datapath);
   console.warn("[APP]: Creating data directory...");
}

let configpath = pathResolve(datapath, "config.json");
if (!existsSync(configpath))
{
   console.error("[APP]: Configuration file don't exists, creating one...");

   writeFileSync(configpath, JSON.stringify({
      prefix: 'h!',
      token: '',
      console: true,
      file: null
   }, null, 4));

   console.log(`[APP]: Edit '${configpath}' before running Hellion Warden again.`);
   process.exit(1);
}
else
{
   const CONFIG: HellionWardenConfig = require(configpath);

}