const { Command } = require('klasa');
const moment = require('moment');

const filterLevels = [
    'Off',
    'No Role',
    'Everyone',
];
const verificationLevels = [
    'None',
    'Low',
    'Medium',
    '(╯°□°）╯︵ ┻━┻',
    '┻━┻ ﾐヽ(ಠ益ಠ)ノ彡┻━┻',
];

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ['text'],
            aliases: ['guild'],
            description: 'Get information on the current server.',
        });
    }

    async run(msg) {

        const serverInfo = new this.client.methods.Embed()
            .setColor(0x00AE86)
            .setThumbnail(msg.guild.iconURL())
            .addField('❯ Name', msg.guild.name, true)
            .addField('❯ ID', msg.guild.id, true)
            .addField('❯ Creation Date', moment(msg.guild.createdAt).format('MMMM Do YYYY'), true)
            .addField('❯ Region', msg.guild.region, true)
            .addField('❯ Explicit Filter', filterLevels[msg.guild.explicitContentFilter], true)
            .addField('❯ Verification Level', verificationLevels[msg.guild.verificationLevel], true)
            .addField('❯ Owner', msg.guild.owner ? msg.guild.owner.user.tag : 'None', true)
            .addField('❯ Members', msg.guild.memberCount, true);
        return msg.channel.send({ embed: serverInfo });

    }

};
