const { Command } = require("klasa");
const { MessageAttachment } = require("discord.js");
const faceapp = require("faceapp");
const snekfetch = require("snekfetch");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      cooldown: 5,
      botPerms: ["ATTACH_FILES"],
      description: "Applies a faceapp filter to an image.",
      usage: "<smile|smile_2|hot|old|young|female|female_2|male|pan|hitman|makeup|wave|glasses|bangs|hipster|goatee|lion|impression|heisenberg|hollywood>"
    });
  }

  async run(msg, [filter]) {
    if (!msg.attachments.first() || !msg.attachments.first().height) return msg.send("Please upload an image.");
    snekfetch
      .get(msg.attachments.first().url)
      .then(r => {
        faceapp
          .process(r.body, filter)
          .then(img => msg.send(new MessageAttachment(img, `${(Math.random() * 10000) | 0}.jpg`)))
          .catch(err => msg.send("Error - Couldn't find a face in the image."));
      })
      .catch(err => msg.send("There was an error. Please try again in a few minutes."));
  }
};
