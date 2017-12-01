const Discord = require('discord.js');
var logger = require('winston');
//var auth = optional('./auth.json');

const idiotRoleName = 'idiots'
const idiotGameName = 'FTL: Faster Than Light'

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();

function addToIdiots(userId) {
    for(var g of bot.guilds) {
        for(var r of g[1].roles) {
            if(r[1].name == idiotRoleName) {
                logger.debug('found');
                var member = g[1].members.find('id', userId);
                if(member != null) {
                    logger.debug('extra found');
                    member.addRole(r[0]);
                }
            }
        }
    }
}

function removeFromidiots(userId) {
    for(var g of bot.guilds) {
        for(var r of g[1].roles) {
            if(r[1].name == idiotRoleName) {
                logger.debug('found');
                var member = g[1].members.find('id', userId);
                if(member != null) {
                    logger.debug('extra found');
                    member.removeRole(r[0]);
                }
            }
        }
    }
}

bot.on('ready', () => {
    console.log('I am ready!');
    for(var g of bot.guilds) {
        for(var r of g[1].roles) {
            if(r[1].name == idiotRoleName) {
                logger.debug('found');
                for(var m of g[1].members) {
                    m = m[1];
                    if(m.user.presence.game != null && m.user.presence.game.name == idiotGameName) {
                        m.addRole(r[0]);
                    } else {
                        m.removeRole(r[1]);
                    }
                }
            }
        }
    }
});

bot.on('message', message => {
    logger.info(message.content);
});
bot.on('presenceUpdate', (oldMember, newMember) => {
    var game = newMember.presence.game;
    if(game == null) {
        logger.info('remove');
        removeFromidiots(newMember.user.id);
    } else {
        if (game.name == idiotGameName) {
            logger.debug('add');
            addToIdiots(newMember.user.id);
        } else {
            logger.info('remove');
            removeFromidiots(newMember.user.id);
        }
    }
});

bot.login(process.env.DISCORD_KEY);