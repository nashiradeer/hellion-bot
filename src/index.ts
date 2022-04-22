import * as winston from 'winston';
import * as Discord from 'discord.js';
import * as argparse from 'argparse';

const argparser = new argparse.ArgumentParser({
   description: 'Hellion Warden is a Discord Music Bot developed by Nashira Deer'
});

argparser.add_argument('-p', '--prefix', {
   metavar: 'PREFIX',
   type: 'string',
   help: 'Override the default bot prefix',
   default: 'h!'
});

argparser.add_argument('--logfile', {
   metavar: 'FILE',
   type: 'string',
   help: 'Create and add a file to the logger'
});

argparser.add_argument('--noconsole', {
