const { Command } = require("klasa");
const snekfetch = require("snekfetch");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      cooldown: 3,
      aliases: ["wiki"],
      description: "Finds a Wikipedia Article by title.",
      usage: "<query:str>"
    });
  }

  async run(msg, [query]) {
    const article = await snekfetch
      .get(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`)
      .then(res => res.body)
      .catch(() => {
        throw "I couldn't find a Wikipedia Article with that title!";
      });
    const embed = new this.client.methods.Embed()
      .setColor(4886754)
      .setThumbnail((article.thumbnail && article.thumbnail.source) || "https://i.imgur.com/fnhlGh5.png")
      .setURL(article.content_urls.desktop.page)
      .setTitle(article.title)
      .setDescription(article.extract);
    return msg.send({ embed });
  }
};
