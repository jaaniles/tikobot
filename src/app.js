var Discord = require("discord.js");
var client = new Discord.Client();
var axios = require('axios')
var moment = require('moment')

var cfg      = require('./cfg.js')
var commands = require('./commands.js')

var tikoBot = {
    prefix: "!",
    servers: []
}

client.on("message", msg => {
    var command = isCommand(msg)
    if (command) {
        switch (command[0]) {
            case "!wire":
                commands.cmd_wire.execute(command, msg.channel)
                break
            case "!louhi":
                commands.cmd_louhi.execute(command, msg.channel)
                break
            case "!jaani":
            case "!help":
                commands.cmd_help.execute(command, msg.channel)
                break
            case "!src":
                commands.cmd_src.execute(command, msg.channel)
                break
        }
    }
});

client.on('ready', () => {
  console.log('Ready for fun!');
});

client.on("disconnected", () => {
    console.log("Disconnected")
})

/* Validates commands + returns it splitted*/ 
function isCommand(msg){
    if (msg.author.bot) return
    return msg.content.startsWith(tikoBot.prefix) ? msg.content.split(" ") : null
}

client.login(cfg.botToken);