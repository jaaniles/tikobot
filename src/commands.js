var moment = require('moment')
var axios = require('axios')
var cheerio = require('cheerio')
var rp = require('request-promise')

const cmd_help = {
    execute: (command, channel) => {
        var msgToSend = "Käytössä olevat komennot: \n !wire \n !louhi \n !help"
        channel.sendMessage(msgToSend)
    }
}

const cmd_wire = {
    help: "ex. !wire <kotiruoka> || kasvislounas || kevytkeittolounas || erikoisannos || jälkiruoka",
    menuUrl: "http://www.amica.fi/api/restaurant/menu/week?language=fi&restaurantPageId=7925&weekDate=",
    dateFormat: "YYYY-MM-DD",
    execute: function (command, channel) {
        if (!command[1]){ 
            channel.sendMessage(this.help) 
            return
        }
        var msgToSend = "";
        var date;
        var dayName = moment().format("dddd")
        var cmdMealType = command[1].toLowerCase()

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
                msgToSend += `\n-----${dayMenu.day}-----\n`
                dayMenu.menu.forEach(mealType => {
                    var mType = mealType.Name.toLowerCase()
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
}

const cmd_louhi = {
    help: "Louhen ruokalista",
    menuUrl: "http://mehtimakiravintolat.fi/ravintola-louhi/",
    execute: function(command, channel){
        var msgToSend = ""
        rp(this.menuUrl).then(htmlString => {
            let $ = cheerio.load(htmlString)
            $("#content p, #content strong").each((i, el) => {
                var txt = el.children[0].data
                if (txt){ msgToSend += `${txt}\n`}
            })
            channel.sendMessage(msgToSend)
        })
    }
}

exports.cmd_wire = cmd_wire
exports.cmd_louhi = cmd_louhi
exports.cmd_help = cmd_help