const { Command } = require('klasa');
const request = require('axios');
const HTMLParser = require('fast-html-parser');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      name: 'fml',
      enabled: true,
      runIn: ['text'],
      cooldown: 0,
      aliases: [],
      permLevel: 0,
      botPerms: ['SEND_MESSAGES'],
      requiredSettings: [],
      description: 'Gets a random FML story.',
      usage: '',
      extendedHelp: 'No Extended Help.',
    });
  }

  async run(msg) {

    const res = await request.get('http://www.fmylife.com/random');
    const root = HTMLParser.parse(res.data);
    const article = root.querySelector('.block a');
    const downdoot = root.querySelector('.vote-down');
    const updoot = root.querySelector('.vote-up');
    const embed = new this.client.methods.Embed()
      .setTitle(`Requested by ${msg.author.tag}`)
      .setAuthor('FML Stories')
      .setColor(msg.member.highestRole.color || 0)
      .setTimestamp()
      .setDescription(`_${article.childNodes[0].text}\n\n_`)
      .addField('I agree, your life sucks', updoot.childNodes[0].text, true)
      .addField('You deserved it:', downdoot.childNodes[0].text, true);
    if (article.childNodes[0].text.length < 5) {
      return msg.channel.send('Today, something went wrong, so you will have to try again in a few moments. FML again.');
    }
    return msg.channel.send({ embed });
  }
  
};