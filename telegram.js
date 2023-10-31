const { Telegraf } = require("telegraf");
const fs = require("fs");
const prompt = require("prompt-sync")();

const filePath = process.env.FILE_PATH;
const bot = new Telegraf(process.env.BOT_TOKEN);
const adminID = process.env.ADMIN_ID;

module.exports = function () {
    this.verifyAdmin = function (ctx) {
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

  this.verifyAccount = function (ctx) {
    if (ctx.message.from.id in JSON.parse(fs.readFileSync(filePath))) {
      return JSON.parse(fs.readFileSync(filePath))[ctx.message.from.id][
        "admin"
      ];
    } else {
      return 0;
    }
  }

  this.askPermission =  function(ctx, data, numberID) {
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

  this.AcceptFunction = function (ctx) {
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

  this.rejectFunction = function (ctx) {
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
};
