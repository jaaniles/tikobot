const moment = require("moment");
const axios = require("axios");
const cheerio = require("cheerio");
const rp = require("request-promise");
const Discord = require("discord.js");
const mysql = require("mysql");
const app = require("./app.js");
const cfg = require('./cfg.js')

const connection = mysql.createConnection(cfg.database);

connection.connect(err => {
  if (err) throw err;
  console.log("Connected to MYSQL!");
});

const cmd_list = [
  {
    cmd: "help",
    help: "Listaa botin komennot",
    execute: (command, channel) => {
      let msgToSend = "Käytössä olevat komennot:\n\n";
      cmd_list.map(command => {
        msgToSend += `${app.tikoBot.prefix}${command.cmd} - ${command.help} \n`;
      });
      channel.sendMessage(msgToSend);
    }
  },
  {
    cmd: "role",
    help: "Käyttö: !role [PUBG]. Sallitut roolit: PUBG, CSGO, Overwatch",
    execute: (command, channel) => {
      const allowedRoles = ["pubg", "csgo", "overwatch"]
      const roleToAdd = command.params[1]

      if (!roleToAdd.toLowerCase() || allowedRoles.indexOf(roleToAdd.toLowerCase()) === -1) {
        channel.sendMessage(`Käyttö: !role [PUBG]. Sallitut roolit: PUBG, CSGO, Overwatch`);
        return
      }

      const role = command.guild.roles.find(role => role.name.toLowerCase() === roleToAdd.toLowerCase())
     
      const roles = command.member.roles.map(role => role.id)
      if (roles.indexOf(role.id) === -1) {
        command.member.addRole(role.id)
        channel.sendMessage(`Rooli ${roleToAdd} annettu käyttäjälle ${command.author}`)
      } else {
        command.member.removeRole(role.id)
        channel.sendMessage(`Rooli ${roleToAdd} poistettu käyttäjältä ${command.author}`)
      }
    }
  },
  {
    cmd: "whois",
    help:
      "Kertoo kuka kukin on. Käyttö: !whois nick|etunimi|sukunimi. ex. !whois Pekka, !whois darkAngel92",
    execute: (command, channel) => {
      const params = [command.params[1], command.params[1], command.params[1]]; // command[1] has the nick we are searching for
      const sql =
        "SELECT * FROM people WHERE nick = ? or firstName = ? or lastName = ?";
      connection.query(sql, params, (err, result) => {
        if (err) throw err;

        if (result.length <= 0) {
          channel.sendMessage("Tuon nimistä nyyberiä ei löytynyt");
        }

        result.map(res => {
          channel.sendMessage(
            `${res.nick}: ${res.firstName} ${res.lastName} - ${res.year}`
          );
        });
      });
    }
  },
  {
    cmd: "me",
    help:
      "Käyttö: !me etunimi sukunimi aloitusvuosi. ex. !me Testi Testaaja 2016",
    isValidCommand: params => {
      if (params.length !== 4) {
        return false;
      }
      const firstName = params[1];
      const lastName = params[2];
      const year = parseInt(params[3]);

      if (typeof year !== "number") {
        return false;
      }
      if (!firstName || !lastName || !year) {
        return false;
      }

      return true;
    },
    execute: function(command, channel) {
      if (!this.isValidCommand(command.params)) {
        channel.sendMessage(this.help);
        return;
      }

      if (command.params.length <= 1) {
        channel.sendMessage(this.help);
        return;
      }

      const params = [
        command.author,
        command.params[1],
        command.params[2],
        command.params[3]
      ];
      
      const sql =
        "INSERT INTO people (nick, firstName, lastName, year) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE firstName = VALUES(firstName), lastName = VALUES(lastName), year = VALUES(year)";
      connection.query(sql, params, (err, result) => {
        if (err) throw err;
        channel.sendMessage("Lisätty.");
      });
    }
  },
  {
    cmd: "src",
    help: "Lähdekoodi",
    execute: (command, channel) => {
      const msgToSend = "https://github.com/jaaniles/tikobot";
      channel.sendMessage(msgToSend);
    }
  },
  {
    cmd: "wire",
    help:
      "Wireen ruokalistat. Käyttö: !wire kotiruoka || kasvislounas || kevytkeittolounas || erikoisannos || jälkiruoka :::: Protip: toimii myös esim. !wire koti",
    menuUrl:
      "http://www.amica.fi/api/restaurant/menu/week?language=fi&restaurantPageId=7925&weekDate=",
    dateFormat: "YYYY-MM-DD",
    cache: {
      content: null,
      expires: null
    },
    execute: function(command, channel) {
      const now = Math.floor(Date.now() / 1000);
      // No second parameter in command, help user
      if (!command.params[1]) {
        channel.sendMessage(this.help);
        return;
      }
      // Use caché instead
      if (now < this.cache.expires) {
        this.parseMenu(this.cache.content, command.params, channel);
        return;
      }

      let date;
      let dayName = moment().format("dddd");

      /* If saturday / sunday, get next week */
      if (dayName === "Saturday" || dayName === "Sunday") {
        date = moment()
          .add(1, "weeks")
          .startOf("isoWeek")
          .format(this.dateFormat);
      } else {
        date = moment().format(this.dateFormat);
      }

      const menuUrl = `${this.menuUrl}${date}`;
      axios.get(menuUrl).then(response => {
        const menu = response.data;
        this.cache.content = menu;
        this.cache.expires = Math.floor(Date.now() / 1000) + 86400;
        this.parseMenu(menu, command.params, channel);
      });
    },
    parseMenu: (menu, command, channel) => {
      let msgToSend = "";
      const cmdMealType = command[1].toLowerCase();
      const parsedMenu = menu.LunchMenus.map(item => {
        return {
          day: `${item.DayOfWeek} ${item.Date}`,
          menu: item.SetMenus
        };
      });
      parsedMenu.map(dayMenu => {
        // Don't include saturdays / sundays (no service then)
        if (
          !dayMenu.day.includes("Lauantai") &&
          !dayMenu.day.includes("Sunnuntai")
        ) {
          msgToSend += `\n-----${dayMenu.day}-----\n`;
        }
        dayMenu.menu.forEach(mealType => {
          const mType = mealType.Name.toLowerCase();
          if (mType === cmdMealType || mType.includes(cmdMealType)) {
            mealType.Meals.forEach(meal => {
              msgToSend += `\n- ${meal.Name} \n`;
            });
          }
        });
      });
      channel.sendMessage(msgToSend);
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
    execute: function(command, channel) {
      const now = Math.floor(Date.now() / 1000);
      if (now < this.cache.expires) {
        this.cache.content.map(c => {
          channel.sendMessage(c);
        });
        return;
      }
      var msgToSend = "";
      rp(this.menuUrl).then(htmlString => {
        const $ = cheerio.load(htmlString);
        $("#content p, #content strong").each((i, el) => {
          const txt = el.children[0].data;
          // Make sure message doesn't get too long
          if (txt && msgToSend.length + txt.length > 1800) {
            this.cache.content.push(msgToSend);
            channel.sendMessage(msgToSend);
            msgToSend = "";
          }
          if (txt) {
            msgToSend += `${txt}\n`;
          }
        });
        this.cache.content.push(msgToSend);
        this.cache.expires = Math.floor(Date.now() / 1000) + 86400;
        channel.sendMessage(msgToSend).catch(e => {
          console.log(e);
        });
      });
    }
  }
];

exports.cmd_list = cmd_list;
