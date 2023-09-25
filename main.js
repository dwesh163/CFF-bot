require('dotenv').config()

const { Telegraf } = require('telegraf')
const fs = require('fs')
const prompt = require('prompt-sync')();

const filePath = './data.json';

const bot = new Telegraf(process.env.BOT_TOKEN)

const adminID = prompt('Enter a Admin ID: ');
let JSONObject = {}
JSONObject[adminID] = {admin: 3}

fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

function verifyAccount(ctx) {
    let isAccount = new Boolean()
    if (ctx.message.chat.id in JSON.parse(fs.readFileSync(filePath))){
        isAccount = true
    }
    else{
        isAccount = false
    }

    return isAccount
}

async function telegram() {

    bot.command('start', async (ctx) => {
        console.log(verifyAccount(ctx))
        if (verifyAccount(ctx)){
            ctx.reply("Hello i'm a bot...")
        }
                
    })

    bot.launch()

}

telegram();