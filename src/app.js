var Discord = require("discord.js");
var client = new Discord.Client();
var axios = require('axios')
var moment = require('moment')

var cfg      = require('./cfg.js')
var commands = require('./commands.js')

const tikoBot = {
    prefix: "!",
}

client.on("message", msg => {
    let command = isCommand(msg)
    if (command) {
        commands.cmd_list.find(cmd => {
            if (cmd.cmd === command[0]) {cmd.execute(command, msg.channel)}
        })
    }
});

client.on('ready', () => {
  console.log('Ready for fun!');
});

client.on("disconnected", () => {
    console.log("Disconnected")
})

/* Validates commands + returns it splitted without prefix*/ 
function isCommand(msg){
    if (msg.author.bot) return
    return msg.content.startsWith(tikoBot.prefix) ? (msg.content).substring(1).split(" ") : null
}

client.login(cfg.botToken);

exports.tikoBot = tikoBot