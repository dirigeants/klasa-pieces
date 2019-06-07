const { Extendable, Settings, SchemaPiece } = require('klasa');

// This is only necessary until the settings branch merges, since it has its own resolve method.

module.exports = class extends Extendable {

  constructor(...args) {
    super(...args, { appliesTo: [Settings] });
  }

  resolve(path, guild, language = guild ? guild.language : this.client.languages.default) {
    const route = typeof path === 'string' ? path.split('.') : path;
    const piece = this.gateway.schema.get(route);
    if (!(piece && piece instanceof SchemaPiece)) throw undefined;

    let objOrData = this;
    for (const key of route) objOrData = objOrData[key];

    try {
      return piece.serializer.deserialize(objOrData, piece, language, guild);
    } catch (_) {
      return undefined;
    }
  }

};
