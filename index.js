const Discord = require('discord.js');
var logger = require('winston');
const express = require('express');
const app = express();

const idiotRoleName = 'idiots'
const idiotGameName = 'World of Warcraft'

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

// set the port of our application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 5000;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the `public` directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', (request, response) => {
    // ejs render automatically looks in the views folder
    response.render('index');
});

app.listen(port, () => {
    // will echo 'Our app is running on http://localhost:5000 when run locally'
    console.log('Our app is running on http://localhost:' + port);
});

 // pings server every 15 minutes to prevent dynos from sleeping
 setInterval(() => {
    http.get('http://morning-stream-21025.herokuapp.com');
  }, 900000);