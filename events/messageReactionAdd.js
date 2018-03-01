const { Event } = require('klasa');

module.exports = class extends Event {

    constructor(...args) {
        super(...args, { 
            enabled: true
        });
    }

    run(messageReaction, user) {

        if(!messageReaction.message.guild.configs.starboard || !messageReaction.message.guild.configs.starboardCount) return;
        if(messageReaction.message.author.id === user.id) {
            messageReaction.message.reply('You cannot star your own messages.')
            .then(messageReaction.users.remove(user.id))
            .then(message => setTimeout(() => message.delete(), 5000))
            return;
        }

        const avatarOptions = messageReaction.message.author.displayAvatarURL().endsWith('.gif') ? { format: 'gif' } : { format: 'webp' }

        const embed = new this.client.methods.Embed()
        .setAuthor(messageReaction.message.member.displayName + messageReaction.message.author.discriminator, messageReaction.message.author.displayAvatarURL(avatarOptions))
        .setDescription(messageReaction.message.content)
        .setTimestamp()
        .setFooter(`${messageReaction.message.id}`)

        if(!messageReaction.message.attachments.length == 0) {
            embed.setImage(messageReaction.message.attachments.first().url)
        }
        
        if(messageReaction.emoji.name === '⭐' && messageReaction.count >= messageReaction.message.guild.configs.starboardCount) {
            if(messageReaction.message.guild.configs.starredMessages.find(ID => ID === messageReaction.message.id)) {
                messageReaction.message.guild.channels.get(messageReaction.message.guild.configs.starboard).messages
                .find(m => m.embeds.length && m.embeds[0].footer && m.embeds[0].footer.text.includes(messageReaction.message.id))
                .edit(`⭐ **${messageReaction.count}** • <#${messageReaction.message.channel.id}>`, {embed})
            } else {
                messageReaction.message.guild.configs.update('starredMessages', messageReaction.message.id)
                messageReaction.message.guild.channels.get(messageReaction.message.guild.configs.starboard).send(`⭐ **${messageReaction.count}** • <#${messageReaction.message.channel.id}>`, {embed})
            }
        }
    }

};
