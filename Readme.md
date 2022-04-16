# Auto Idiot Bot

Add it here: <https://discordapp.com/api/oauth2/authorize?client_id=385981298247860231&permissions=268435456&scope=bot>

Make sure your bot's rank is above the idiots rank.

## Running

```
npm install
npm run start
```

## Deploying

[Heroku cli](https://devcenter.heroku.com/articles/heroku-command-line)

```
heroku login
heroku container:login
heroku container:push web
heroku container:release web
```