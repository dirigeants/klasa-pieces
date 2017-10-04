const { Command } = require('klasa');
const snek = require('snekfetch');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      aliases: ['randomcat', 'meow'],
      description: 'Grabs a random cat image from random.cat.',
      extendedHelp: 'This command grabs a random cat from "http://random.cat/meow".',
    });
  }

  async run(msg) {
    const { body } = await snek.get('http://random.cat/meow');
    return msg.send('I found this cat image. Here you go!', { files: [{ attachment: body.file, name: `cat.${body.file.split('.')[2]}` }] });
  }

};
