import * as Discord from "discord.js";
import * as express from "express";
import * as http from "http";
import { Intents } from "discord.js";

const channelToMonitor = process.env.CHANNEL_ID;
const timeLimitMs = parseInt(process.env.TIME_LIMIT_MS);
const keepMessageReactions = ["✅", "🎷"];
const deletionSchedule: { [id: string]: NodeJS.Timer } = {}; // Map of Discord Message IDs to setTimeout identifiers

process.setMaxListeners(0);

// Initialize Discord Bot
const bot = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

bot.on("ready", async () => {
    console.log("I am ready!");
    await initializeDeletions();
});

async function initializeDeletions() {
    const channel = await bot.channels.fetch(channelToMonitor);
    const txtChannel = channel as Discord.TextChannel;

    let last: Discord.Snowflake = undefined;
    do {
        console.log("pass: " + last);
        const limit = 5;
        const messages = last == undefined
            ? await txtChannel.messages.fetch({ limit: limit })
            : await txtChannel.messages.fetch({ before: last, limit: limit });

        for (const m of messages) {
            await handleMessage(m[1]);
        }

        if (messages.size == limit) {
            last = messages.last().id;
        } else {
            last = undefined;
        }
    } while (last != undefined);
    console.log("init done");
}

function scheduleOrPerformDeletion(msg: Discord.Message) {
    const now = new Date().getTime();
    const deleteInMs = (msg.createdTimestamp + timeLimitMs) - now;
    if (deleteInMs < 0) {
        deleteMessage(msg);
    } else {
        if (deletionSchedule[msg.id] == undefined) {
            console.log("[SCHEDULE] scheduling deletion of message (" + msg.author.username + ") " + msg.id + " in " + deleteInMs + "ms");
            deletionSchedule[msg.id] =
                setTimeout(async () => {
                    deleteMessage(msg);
                }, deleteInMs);

            if (process.env.TEST_RUN) {
                msg.react("⏳")
                    .catch(err => {
                        console.error("error applying ⏳ reaction: " + err);
                    });
            } else {
                msg.reactions.removeAll()
                    .catch(err => {
                        console.error("error clearing reactions: " + err);
                    });
            }
        }
    }
}

async function deleteMessage(msg: Discord.Message) {
    if (!process.env.TEST_RUN) {
        msg.delete()
            .then(() => {
                console.log("[DELETED] removed message  (" + msg.author.username + ") " + msg.id);
            })
            .catch(err => {
                console.error("[ERROR] - Error deleting message: " + err);
            });
    } else {
        msg.react("💣")
            .catch(err => {
                console.error("error applying 💣 reaction: " + err);
            });
        console.log("[DELETED - TEST RUN] removed message  (" + msg.author.username + ") " + msg.id);
    }
}

function handleMessage(msg: Discord.Message) {
    if (msg.channel.id != channelToMonitor) {
        return;
    }

    if (msg.attachments.size) {
        console.log("[msg ignore] Has Attachments (" + msg.id + ")");
        return;
    }

    if (msg.reactions.cache.some(r => keepMessageReactions.includes(r.emoji.name))) {
        console.log("[msg ignore] Keeping it. (" + msg.id + ")");

        if (deletionSchedule[msg.id] != undefined) {
            clearTimeout(deletionSchedule[msg.id]);
            delete deletionSchedule[msg.id];
        }

        return;
    }

    scheduleOrPerformDeletion(msg);
}

bot.on("messageCreate", msg => {
    handleMessage(msg);
});

bot.on("messageReactionAdd", react => {
    handleMessage(react.message as Discord.Message);
});

bot.on("messageReactionRemove", react => {
    handleMessage(react.message as Discord.Message);
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

app.get("/", (request, response) => {
    response.status(200).send("OK");
});

app.listen(port, () => {
    // will echo "Our app is running on http://localhost:5000 when run locally"
    console.log("Our app is running on " + process.env.PING_ENDPOINT);
});

 // pings server every 15 minutes to prevent dynos from sleeping
 setInterval(() => {
    http.get(process.env.PING_ENDPOINT);
  }, 900000);