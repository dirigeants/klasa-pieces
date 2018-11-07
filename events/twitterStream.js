const { Event } = require('klasa');
const { MessageEmbed } = require('discord.js');
const he = require('he');
const Twit = require('twit');

// The channel ID you want the tweets to be sent to
const tweetChannel = '';

// The ID's of the accounts you want to stream tweets from - http://gettwitterid.com/
const twitterAccounts = [''];

// https://developer.twitter.com/en/apply/user
/* eslint-disable camelcase */
const twitter = new Twit({
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
});
/* eslint-enable camelcase */

module.exports = class extends Event {

	constructor(...args) {
		super(...args, { once: true, event: 'klasaReady' });
	}

	run() {
		const stream = twitter.stream('statuses/filter', { follow: twitterAccounts });

		stream.on('tweet', this.handleTweet.bind(this));
	}

	handleTweet(tweet) {
		// Skip tweets that are retweets, replies, etc
		if (
			tweet.retweeted ||
			tweet.retweeted_status ||
			tweet.in_reply_to_status_id ||
			tweet.in_reply_to_user_id ||
			tweet.delete
		) {
			return;
		}

		const _tweet = tweet.extended_tweet ? tweet.extended_tweet : tweet;

		const formattedTweet = {
			text: he.decode(tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text),
			url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
			name: he.decode(tweet.user.name),
			avatar: tweet.user.profile_image_url_https,
			image: (_tweet.entities.media && _tweet.entities.media[0].media_url_https) || null
		};

		this.sendTweet(formattedTweet);
	}

	sendTweet({ text, url, name, avatar, image }) {
		const embed = new MessageEmbed()
			.setDescription(`\n ${text}`)
			.setColor(1942002)
			.setThumbnail(avatar)
			.setAuthor(name)
			.setImage(image);

		this.client.channels.get(tweetChannel).send(url, { embed })
			.catch((err) => this.client.emit('wtf', err));
	}

};
