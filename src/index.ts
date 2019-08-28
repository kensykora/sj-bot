import * as Discord from "discord.js";
import * as express from "express";
import * as http from "http";
import * as applicationinsights from "applicationinsights";
import * as util from "util";

const channelToMonitor = process.env.CHANNEL_ID;
const timeLimitMs = parseInt(process.env.TIME_LIMIT_MS);
const idiotRoleName = "idiots";
const keepMessageReactions = ["✅", "🎷"];
const deletionSchedule: { [id: string]: NodeJS.Timer} = { }; // Map of Discord Message IDs to setTimeout identifiers
// https://en.wikipedia.org/wiki/List_of_multiplayer_online_battle_arena_games
// Last updated 17 JUL 2018
const idiotGameNames = [
    "World of Warcraft Classic"
];

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectConsole(true)
    .start();
}

let ai = applicationinsights.defaultClient;
if (ai == undefined) {
    ai = new applicationinsights.TelemetryClient("--");
}

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
                        console.error("Error trying to remove idiot: " + e);
                        ai.trackException({exception: new Error("Error trying to remove idiot: " + e)});
                    }
                }
            }
        }
    }
}

bot.on("ready", async () => {
    console.log("I am ready!");
    initializeIdiots();
    await initializeDeletions();
});

async function initializeDeletions() {
    for (const c of bot.channels) {
        if (!(c[1] instanceof Discord.TextChannel)) {
            continue;
        }

        const txtChannel = c[1] as Discord.TextChannel;
        if (txtChannel.id != channelToMonitor) {
            continue;
        }

        let last: Discord.Snowflake = undefined;
        do {
            console.log("pass: " + last);
            const limit = 50;
            const messages = last == undefined
                ? await txtChannel.fetchMessages({ limit: limit })
                : await txtChannel.fetchMessages({ before: last, limit: limit });

            for (const m of messages) {
                if (
                    !m[1].attachments.size
                    && !m[1].reactions.some(r => keepMessageReactions.includes(r.emoji.name))) {
                        scheduleOrPerformDeletion(m[1]);
                }
            }

            if (messages.size == limit) {
                last = messages.last().id;
            } else {
                last = undefined;
            }
        } while (last != undefined);
    }
}

function initializeIdiots() {
    for (const g of bot.guilds) {
        for (const r of g[1].roles) {
            if (r[1].name == idiotRoleName) {
                for (const m of g[1].members) {
                    const member = m[1];
                    const game = member.user.presence.game;
                    let gameStr = "--";
                    if (!game) { gameStr = "--"; } else { gameStr = game.name; }
                    if (member.user.presence.game != undefined && idiotGameNames.indexOf(member.user.presence.game.name) >= 0) {
                        try {
                            console.log("[IDIOT] " + member.user.username + " (" + gameStr + ")");
                            ai.trackEvent({name: "idiot", properties: { name: member.user.username } });
                            member.addRole(r[0]);
                        } catch (e) {
                            console.error(e);
                            ai.trackException({exception: new Error("Error trying to add idiot: " + e)});
                        }
                    } else {
                        try {
                            console.log("[ok] " + member.user.username + " (" + gameStr + ")");
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
}

bot.on("presenceUpdate", (oldMember, newMember) => {
    let gameName: string = "--";
    if (newMember.presence.game != undefined) {
        gameName = newMember.presence.game.name;
    }

    if (newMember.presence.game == undefined) {
        console.log("[ok] " + newMember.user.username + " (" + gameName + ")");
        removeFromidiots(newMember.user.id);
    } else {
        if (idiotGameNames.indexOf(newMember.presence.game.name) >= 0) {
            console.log("[IDIOT] " + newMember.user.username + " (" + gameName + ")");
            addToIdiots(newMember.user.id);
        } else {
            console.log("[ok] " + newMember.user.username + " (" + gameName + ")");
            removeFromidiots(newMember.user.id);
        }
    }
});

function scheduleOrPerformDeletion(msg: Discord.Message) {
    const now = new Date().getTime();
    const deleteInMs = (msg.createdTimestamp + timeLimitMs) - now;
    if (deleteInMs < 0) {
        deleteMessage(msg);
    } else {
        console.log("[SCHEDULE] scheduling deletion of message (" + msg.author.username + ") " + msg.id + " in " + deleteInMs + "ms");
        deletionSchedule[msg.id] =
            setTimeout(async () => {
                deleteMessage(msg);
            }, deleteInMs);
        if (process.env.TEST_RUN) {
            msg.react("⏳")
                .catch(err => {
                    console.error("error applying ⏳ reaction: " + err);
                    ai.trackException({exception: new Error("error applying ⏳ reaction: " + err)});
                });
        } else {
            msg.clearReactions()
                .catch(err => {
                    console.error("error clearing reactions: " + err);
                    ai.trackException({exception: new Error("error clearing reactions:" + err)});
                });
        }
    }
}

async function deleteMessage(msg: Discord.Message) {
    try {
        const doubleCheck = await msg.channel.fetchMessage(msg.id);
        if (doubleCheck.reactions.some(r => keepMessageReactions.includes(r.emoji.name))) {
            console.log("[msg ignore] message was scheduled for deletion, but contained the keep reaction. Keeping it. (" + msg.id + ")");
            ai.trackEvent({name: "skipped"});
            return;
        }
    } catch (err) {
        console.error("error double checking message, skipping - " + err);
        ai.trackException({exception: new Error("error double checking message, skipping - " + err)});
        return;
    }

    if (!process.env.TEST_RUN) {
        msg.delete()
            .then(() => {
                console.log("[DELETED] removed message  (" + msg.author.username + ") " + msg.id);
                ai.trackEvent({name: "deleted"});
            })
            .catch(err => {
                console.error("[ERROR] - Error deleting message: " + err);
                ai.trackException({exception: new Error("[ERROR] - Error deleting message: " + err)});
            });
    } else {
        msg.react("💣")
            .catch(err => {
                console.error("error applying 💣 reaction: " + err);
                ai.trackException({exception: new Error("error applying 💣 reaction: " + err)});
            });
        console.log("[DELETED - TEST RUN] removed message  (" + msg.author.username + ") " + msg.id);
    }
}

bot.on("message", msg => {
    if (msg.channel.id != channelToMonitor) {
        console.log("[msg ignore] Wrong Channel (" + (msg.channel as Discord.TextChannel).id + ")");
        return;
    }

    if (msg.attachments.size) {
        console.log("[msg ignore] Has Attachments (" + msg.id + ")");
        ai.trackEvent({name: "skipped"});
        return;
    }

    scheduleOrPerformDeletion(msg);

    const collector = msg.createReactionCollector((r: Discord.MessageReaction) => keepMessageReactions.includes(r.emoji.name), { max: 1, time: timeLimitMs });
    collector.on("collect", () => {
        // If the "keep" reaction has been cleared and it's not in the deletion schedule
        if (!collector.collected.size && !deletionSchedule[msg.id]) {
            scheduleOrPerformDeletion(msg);
        } else if (collector.collected.size && deletionSchedule[msg.id]) {
            clearTimeout(deletionSchedule[msg.id]);
            ai.trackEvent({name: "skipped"});
            delete deletionSchedule[msg.id];
            console.log("[KEEP] Keeping message " + msg.id);
        }
    });
});

bot.login(process.env.DISCORD_KEY)
.then(() => {
    console.log("login success");
})
.catch(reason => {
    console.error(reason);
    ai.trackException({exception: new Error("[ERROR] - Error logging in: " + reason)});
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
    // will echo "Our app is running on http://localhost:5000 when run locally"
    console.log("Our app is running on http://localhost:" + port);
});

 // pings server every 15 minutes to prevent dynos from sleeping
 setInterval(() => {
    http.get("http://morning-stream-21025.herokuapp.com");
  }, 900000);