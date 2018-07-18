import * as Discord from "discord.js";
import * as express from "express";
import * as http from "http";
import * as applicationinsights from "applicationinsights";

const idiotRoleName = "idiots";
// https://en.wikipedia.org/wiki/List_of_multiplayer_online_battle_arena_games
// Last updated 17 JUL 2018
const idiotGameNames = [
    'Defense of the Ancients',
    'Minions',
    'Demigod',
    'League of Legends',
    'Avalon Heroes',
    'Heroes of Newerth',
    'Monday Night Combat',
    'Realm of the Titans',
    'Bloodline Champions',
    'Rise of Immortals: Battle for Graxia',
    'Awesomenauts',
    'Guardians of Middle-Earth',
    'Super Monday Night Combat',
    'Warharmmer Online: Wrath of Heroes',
    'DOTA 2', 
    'Panzar',
    'Adventure Time: Battle Party',
    'Dawngate',
    'Fates Forever',
    'Prime World',
    'Vainglory',
    'SMITE',
    'Heroes of the Storm', 
    'Infinite Crisis',
    'Sins of a Dark Age',
    'Strife',
    'Arena of Valor',
    'Warhammer 40,000: Dark Nexus Arena',
    'Mobile Legends',
    'Battlerite',
    'Gigantic',
    'Master X Master',
    'Paragon',
    'AirMech',
    'Arena of Fate'
];

applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectConsole(true)
    .start();

const ai = applicationinsights.defaultClient;

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
                        ai.trackEvent({name: "idiot", properties: { name: member.user.username }});
                    } catch (e) {
                        console.error(e);
                        ai.trackException({exception: new Error(e)});
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
                    try {
                        await member.removeRole(r[0]);
                    } catch (e) {
                        ai.trackException({exception: new Error("Error trying to remove idiot: " + e)});
                    }
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
                    var game = member.user.presence.game.name;
                    if (!game) { game = "--"; }
                    if (member.user.presence.game != undefined && idiotGameNames.indexOf(member.user.presence.game.name) >= 0) {
                        try {
                            console.log('[IDIOT] ' + member.user.username + ' (' + game + ')');
                            ai.trackEvent({name: "idiot", properties: { name: member.user.username } });
                            member.addRole(r[0]);
                        } catch (e) {
                            console.error(e);
                            ai.trackException({exception: new Error("Error trying to add idiot: " + e)});
                        }
                    } else {
                        try {
                            console.log('[ok] ' + member.user.username + ' (' + game + ')');
                            member.removeRole(r[1]);
                        } catch (e) {
                            console.error(e);
                            ai.trackException({exception: new Error("Error trying to remove idiot: " + e)});
                        }
                    }
                }
            }
        }
    }
});

bot.on("presenceUpdate", (oldMember, newMember) => {
    let gameName: string = "--";
    if (newMember.presence.game != undefined) {
        gameName = newMember.presence.game.name;
    }

    if (newMember.presence.game == undefined) {
        console.log('[ok] ' + newMember.user.username + ' (' + gameName + ')');
        removeFromidiots(newMember.user.id);
    } else {
        if (idiotGameNames.indexOf(newMember.presence.game.name) >= 0) {
            console.log('[IDIOT] ' + newMember.user.username + ' (' + gameName + ')');
            addToIdiots(newMember.user.id);
        } else {
            console.log('[ok] ' + newMember.user.username + ' (' + gameName + ')');
            removeFromidiots(newMember.user.id);
        }
    }
});

bot.login(process.env.DISCORD_KEY)
.then(() => {
    console.log("login success");
})
.catch(reason => {
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