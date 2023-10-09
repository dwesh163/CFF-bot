require('dotenv').config()

const { Telegraf } = require('telegraf')
const fs = require('fs');
const { Certificate } = require('crypto');
const prompt = require('prompt-sync')();

const filePath = './data.json';

const bot = new Telegraf(process.env.BOT_TOKEN)

const adminID = process.env.ADMIN_ID

bot.telegram.sendMessage(adminID, "Hello you have been defined as main administrator, to validate this choice run the command /admin")

let JSONObject = {}
JSONObject[adminID] = {admin: 3}
JSONObject[adminID]["id"] = 0

fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

function verifyAdmin(ctx) {
    if (ctx.from.id == adminID){
        JSONObject = JSON.parse(fs.readFileSync(filePath))
        JSONObject[adminID]["username"] = ctx.from.username
        JSONObject[adminID]["first_name"] = ctx.from.first_name
        JSONObject[adminID]["last_name"] = ctx.from.last_name

        fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

        ctx.reply("Perfect, you're now an admin.")
    }
    else
    {
        ctx.reply("This command is not intended for you")
    }
   
}

function verifyAccount(ctx) {
    if (ctx.message.from.id in JSON.parse(fs.readFileSync(filePath))){
        return JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["admin"]
    }
    else{
        return 0
    }
    
}

function askPermission(ctx, data, numberID){

    for (var userID in data){

        if (data[userID]["admin"] == 3){

            bot.telegram.sendMessage(adminID, `#${numberID} Request for authorization to access the bot\n         ${ctx.message.from.last_name} ${ctx.message.from.first_name}\n         @${ctx.message.from.username}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        /* Inline buttons. 2 side-by-side */
                        [ { text: "Accept", callback_data: "accept" }, { text: "Reject", callback_data: "reject" } ],
        
                    ]
                }
                
            });
        }
    }

    JSONObject = JSON.parse(fs.readFileSync(filePath))
    JSONObject[ctx.message.from.id]["admin"] = -2
    fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

    bot.action('accept', (ctx) => {
   
        AcceptFunction(ctx);
        
    });

    bot.action('reject', (ctx) => {
   
        rejectFunction(ctx);
    });
}

function AcceptFunction(ctx) {

    let numberID = /#(\d+)/.exec(ctx.update.callback_query.message.text)[1];

    data = JSON.parse(fs.readFileSync(filePath))
    let newUserID

    for(var userID in data){
        if(data[userID]["id"] == numberID){
            newUserID = userID
        }
    }

    if(data[newUserID]["admin"] == -2){

        if(newUserID != data[newUserID]["chatID"]){
            bot.telegram.sendMessage(data[newUserID]["chatID"],`@${data[newUserID]["username"]} Welcome among us, your request has been accepted `)
        }
        else{
            bot.telegram.sendMessage(data[newUserID]["chatID"],`Welcome among us, your request has been accepted`)
        }

        data[newUserID]["admin"] = 1
        fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
        ctx.reply("The reply has been sent")
    }
    else{
        ctx.reply("You have already accepted this request")
    }
    
}

function rejectFunction(ctx) {
    
    let numberID = /#(\d+)/.exec(ctx.update.callback_query.message.text)[1];

    
    data = JSON.parse(fs.readFileSync(filePath))
    let newUserID

    for(var userID in data){
        if(data[userID]["id"] == numberID){
            newUserID = userID
        }
    }

    if(data[newUserID]["admin"] == -2){

        if(newUserID != data[newUserID]["chatID"]){
            bot.telegram.sendMessage(data[newUserID]["chatID"],`@${data[newUserID]["username"]} I'm sorry but your access to the bot is not possible.\n\n To request access again, run command /newacces`)
        }
        else{
            bot.telegram.sendMessage(data[newUserID]["chatID"],`I'm sorry but your access to the bot is not possible.\n To request access again, run command /newacces`)
        }

        data[newUserID]["admin"] = -3
        fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
        ctx.reply("The reply has been sent")

    }
    else{
        ctx.reply("you have already refused this request")
    }    
    
}

async function telegram() {

    let numberID = 1

    bot.command('start', async (ctx) => {
        console.log(verifyAccount(ctx))

        if(verifyAccount(ctx) == -2)
        {
            ctx.reply("Don't panic access has just been requested and you'll have the answer in a few hours")
        }
        if(verifyAccount(ctx) == -3)
        {
            ctx.reply("I'm sorry but your access to the bot is not possible.")
        }
        if(verifyAccount(ctx) == 0)
        {   
            ctx.reply("🤖 This bot is unfortunately not available to the general public.\n\nBut don't panic, access has just been requested and you'll have the answer in a few hours.")
            JSONObject = JSON.parse(fs.readFileSync(filePath))
            JSONObject[ctx.message.from.id] = {admin: -1,}
            JSONObject[ctx.message.from.id]["chatID"] = ctx.chat.id
            JSONObject[ctx.message.from.id]["id"] = numberID
            JSONObject[ctx.message.from.id]["username"] = ctx.from.username
            JSONObject[ctx.message.from.id]["first_name"] = ctx.from.first_name
            JSONObject[ctx.message.from.id]["last_name"] = ctx.from.last_name
            JSONObject[ctx.message.from.id]["time"] = ctx.message.date * 1000
            
            fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
            
            askPermission(ctx, JSON.parse(fs.readFileSync(filePath)), numberID)

            numberID += 1
        }
        if (verifyAccount(ctx) == 1){
            ctx.reply("Hello i'm a bot...")
        }   
    })

    bot.command('admin', async (ctx) => {
        verifyAdmin(ctx)
    })

    bot.command('newacces', async (ctx) => {
        if (verifyAccount(ctx) == -2){
            ctx.reply("Wait for your reply before making a new request")
        }
        else{

            if (verifyAccount(ctx) == 0){
                ctx.reply("Use the /start command to request first access.")
            }
            else{

                if(verifyAccount(ctx) == 3){
                    ctx.reply("You are a admin you don't need to make requests")
                    console.log(Date.now())
                }
                else
                {   
                    if(verifyAccount(ctx) == 1){
                        ctx.reply("You're accepted, you don't need to request.")
                        console.log(Date.now())
                    }
                    else{
                        console.log(JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["time"] + 86400)
                        console.log(Date.now())
                        if(JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["time"] + 86400 > Date.now()){
                            ctx.reply("please wait 1 day")
                        }
                        else
                        {
                            JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"] = -1
                            fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
                            askPermission(ctx, JSON.parse(fs.readFileSync(filePath)), JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"])
                            ctx.reply("Your access has just been requested and you'll have the answer in a few hours")
                        }
                    }
                }
            }
        }

    })

    bot.launch()

}

telegram();