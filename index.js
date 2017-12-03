"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Discord = require("discord.js");
var Winston = require("winston");
var express = require("express");
var app = express();
var idiotRoleName = 'idiots';
var idiotGameName = 'World of Warcraft';
var logger = Winston.logger;
process.setMaxListeners(0);
// Configure logger settings
logger.remove(Winston.transports.Console);
logger.add(Winston.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client();
function addToIdiots(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, g, _b, _c, r, member;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _i = 0, _a = bot.guilds;
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    g = _a[_i];
                    _b = 0, _c = g[1].roles;
                    _d.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 5];
                    r = _c[_b];
                    if (!(r[1].name == idiotRoleName)) return [3 /*break*/, 4];
                    logger.debug('found');
                    member = g[1].members.find('id', userId);
                    if (!(member != null)) return [3 /*break*/, 4];
                    logger.debug('extra found');
                    return [4 /*yield*/, member.addRole(r[0])];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _b++;
                    return [3 /*break*/, 2];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function removeFromidiots(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, g, _b, _c, r, member;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _i = 0, _a = bot.guilds;
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    g = _a[_i];
                    _b = 0, _c = g[1].roles;
                    _d.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 5];
                    r = _c[_b];
                    if (!(r[1].name == idiotRoleName)) return [3 /*break*/, 4];
                    logger.debug('found');
                    member = g[1].members.find('id', userId);
                    if (!(member != null)) return [3 /*break*/, 4];
                    logger.debug('extra found');
                    return [4 /*yield*/, member.removeRole(r[0])];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _b++;
                    return [3 /*break*/, 2];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
bot.on('ready', function () {
    console.log('I am ready!');
    for (var _i = 0, _a = bot.guilds; _i < _a.length; _i++) {
        var g = _a[_i];
        for (var _b = 0, _c = g[1].roles; _b < _c.length; _b++) {
            var r = _c[_b];
            if (r[1].name == idiotRoleName) {
                logger.debug('found');
                for (var _d = 0, _e = g[1].members; _d < _e.length; _d++) {
                    var m = _e[_d];
                    var member = m[1];
                    if (member.user.presence.game != null && member.user.presence.game.name == idiotGameName) {
                        member.addRole(r[0]);
                    }
                    else {
                        member.removeRole(r[1]);
                    }
                }
            }
        }
    }
});
bot.on('message', function (message) {
    logger.info(message.content);
});
bot.on('presenceUpdate', function (oldMember, newMember) {
    var game = newMember.presence.game;
    if (game == null) {
        logger.info('remove');
        removeFromidiots(newMember.user.id);
    }
    else {
        if (game.name == idiotGameName) {
            logger.debug('add');
            addToIdiots(newMember.user.id);
        }
        else {
            logger.info('remove');
            removeFromidiots(newMember.user.id);
        }
    }
});
bot.login(process.env.DISCORD_KEY);
// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 5000;
// set the view engine to ejs
app.set('view engine', 'ejs');
// make express look in the `public` directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));
// set the home page route
app.get('/', function (request, response) {
    // ejs render automatically looks in the views folder
    response.render('index');
});
app.listen(port, function () {
    // will echo 'Our app is running on http://localhost:5000 when run locally'
    console.log('Our app is running on http://localhost:' + port);
});
// pings server every 15 minutes to prevent dynos from sleeping
setInterval(function () {
    var http = new http();
    http.get('http://morning-stream-21025.herokuapp.com');
}, 900000);
