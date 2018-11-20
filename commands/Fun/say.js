const { Command } = require("klasa");

class Say extends Command {
  constructor(...args) {
    super(...args, {
      description: "Make the bot say something",
      usage: "<message:string>",
      permissionLevel: 4,
      aliases: ["echo"]
    });
  }

  async run(msg, [args]) {
    msg.delete().catch(O_o=>{}); 
    return msg.channel.send(args);
  }
}

module.exports = Say;
