import * as Discord from "discord.js";
import * as express from "express";
import * as http from "http";

const idiotRoleName = "idiots";
const idiotGameName = "World of Warcraft";

process.setMaxListeners(0);

// Initialize Discord Bot
const bot = new Discord.Client();

async function addToIdiots(userId: string) {
    for (const g of bot.guilds) {
        for (const r of g[1].roles) {
            if (r[1].name == idiotRoleName) {
                const member = g[1].members.find("id", userId);
                if (member != undefined) {
                    try {
                        await member.addRole(r[0]);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    }
}

async function removeFromidiots(userId: string) {
    for (const g of bot.guilds) {
        for (const r of g[1].roles) {
            if (r[1].name == idiotRoleName) {
                const member = g[1].members.find("id", userId);
                if (member != undefined) {
                    await member.removeRole(r[0]);
                }
            }
        }
    }
}

bot.on("ready", () => {
    console.log("I am ready!");
    for (const g of bot.guilds) {
        for (const r of g[1].roles) {
            if (r[1].name == idiotRoleName) {
                for (const m of g[1].members) {
                    const member = m[1];
                    if (member.user.presence.game != undefined && member.user.presence.game.name == idiotGameName) {
                        try {
                        member.addRole(r[0]);
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        try {
                        member.removeRole(r[1]);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        }
    }
});

bot.on("message", message => {
    console.log(message.content);
});
bot.on("presenceUpdate", (oldMember, newMember) => {
    let gameName: string;
    if (newMember.presence.game != undefined) {
        gameName = newMember.presence.game.name;
    }

    console.log("presence update: " + newMember.user.username + " (" + (gameName == undefined ? " -- " : gameName) + ")");

    if (newMember.presence.game == undefined) {
        removeFromidiots(newMember.user.id);
    } else {
        if (newMember.presence.game.name.indexOf(idiotGameName) >= 0) {
            addToIdiots(newMember.user.id);
        } else {
            removeFromidiots(newMember.user.id);
        }
    }
});

bot.login(process.env.DISCORD_KEY).catch(reason => {
    console.error(reason);
});

// set the port of our application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 5000;
const app = express();

// set the view engine to ejs
app.set("view engine", "ejs");

// make express look in the `public` directory for assets (css/js/img)
app.use(express.static(__dirname + "/public"));

// set the home page route
app.get("/", (request, response) => {
    // ejs render automatically looks in the views folder
    response.render("index");
});

app.listen(port, () => {
    // will echo 'Our app is running on http://localhost:5000 when run locally'
    console.log("Our app is running on http://localhost:" + port);
});

 // pings server every 15 minutes to prevent dynos from sleeping
 setInterval(() => {
    http.get("http://morning-stream-21025.herokuapp.com");
  }, 900000);