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
            /*
            let invite = new Discord.Invite()
            console.log(invite)
            */
        }
    },
    {
        cmd: "help",
        help: "Listaa botin komennot",
        execute: (command, channel) => {
            let msgToSend = "Käytössä olevat komennot:\n\n"
            cmd_list.map(command => {
                msgToSend += `${app.tikoBot.prefix}${command.cmd} - ${command.help} \n`
            })
            channel.sendMessage(msgToSend)
        }
    },
    {
        cmd: "src",
        help: "Lähdekoodi",
        execute: (command, channel) => {
            let msgToSend = "https://github.com/jaaniles/tikobot"
            channel.sendMessage(msgToSend)
        }
    },
    {
        cmd: "wire",
        help: "Wireen ruokalistat. Käyttö: !wire kotiruoka || kasvislounas || kevytkeittolounas || erikoisannos || jälkiruoka :::: Protip: toimii myös esim. !wire koti",
        menuUrl: "http://www.amica.fi/api/restaurant/menu/week?language=fi&restaurantPageId=7925&weekDate=",
        dateFormat: "YYYY-MM-DD",
        cache: {
            content: null,
            expires: null
        },
        execute: function (command, channel) {
            const now = Math.floor(Date.now() / 1000)
            // No second parameter in command, help user 
            if (!command[1]){ 
                channel.sendMessage(this.help) 
                return
            }
            if (now < this.cache.expires){
                this.parseMenu(this.cache.content, command, channel)
                return
            }

            let date;
            let dayName = moment().format("dddd")

            /* If saturday / sunday, get next week */
            if (dayName === "Saturday" || dayName === "Sunday"){ 
                date = moment().add(1, 'weeks').startOf('isoWeek').format(this.dateFormat)
            }
            else { date = moment().format(this.dateFormat) }
            
            const menuUrl = `${this.menuUrl}${date}`
            axios.get(menuUrl)
            .then(response => {
                const menu = response.data
                this.cache.content = menu
                this.cache.expires = Math.floor(Date.now() / 1000) + 86400
                this.parseMenu(menu, command, channel)
            })
        },
        parseMenu: (menu, command, channel) => {
            let msgToSend = "";
            let cmdMealType = command[1].toLowerCase()
            const parsedMenu = menu.LunchMenus.map(item => {
                return {
                    day: `${item.DayOfWeek} ${item.Date}`,
                    menu: item.SetMenus
                } 
            })
            parsedMenu.map(dayMenu => {
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
        }
    },
    {
        cmd: "louhi",
        help: "Louhen ruokalista",
        menuUrl: "http://mehtimakiravintolat.fi/ravintola-louhi/",
        cache: {
            content: [],
            expires: null
        },
        execute: function(command, channel){
            const now = Math.floor(Date.now() / 1000)
            if (now < this.cache.expires){
                this.cache.content.map(c => {
                    channel.sendMessage(c)
                })
                return
            }
            var msgToSend = ""
            rp(this.menuUrl).then(htmlString => {
                let $ = cheerio.load(htmlString)
                $("#content p, #content strong").each((i, el) => {
                    let txt = el.children[0].data
                    // Make sure message doesn't get too long
                    if (txt && (msgToSend.length + txt.length) > 1800){
                        this.cache.content.push(msgToSend)
                        channel.sendMessage(msgToSend)
                        msgToSend = ""
                    }
                    if (txt){ 
                        msgToSend += `${txt}\n`
                    }
                })
                this.cache.content.push(msgToSend)
                this.cache.expires = Math.floor(Date.now() / 1000) + 86400
                channel.sendMessage(msgToSend).catch(e => { console.log (e)})
            })
        }
    }
]

exports.cmd_list = cmd_list