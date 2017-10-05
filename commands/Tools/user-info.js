const { Command } = require('klasa');
const moment = require('moment');

const statuses = {
    online: '<:online:313956277808005120> Online',
    idle: '<:away:313956277220802560> Idle',
    dnd: '<:dnd:313956276893646850> Do Not Disturb',
    offline: '<:offline:313956277237710868> Offline',
};

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Get information on a mentioned user.',
            usage: '[Member:member]',
        });
    }

    async run(msg, [...args]) {

        const member = args[0] || msg.member;
        const userInfo = new this.client.methods.Embed()
            .setColor(member.displayHexColor || 0)
            .setThumbnail(member.user.displayAvatarURL())
            .addField('❯ Name', member.user.tag, true)
            .addField('❯ ID', member.id, true)
            .addField('❯ Discord Join Date', moment(member.user.createdAt).format('MMMM Do YYYY'), true)
            .addField('❯ Server Join Date', moment(member.joinedTimestamp).format('MMMM Do YYYY'), true)
            .addField('❯ Status', statuses[member.user.presence.status], true)
            .addField('❯ Playing', member.user.presence.activity ? member.user.presence.activity.name : 'N/A', true)
            .addField('❯ Highest Role', member.highestRole.name !== '@everyone' ? member.highestRole.name : 'None', true)
            .addField('❯ Hoist Role', member.hoistRole ? member.hoistRole.name : 'None', true);
        return msg.send({ embed: userInfo });
    }

};
