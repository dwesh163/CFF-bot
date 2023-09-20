const { Telegraf } = require('telegraf')

require('dotenv').config()

const dataJson = require('data.json');
const data = JSON.parse(dataJson);

console.log(data.admin);

const bot = new Telegraf(process.env.BOT_TOKEN)

async function telegram() {

    bot.command('start', async (ctx) => {
        ctx.reply("Hello i'm a bot...")
    })
    
    bot.launch()


}


telegram();