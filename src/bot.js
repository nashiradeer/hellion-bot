/**
 * @typedef {Object} BotExtension
 * @property {Map} musicdata
 */

console.log("[CLIENT] Initializing script...");
const fs = require('fs');
const path = require('path');

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [ "GUILD_MESSAGES", "GUILDS", "GUILD_VOICE_STATES", "GUILD_MESSAGE_REACTIONS" ] });

var musicdata = new Map();

console.log("[CLIENT] Loading config...");
if (!fs.existsSync(path.resolve(__dirname, "config.loaded.json")))
    fs.copyFileSync(path.resolve(__dirname, "config.json"), path.resolve(__dirname, "config.loaded.json"));

const CONFIG = require(path.resolve(__dirname, "config.loaded.json"));

var commands = {};

console.log("[CLIENT] Registering commands...");
for (let p of fs.readdirSync(path.resolve(__dirname, "commands"))) {
    let script = require(path.resolve(__dirname, "commands", p));

    for (let name of script.command.names)
    {
        commands[name] = script.run;
        console.log("[CLIENT] Registered command '" + name + "'...");
    }
}

console.log("[CLIENT] Registering events...");

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(CONFIG.prefix)) return;
    if (!message.guild) return;

    let args = message.content.trim().slice(CONFIG.prefix.length).split(' ');
    let command = args.shift().toLowerCase();

    if (!commands[command]) return;

    console.log("[MESSAGE] Executing command '" + command + "'...");
    commands[command](client, message, args, {
        musicdata: musicdata
    });
});

client.on('ready', () => {
    console.log("[CLIENT] Logged in '" + client.user.tag + "'");
});

console.log("[CLIENT] Logging...");
client.login(CONFIG.token);