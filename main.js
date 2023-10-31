require("dotenv").config();

const { Telegraf } = require("telegraf");
const fs = require("fs");
const moment = require("moment")
const { Certificate } = require("crypto");
const { title } = require("process");
const { waitForDebugger } = require("inspector");
const prompt = require("prompt-sync")();

require("./CFF.js")();

const filePath = "./data.json";

const bot = new Telegraf(process.env.BOT_TOKEN);

const adminID = process.env.ADMIN_ID;

//bot.telegram.sendMessage(adminID, "Hello you have been defined as main administrator, to validate this choice run the command /admin")

let JSONObject = {};
JSONObject[adminID] = { admin: 3 };
JSONObject[adminID]["id"] = 0;
JSONObject[adminID]["mobile"] = false;
JSONObject[adminID]["size"] = 43;

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
}

function verifyAdmin(ctx) {
  if (ctx.from.id == adminID) {
    JSONObject = JSON.parse(fs.readFileSync(filePath));
    JSONObject[adminID]["username"] = ctx.from.username;
    JSONObject[adminID]["first_name"] = ctx.from.first_name;
    JSONObject[adminID]["last_name"] = ctx.from.last_name;

    fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

    ctx.reply("Perfect, you're now an admin.");
  } else {
    ctx.reply("This command is not intended for you");
  }
}

function verifyAccount(ctx) {
  if (ctx.message.from.id in JSON.parse(fs.readFileSync(filePath))) {
    return JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["admin"];
  } else {
    return 0;
  }
}

function askPermission(ctx, data, numberID) {
  for (var userID in data) {
    if (data[userID]["admin"] == 3) {
      bot.telegram.sendMessage(
        adminID,
        `#${numberID} Request for authorization to access the bot\n         ${ctx.message.from.last_name} ${ctx.message.from.first_name}\n         @${ctx.message.from.username}`,
        {
          reply_markup: {
            inline_keyboard: [
              /* Inline buttons. 2 side-by-side */
              [
                { text: "Accept", callback_data: "accept" },
                { text: "Reject", callback_data: "reject" },
              ],
            ],
          },
        }
      );
    }
  }

  JSONObject = JSON.parse(fs.readFileSync(filePath));
  JSONObject[ctx.message.from.id]["admin"] = -2;
  fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

  bot.action("accept", (ctx) => {
    AcceptFunction(ctx);
  });

  bot.action("reject", (ctx) => {
    rejectFunction(ctx);
  });
}

function AcceptFunction(ctx) {
  let numberID = /#(\d+)/.exec(ctx.update.callback_query.message.text)[1];

  data = JSON.parse(fs.readFileSync(filePath));
  let newUserID;

  for (var userID in data) {
    if (data[userID]["id"] == numberID) {
      newUserID = userID;
    }
  }

  if (data[newUserID]["admin"] == -2) {
    if (newUserID != data[newUserID]["chatID"]) {
      bot.telegram.sendMessage(
        data[newUserID]["chatID"],
        `@${data[newUserID]["username"]} Welcome among us, your request has been accepted `
      );
    } else {
      bot.telegram.sendMessage(
        data[newUserID]["chatID"],
        `Welcome among us, your request has been accepted`
      );
    }

    data[newUserID]["admin"] = 1;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    ctx.reply("The reply has been sent");
  } else {
    ctx.reply("You have already accepted this request");
  }
}

function rejectFunction(ctx) {
  let numberID = /#(\d+)/.exec(ctx.update.callback_query.message.text)[1];

  data = JSON.parse(fs.readFileSync(filePath));
  let newUserID;

  for (var userID in data) {
    if (data[userID]["id"] == numberID) {
      newUserID = userID;
    }
  }

  if (data[newUserID]["admin"] == -2) {
    if (newUserID != data[newUserID]["chatID"]) {
      bot.telegram.sendMessage(
        data[newUserID]["chatID"],
        `@${data[newUserID]["username"]} I'm sorry but your access to the bot is not possible.\n\n To request access again, run command /newacces`
      );
    } else {
      bot.telegram.sendMessage(
        data[newUserID]["chatID"],
        `I'm sorry but your access to the bot is not possible.\n To request access again, run command /newacces`
      );
    }

    data[newUserID]["admin"] = -3;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    ctx.reply("The reply has been sent");
  } else {
    ctx.reply("you have already refused this request");
  }
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
      ctx.reply(
        "Don't panic access has just been requested and you'll have the answer in a few hours"
      );
    }
    if (verifyAccount(ctx) == -3) {
      ctx.reply("I'm sorry but your access to the bot is not possible.");
    }
    if (verifyAccount(ctx) == 0) {
      ctx.reply(
        "🤖 This bot is unfortunately not available to the general public.\n\nBut don't panic, access has just been requested and you'll have the answer in a few hours."
      );
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

      fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));

      askPermission(ctx, JSON.parse(fs.readFileSync(filePath)), numberID);

      numberID += 1;
    }
    if (verifyAccount(ctx) > 1) {
      ctx.reply("Hello i'm a bot...");
    }
  });

  bot.command("admin", async (ctx) => {
    verifyAdmin(ctx);
  });

  bot.command("newacces", async (ctx) => {
    if (verifyAccount(ctx) == -2) {
      ctx.reply("Wait for your reply before making a new request");
    } else {
      if (verifyAccount(ctx) == 0) {
        ctx.reply("Use the /start command to request first access.");
      } else {
        if (verifyAccount(ctx) == 3) {
          ctx.reply("You are a admin you don't need to make requests");
        } else {
          if (verifyAccount(ctx) == 1) {
            ctx.reply("You're accepted, you don't need to request.");
          } else {
            if (
              JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id][
                "time"
              ] +
                86400 >
              Date.now()
            ) {
              ctx.reply("please wait 1 day");
            } else {
              JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"] =
                -1;
              fs.writeFileSync(filePath, JSON.stringify(JSONObject, null, 3));
              askPermission(
                ctx,
                JSON.parse(fs.readFileSync(filePath)),
                JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id]["id"]
              );
              ctx.reply(
                "Your access has just been requested and you'll have the answer in a few hours"
              );
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
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
    } else {
      data = JSON.parse(fs.readFileSync(filePath));
      data[ctx.message.from.id]["home"] = ctx.message.text.replace(
        "/sethome ",
        ""
      );
      ctx.reply(
        `Your home has been correctly defined for ${
          data[ctx.message.from.id]["home"]
        }`
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("setwork", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
    } else {
      data = JSON.parse(fs.readFileSync(filePath));
      data[ctx.message.from.id]["work"] = ctx.message.text.replace(
        "/setwork ",
        ""
      );
      ctx.reply(
        `Your work has been correctly defined for ${
          data[ctx.message.from.id]["work"]
        }`
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("set", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
    } else {
      title = ctx.message.text.split(":")[0].replace("/set", "");
      location = ctx.message.text.split(":")[1].replace("/set", "");
      data = JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id];
      data[title] = location;
      ctx.reply(
        `Your set ${title} has been correctly defined for ${data[title]}`
      );
      fs.writeFileSync(filePath, JSON.stringify(data, null, 3));
    }
  });

  bot.command("home", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
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
            ctx.reply("you must define a location");
            return;
          }
        } else {
          from = ctx.message.text.replace("/home", "");
        }
        const messageSent = await ctx.reply("wait...")

        await editTelegramMessage(ctx, from, "work", messageSent, ctx.message.from.id ,filePath, 0)

      } else {
        ctx.reply("you need to define your work for this feature");
      }
    }
  });

  bot.command("work", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
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
            ctx.reply("you must define a location");
            return;
          }
        } else {
          from = ctx.message.text.replace("/work", "");
        }

        const messageSent = await ctx.reply("wait...")

        await editTelegramMessage(ctx, from, "work", messageSent, ctx.message.from.id ,filePath, 0)

      } else {
        ctx.reply("you need to define your work for this feature");
      }
    }
  });

  bot.command("travel", async (ctx) => {
    if (verifyAccount(ctx) <= 0) {
      ctx.reply(
        "I'm sorry, this command is for members only. Use the /start command for more information."
      );
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

  bot.launch();
}

telegram();
