require("dotenv").config();

const { Telegraf } = require("telegraf");
const fs = require("fs");
const moment = require("moment")
const { Certificate } = require("crypto");
const { title } = require("process");
const { waitForDebugger } = require("inspector");
const prompt = require("prompt-sync")();

require("./CFF.js")();
require("./telegram.js")();

const filePath = process.env.FILE_PATH;
const bot = new Telegraf(process.env.BOT_TOKEN);
const adminID = process.env.ADMIN_ID;

const textResponse = JSON.parse(fs.readFileSync("./response.json"))

//bot.telegram.sendMessage(adminID, "Hello you have been defined as main administrator, to validate this choice run the command /admin")

let JSONObject = {};
JSONObject[adminID] = { admin: 3 };
JSONObject[adminID]["id"] = 0;
JSONObject[adminID]["mobile"] = false;
JSONObject[adminID]["size"] = 43;
JSONObject[adminID]["language"] = process.env.LANGUAGE 

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
}



async function editTelegramMessage(ctx, from, to, messageSent, userId, filePath, nb) {

    const chatId = messageSent.chat.id;
    const messageId = messageSent.message_id;

    let result = await getMessageContent(
        from,
        JSON.parse(fs.readFileSync(filePath))[userId][to],
        new Date().toLocaleTimeString('en-US', { timeZone: 'Europe/Zurich', hour12: false, hour: '2-digit', minute: '2-digit' }),
        false,
        userId,
        filePath
    );

    buttonList = []

    for (let i = 0; i < result[`${nb}`][1].length; i++) {
      button = { text: result[`${nb}`][1][i], callback_data: `time${i}` },
      buttonList.push(button)
      
    }

    await bot.telegram.editMessageText(chatId, messageId, 0, result[`${nb}`][0], {
        reply_markup: {
            inline_keyboard: [
                /* Inline buttons. 2 side-by-side */
                buttonList,
                [
                    { text: "←", callback_data: "left" },
                    { text: "→", callback_data: "right" },
                ],
                
            ],
        },
    });

    bot.action("left", (ctx) => {
      nb -= 1
      editTelegramMessage(ctx, from, to, messageSent, userId, filePath, nb)
    });

    bot.action("right", async (ctx) => {
        nb += 1
        editTelegramMessage(ctx, from, to, messageSent, userId, filePath, nb)
    });

}


async function telegram() {
  let numberID = 1;

  bot.command("start", async (ctx) => {

    if (verifyAccount(ctx) == -2) {
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["startVerify"]);
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["accessSend"]);
    }
    if (verifyAccount(ctx) == -3) {
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["startVerify"]);
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["accessDenied"]);
    }
    if (verifyAccount(ctx) == 0) {
      try{
        ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["startVerify"]);
        ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["start"]);
      }
      catch{
        ctx.reply(textResponse[process.env.LANGUAGE]["startVerify"]);
        ctx.reply(textResponse[process.env.LANGUAGE]["start"]);
      }
      
      JSONObject = JSON.parse(fs.readFileSync(filePath));
      JSONObject[ctx.message.from.id] = { admin: -1 };
      JSONObject[ctx.message.from.id]["chatID"] = ctx.chat.id;
      JSONObject[ctx.message.from.id]["id"] = numberID;
      JSONObject[ctx.message.from.id]["username"] = ctx.from.username;
      JSONObject[ctx.message.from.id]["first_name"] = ctx.from.first_name;
      JSONObject[ctx.message.from.id]["last_name"] = ctx.from.last_name;
      JSONObject[ctx.message.from.id]["time"] = ctx.message.date * 1000;
      JSONObject[ctx.message.from.id]["mobile"] = 43;
      JSONObject[ctx.message.from.id]["mobile"] = true;
      JSONObject[ctx.message.from.id]["size"] = 43;
      JSONObject[ctx.message.from.id]["language"] = process.env.LANGUAGE;

      fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

      askPermission(ctx, JSON.parse(fs.readFileSync(filePath)), numberID);

      numberID += 1;
    }
    if (verifyAccount(ctx) > 1) {
      console.log(1)
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["startVerify"]);
    }
  });

  bot.command("admin", async (ctx) => {
    verifyAdmin(ctx);
  });

  bot.command("newaccess", async (ctx) => {
    if (verifyAccount(ctx) == -2) {
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["newAccesSend"]);
    } else {
      if (verifyAccount(ctx) == 0) {
        ctx.reply(textResponse[process.env.LANGUAGE]["firstNewAccess"]);
      } else {
        if (verifyAccount(ctx) == 3) {
          ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["adminNewAccess"]);
        } else {
          if (verifyAccount(ctx) == 1) {
            ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["acceptNewAccess"]);
          } else {
            if (
              JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id][
                "time"
              ] +
                86400 >
              Date.now()
            ) {
              ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["acceptNewAccess"]);
            } else {
              JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"] =
                -1;
              fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
              askPermission(
                ctx,
                JSON.parse(fs.readFileSync(filePath)),
                JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"]
              );
              ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["newAcces"]);
            }
          }
        }
      }
    }
  });

  bot.command("admin", async (ctx) => {
    verifyAdmin(ctx);
  });

  bot.command("sethome", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);

    } else {
      data = JSON.parse(fs.readFileSync(filePath));
      data[ctx.message.from.id]["home"] = ctx.message.text.replace(
        "/sethome ",
        ""
      );
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["set"].replace("UIX345", "home").replace("UIX346", data[ctx.message.from.id]["home"]));

      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("setwork", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);
    } else {
      data = JSON.parse(fs.readFileSync(filePath));
      data[ctx.message.from.id]["work"] = ctx.message.text.replace(
        "/setwork ",
        ""
      );

      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["set"].replace("UIX345", "work").replace("UIX346", data[ctx.message.from.id]["work"]));
      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("set", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);
    } else {
      LocationTitle = ctx.message.text.split(":")[0].replace("/set ", "");
      location = ctx.message.text.split(":")[1].replace("/set ", "");
      data = JSON.parse(fs.readFileSync(filePath));
      data[ctx.message.from.id][LocationTitle] = location;

      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["set"].replace("UIX345", LocationTitle).replace("UIX346", data[ctx.message.from.id][LocationTitle]));
      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("home", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);
    } else {
      if (
        "home" in JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]
      ) {
        if (ctx.message.text.replace("/home") == "undefined") {
          if (
            "work" in JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]
          ) {
            from = JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id][
              "work"
            ];
          } else {
            ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["setEmpty"]);
            return;
          }
        } else {
          from = ctx.message.text.replace("/home", "");
        }
        const messageSent = await ctx.reply("wait...")

        await editTelegramMessage(ctx, from, "work", messageSent, ctx.message.from.id ,filePath, 0)

      } else {
        ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["setAutoEmpty"].replace("UIX345", "home"));
      }
    }
  });

  bot.command("work", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);
    } else {
      if (
        "work" in JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]
      ) {
        if (ctx.message.text.replace("/work") == "undefined") {
          if (
            "home" in JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]
          ) {
            from = JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id][
              "home"
            ];
          } else {
            ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["setEmpty"]);
            return;
          }
        } else {
          from = ctx.message.text.replace("/work", "");
        }

        const messageSent = await ctx.reply("wait...")

        await editTelegramMessage(ctx, from, "work", messageSent, ctx.message.from.id ,filePath, 0)

      } else {
        ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["setAutoEmpty"].replace("UIX345", "work"));
      }
    }
  });

  bot.command("travel", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(textResponse[process.env.LANGUAGE]["membersOnly"]);
    } else {
      from = ctx.message.text.split("-")[0].replace("/travel", "");
      to = ctx.message.text.split("-")[1];

      const messageSent = await ctx.reply("wait...")
      await editTelegramMessage(ctx, from, to, messageSent, ctx.message.from.id ,filePath)
    }
  });

  bot.command("m", async (ctx) => {
    data = JSON.parse(fs.readFileSync(filePath));
    data[ctx.message.from.id]["mobile"] = true;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
  });

  bot.command("d", async (ctx) => {
    data = JSON.parse(fs.readFileSync(filePath));
    data[ctx.message.from.id]["mobile"] = false;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
  });

  bot.command("help", async (ctx) => {
    try{
      ctx.reply(textResponse[JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["language"]]["help"]);
    }
    catch{
      ctx.reply(textResponse[process.env.LANGUAGE]["help"]);
    }
  })

  bot.command("language", async (ctx) => {
    
  })

  bot.launch();
}

telegram();
