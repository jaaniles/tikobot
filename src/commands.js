const moment = require('moment')
const axios = require('axios')
const cheerio = require('cheerio')
const rp = require('request-promise')
const app = require('./app.js')
const Discord = require("discord.js");

const cmd_list = [
    {
        cmd: "invite",
        help: "Luo kertakutsulinkin",
        execute: function(command, channel){
            let invite = new Discord.Invite()
            console.log(invite)

        }
    },
    {
        cmd: "help",
        help: "Listaa botin komennot",
        execute: (command, channel) => {
            let msgToSend = "Käytössä olevat komennot:\n"
            cmd_list.map(command => {
                msgToSend += `${app.tikoBot.prefix}${command.cmd} - ${command.help} \n`
            })
            channel.sendMessage(msgToSend)
        }
    },
    {
        cmd: "src",
        help: "Tikobotin lähdekoodi",
        execute: (command, channel) => {
            let msgToSend = "https://github.com/jaaniles/tikobot"
            channel.sendMessage(msgToSend)
        }
    },
    {
        cmd: "wire",
        help: "ex. !wire kotiruoka || kasvislounas || kevytkeittolounas || erikoisannos || jälkiruoka",
        menuUrl: "http://www.amica.fi/api/restaurant/menu/week?language=fi&restaurantPageId=7925&weekDate=",
        dateFormat: "YYYY-MM-DD",
        execute: function (command, channel) {
            if (!command[1]){ 
                channel.sendMessage(this.help) 
                return
            }
            let msgToSend = "";
            let date;
            let dayName = moment().format("dddd")
            let cmdMealType = command[1].toLowerCase()

            /* If saturday / sunday, get next week */
            if (dayName === "Saturday" || dayName === "Sunday"){ 
                date = moment().add(1, 'weeks').startOf('isoWeek').format(this.dateFormat)
            }
            else { date = moment().format(this.dateFormat) }

            const menuUrl = `${this.menuUrl}${date}`
            axios.get(menuUrl)
            .then(response => {
                const menu = response.data
                const parsedMenu = menu.LunchMenus.map(item => {
                    return {
                        day: `${item.DayOfWeek} ${item.Date}`,
                        menu: item.SetMenus
                    } 
                })
                parsedMenu.forEach(dayMenu => {
                    // Don't include saturdays / sundays (no service then)
                    if (!dayMenu.day.includes("Lauantai") && !dayMenu.day.includes("Sunnuntai")){
                        msgToSend += `\n-----${dayMenu.day}-----\n`
                    }
                    dayMenu.menu.forEach(mealType => {
                        const mType = mealType.Name.toLowerCase()
                        if (mType === cmdMealType || mType.includes(cmdMealType)){
                            mealType.Meals.forEach(meal => {
                                msgToSend += `\n- ${meal.Name} \n`
                            })
                        }
                    })
                })
                channel.sendMessage(msgToSend)
            })
        }
    },
    {
        cmd: "louhi",
        help: "Louhen ruokalista",
        menuUrl: "http://mehtimakiravintolat.fi/ravintola-louhi/",
        execute: function(command, channel){
            let msgToSend = ""
            rp(this.menuUrl).then(htmlString => {
                let $ = cheerio.load(htmlString)
                $("#content p, #content strong").each((i, el) => {
                    let txt = el.children[0].data
                    if (txt){ msgToSend += `${txt}\n`}
                })
                channel.sendMessage(msgToSend)
            })
        }
    }
]

exports.cmd_list = cmd_list