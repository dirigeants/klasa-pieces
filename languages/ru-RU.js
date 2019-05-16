const { Language, util } = require('klasa');

module.exports = class extends Language {

	constructor(...args) {
		super(...args);
		this.language = {
			DEFAULT: (key) => `Ключ ${key} ещё не переведён на ru-RU.`,
			DEFAULT_LANGUAGE: 'Язык по умолчанию',
			PREFIX_REMINDER: (prefix = `@${this.client.user.tag}`) => `Префикс${Array.isArray(prefix) ?
				`ы для этого сервера: ${prefix.map(pre => `\`${pre}\``).join(', ')}` :
				` для этого сервера: \`${prefix}\``
			}`,
			SETTING_GATEWAY_EXPECTS_GUILD: 'Параметр <Guild> ожидает либо Guild, либо Guild Object.',
			SETTING_GATEWAY_VALUE_FOR_KEY_NOEXT: (data, key) => `Значение ${data} не существует для ключа ${key}.`,
			SETTING_GATEWAY_VALUE_FOR_KEY_ALREXT: (data, key) => `Значение ${data} для ключа ${key} уже существует.`,
			SETTING_GATEWAY_SPECIFY_VALUE: 'Необходимо указать значение для добавления или фильтрации.',
			SETTING_GATEWAY_KEY_NOT_ARRAY: (key) => `Ключ ${key} не является массивом.`,
			SETTING_GATEWAY_KEY_NOEXT: (key) => `Ключ ${key} не существует в текущей схеме данных.`,
			SETTING_GATEWAY_INVALID_TYPE: 'Параметр type должен быть либо add, либо remove.',
			SETTING_GATEWAY_INVALID_FILTERED_VALUE: (piece, value) => `${piece.key} не принимает значение: ${value}`,
			RESOLVER_MULTI_TOO_FEW: (name, min = 1) => `Предоставлено недостаточно ${name}, ожидалось как минимум: ${min}.`,
			RESOLVER_INVALID_BOOL: (name) => `${name} должен быть true или false.`,
			RESOLVER_INVALID_CHANNEL: (name) => `${name} должен быть упоминанием канала или действительным id канала.`,
			RESOLVER_INVALID_CUSTOM: (name, type) => `${name} должен быть действительным ${type}.`,
			RESOLVER_INVALID_DATE: (name) => `${name} должен быть допустимой датой.`,
			RESOLVER_INVALID_DURATION: (name) => `${name} должен быть допустимой строкой длительности.`,
			RESOLVER_INVALID_EMOJI: (name) => `${name} должен быть тегом пользовательского эмодзи или действительным id эмодзи.`,
			RESOLVER_INVALID_FLOAT: (name) => `${name} должен быть допустимым числом.`,
			RESOLVER_INVALID_GUILD: (name) => `${name} должен быть действительным id сервера.`,
			RESOLVER_INVALID_INT: (name) => `${name} должен быть целым числом.`,
			RESOLVER_INVALID_LITERAL: (name) => `Ваш вариант не соответствует единственно верному: ${name}`,
			RESOLVER_INVALID_MEMBER: (name) => `${name} должен быть упоминанием или действительным id пользователя.`,
			RESOLVER_INVALID_MESSAGE: (name) => `${name} должен быть действительным id сообщения.`,
			RESOLVER_INVALID_PIECE: (name, piece) => `${name} должен быть допустимым именем ${piece}.`,
			RESOLVER_INVALID_REGEX_MATCH: (name, pattern) => `${name} должен соответствовать регулярному выражению \`${pattern}\`.`,
			RESOLVER_INVALID_ROLE: (name) => `${name} должен быть упоминанием роли или действительным id роли.`,
			RESOLVER_INVALID_STRING: (name) => `${name} должен быть допустимой строкой.`,
			RESOLVER_INVALID_TIME: (name) => `${name} должен быть допустимой датой или длительностью.`,
			RESOLVER_INVALID_URL: (name) => `${name} должен быть допустимым URL.`,
			RESOLVER_INVALID_USER: (name) => `${name} должен быть упоминанием или действительным id пользователя.`,
			RESOLVER_STRING_SUFFIX: '  символ',
			RESOLVER_MINMAX_EXACTLY: (name, min, suffix) => `${name} должен быть равен ${min}${suffix === this.language.RESOLVER_STRING_SUFFIX ? `${suffix}ам` : suffix}.`,
			RESOLVER_MINMAX_BOTH: (name, min, max, suffix) => `${name} должен быть между ${min} и ${max}${suffix === this.language.RESOLVER_STRING_SUFFIX ? `${suffix}ами` : suffix}.`,
			RESOLVER_MINMAX_MIN: (name, min, suffix) => `${name} должен быть больше ${min}${suffix === this.language.RESOLVER_STRING_SUFFIX ? `${suffix}ов` : suffix}.`,
			RESOLVER_MINMAX_MAX: (name, max, suffix) => `${name} должен быть меньше ${max}${suffix === this.language.RESOLVER_STRING_SUFFIX ? `${suffix}ов` : suffix}.`,
			REACTIONHANDLER_PROMPT: 'На какую страницу вы бы хотели перейти?',
			COMMANDMESSAGE_MISSING: 'Отсутствует один или больше обязательных аргументов после окончания ввода.',
			COMMANDMESSAGE_MISSING_REQUIRED: (name) => `${name} является обязательным аргументом.`,
			COMMANDMESSAGE_MISSING_OPTIONALS: (possibles) => `Отсутствует обязательный параметр: (${possibles})`,
			COMMANDMESSAGE_NOMATCH: (possibles) => `Ваш вариант не соответствует ни одному из возможных: (${possibles})`,
			// eslint-disable-next-line max-len
			MONITOR_COMMAND_HANDLER_REPROMPT: (tag, error, time, abortOptions) => `${tag} | **${error}** | Ответьте на это сообщение допустимым значением аргумента в течение **${time}** ${this.pluralize(time, 'секунды', 'секунд', 'секунд')} или отправьте **${abortOptions.join('**, **')}** для отмены.`,
			// eslint-disable-next-line max-len
			MONITOR_COMMAND_HANDLER_REPEATING_REPROMPT: (tag, name, time, cancelOptions) => `${tag} | **${name}** является повторяющимся аргументом | Ответьте на это сообщение дополнительными значениями аргумента в течение **${time}** ${this.pluralize(time, 'секунды', 'секунд', 'секунд')} или отправьте **${cancelOptions.join('**, **')}** для отмены.`,
			MONITOR_COMMAND_HANDLER_ABORTED: 'Отменено',
			INHIBITOR_COOLDOWN: (remaining) => `Вы только что использовали эту команду. Вы сможете использовать её снова через ${remaining} ${this.pluralize(remaining, 'секунды', 'секунд', 'секунд')}.`,
			INHIBITOR_DISABLED_GUILD: 'Эта команда была отключена администратором сервера.',
			INHIBITOR_DISABLED_GLOBAL: 'Эта команда была отключена владельцем бота.',
			INHIBITOR_MISSING_BOT_PERMS: (missing) => `Недостаточно прав для выполнения команды, отсутствуют следующие разрешения: **${missing}**`,
			INHIBITOR_NSFW: 'Вы можете использовать NSFW команды только в NSFW каналах.',
			INHIBITOR_PERMISSIONS: 'У вас недостаточно прав для использования этой команды.',
			INHIBITOR_REQUIRED_SETTINGS: (settings) => `Команда не может быть выполнена, так как на сервере отсутствуют следующие настройки: **${settings.join(', ')}**.`,
			INHIBITOR_RUNIN: (types) => `Эта команда может быть выполнена только в определённых типах каналов: ${types}.`,
			INHIBITOR_RUNIN_NONE: (name) => `Команда ${name} не настроена для выполнения ни в одном канале.`,
			COMMAND_BLACKLIST_DESCRIPTION: 'Добавляет/удаляет пользователей и серверы в чёрный список бота.',
			COMMAND_BLACKLIST_SUCCESS: (usersAdded, usersRemoved, guildsAdded, guildsRemoved) => [
				usersAdded.length ? `**Пользователи добавлены**\n${util.codeBlock('', usersAdded.join(', '))}` : '',
				usersRemoved.length ? `**Пользователи удалены**\n${util.codeBlock('', usersRemoved.join(', '))}` : '',
				guildsAdded.length ? `**Серверы добавлены**\n${util.codeBlock('', guildsAdded.join(', '))}` : '',
				guildsRemoved.length ? `**Серверы удалены**\n${util.codeBlock('', guildsRemoved.join(', '))}` : ''
			].filter(val => val !== '').join('\n'),
			COMMAND_EVAL_DESCRIPTION: 'Выполняет произвольный JavaScript. Зарезервировано для владельца бота.',
			COMMAND_EVAL_EXTENDEDHELP: [
				'Команда eval выполняет код внутри себя, любая ошибка будет обработана.',
				'Также вы можете использовать флаги --silent, --depth=число и --async для изменения поведения команды.',
				'Флаг --silent отключает вывод результата.',
				'Флаг --depth принимает число, например, --depth=2, которое задаёт глубину результата для util.inspect.',
				'Флаг --async оборачивает код в асинхронную функцию, благодаря чему вы сможете использовать await, но вам также придётся использовать return, чтобы вернуть результат.',
				'Флаг --showHidden включает параметр showHidden в util.inspect.',
				'Если результат слишком большой, он будет отправлен в виде файла или выведен в консоль, если бот не имеет разрешения на отправку файлов.'
			].join('\n'),
			COMMAND_EVAL_ERROR: (time, output, type) => `**Ошибка**:${output}\n**Тип**:${type}\n${time}`,
			COMMAND_EVAL_OUTPUT: (time, output, type) => `**Результат**:${output}\n**Тип**:${type}\n${time}`,
			COMMAND_EVAL_SENDFILE: (time, type) => `Результат оказался слишком длинным, он будет отправлен в виде файла.\n**Тип**:${type}\n${time}`,
			COMMAND_EVAL_SENDCONSOLE: (time, type) => `Результат оказался слишком длинным, он будет выведен в консоль.\n**Тип**:${type}\n${time}`,
			COMMAND_UNLOAD: (type, name) => `✅ Выгружено ${type}: ${name}`,
			COMMAND_UNLOAD_DESCRIPTION: 'Выгружает элемент klasa.',
			COMMAND_UNLOAD_WARN: 'Скорее всего вам не стоит выгружать это, так как вы не сможете использовать какую-либо команду, чтобы загрузить это снова.',
			COMMAND_TRANSFER_ERROR: '❌ Этот файл уже был перемещён или никогда не существовал.',
			COMMAND_TRANSFER_SUCCESS: (type, name) => `✅ Успешно перемещено ${type}: ${name}.`,
			COMMAND_TRANSFER_FAILED: (type, name) => `Перемещение ${type}: ${name} в клиент не удалось, проверьте вашу консоль.`,
			COMMAND_TRANSFER_DESCRIPTION: 'Перемещает основной элемент в соответствующую папку.',
			COMMAND_RELOAD: (type, name, time) => `✅ Перезагружено ${type}: ${name}. (Перезагрузка заняла: ${time})`,
			COMMAND_RELOAD_FAILED: (type, name) => `❌ Перезагрузка не удалась ${type}: ${name}, проверьте вашу консоль.`,
			COMMAND_RELOAD_ALL: (type, time) => `✅ Перезагружено ${type}. (Перезагрузка заняла: ${time})`,
			COMMAND_RELOAD_EVERYTHING: (time) => `✅ Полная перезагрузка. (Перезагрузка заняла: ${time})`,
			COMMAND_RELOAD_DESCRIPTION: 'Перезагружает конкретный элемент klasa или все элементы хранилища klasa.',
			COMMAND_REBOOT: 'Перезагрузка...',
			COMMAND_REBOOT_DESCRIPTION: 'Перезагружает бота.',
			COMMAND_LOAD: (time, type, name) => `✅ Успешно загружено ${type}: ${name}. (Загрузка заняла: ${time})`,
			COMMAND_LOAD_FAIL: 'Файл не существует или во время его загрузки произошла ошибка, проверьте вашу консоль.',
			COMMAND_LOAD_ERROR: (type, name, error) => `❌ Загрузка не удалась ${type}: ${name}. Причина:${util.codeBlock('js', error)}`,
			COMMAND_LOAD_DESCRIPTION: 'Загружает элемент вашего бота.',
			COMMAND_PING: 'Пинг?',
			COMMAND_PING_DESCRIPTION: 'Запускает проверку соединения с Discord.',
			COMMAND_PINGPONG: (diff, ping) => `Понг! (Задержка сообщения: ${diff}мс. Задержка API: ${ping}мс.)`,
			COMMAND_INVITE: () => [
				`Добавление ${this.client.user.username} на ваш сервер:`,
				`<${this.client.invite}>`,
				util.codeBlock('', [
					'Ссылка выше создана из учёта минимального набора разрешений, необходимого для работы всех команд бота на данный момент.',
					'Не все разрешения подходят для всех серверов, поэтому не бойтесь убирать галочки.',
					'Если вы попытаетесь использовать команду, которая требует больше разрешений, чем есть у бота, он даст вам знать.'
				].join(' ')),
				'Пожалуйста, создайте issue на <https://github.com/dirigeants/klasa>, если найдёте какие-либо ошибки.'
			],
			COMMAND_INVITE_DESCRIPTION: 'Отображает ссылку для добавления бота на сервер',
			COMMAND_INFO: [
				"Klasa это 'plug-and-play' фреймворк, работающий поверх библиотеки Discord.js.",
				'Большая часть кода разделена на модули, что позволяет разработчикам изменять Klasa под свои нужды.',
				'',
				'Некоторые особенности Klasa:',
				'• 🐇💨 Быстрая загрузка с поддержкой ES2017 (`async`/`await`)',
				'• 🎚🎛 Расширяемые настройки для каждого клиента/пользователя/сервера',
				'• 💬 Настраиваемая система команд с автоматическим разрешением параметров и возможностью загружать/перезагружать команды на лету',
				'• 👀 "Monitors", отслеживающие сообщения и их редактирование (фильтры бранных слов, защита от спама)',
				'• ⛔ "Inhibitors", предотвращающие выполнение команды на основе заданных условий (права доступа, чёрные списки)',
				'• 🗄 "Providers", упрощающие использование базы данных по вашему выбору',
				'• ✅ "Finalizers", запускающиеся после успешного выполнения команд (логирование, сбор статистики, очистка ответов)',
				'• ➕ "Extendables", расширяющие существующие классы Klasa и Discord.js новыми методами, геттерами/сеттерами и статическими свойствами',
				'• 🌐 "Languages", позволяющие локализировать ответы вашего бота',
				'• ⏲ "Tasks", которые могут быть запланированы для выполнения в будущем с возможностью повтора',
				'',
				'Мы надеемся быть на 100% настраиваемым фреймворком, который бы устраивал всех разработчиков. Мы часто выпускаем обновления и исправляем ошибки по мере возможности.',
				'Если вы заинтересованы, вы можете найти нас на https://klasa.js.org'
			],
			COMMAND_INFO_DESCRIPTION: 'Предоставляет информацию о боте.',
			COMMAND_HELP_DESCRIPTION: 'Отображает список доступных вам команд или справку о конкретной команде.',
			COMMAND_HELP_NO_EXTENDED: 'Расширенная справка отсутствует.',
			COMMAND_HELP_DM: '📥 | Список доступных вам команд отправлен вам в личные сообщения.',
			COMMAND_HELP_NODM: '❌ | Я не могу отправить вам список доступных команд, так как вы отключили личные сообщения.',
			COMMAND_HELP_USAGE: (usage) => `Формат :: ${usage}`,
			COMMAND_HELP_EXTENDED: 'Расширенная справка ::',
			COMMAND_ENABLE: (type, name) => `+ Успешно активировано ${type}: ${name}`,
			COMMAND_ENABLE_DESCRIPTION: 'Активирует или временно активирует команду/ингибитор/монитор/финализатор. Состояние по умолчанию будет восстановлено после перезагрузки.',
			COMMAND_DISABLE: (type, name) => `+ Успешно деактивировано ${type}: ${name}`,
			COMMAND_DISABLE_DESCRIPTION: 'Деактивирует или временно деактивирует команду/ингибитор/монитор/финализатор/событие. Состояние по умолчанию будет восстановлено после перезагрузки.',
			COMMAND_DISABLE_WARN: 'Скорее всего вам не стоит деактивировать это, так как вы не сможете использовать какую-либо команду, чтобы активировать это снова.',
			COMMAND_CONF_NOKEY: 'Вы должны предоставить ключ',
			COMMAND_CONF_NOVALUE: 'Вы должны предоставить значение',
			COMMAND_CONF_GUARDED: (name) => `${util.toTitleCase(name)} не может быть деактивирован.`,
			COMMAND_CONF_UPDATED: (key, response) => `Ключ **${key}** успешно обновлён: \`${response}\``,
			COMMAND_CONF_KEY_NOT_ARRAY: 'Ключ не является массивом, используйте действие \'reset\'.',
			COMMAND_CONF_GET_NOEXT: (key) => `Ключ **${key}** не существует.`,
			COMMAND_CONF_GET: (key, value) => `Значение для ключа **${key}**: \`${value}\``,
			COMMAND_CONF_RESET: (key, response) => `Ключ **${key}** был сброшен: \`${response}\``,
			COMMAND_CONF_NOCHANGE: (key) => `Значение для ключа **${key}** уже является таким.`,
			COMMAND_CONF_SERVER_DESCRIPTION: 'Определяет настройки для сервера.',
			COMMAND_CONF_SERVER: (key, list) => `**Настройки сервера${key}**\n${list}`,
			COMMAND_CONF_USER_DESCRIPTION: 'Определяет настройки пользователя.',
			COMMAND_CONF_USER: (key, list) => `**Настройки пользователя${key}**\n${list}`,
			COMMAND_STATS: (memUsage, uptime, users, guilds, channels, klasaVersion, discordVersion, processVersion, message) => [
				'= СТАТИСТИКА =',
				'',
				`• Использование памяти :: ${memUsage} МБ`,
				`• Время работы         :: ${uptime}`,
				`• Кол-во пользователей :: ${users}`,
				`• Кол-во серверов      :: ${guilds}`,
				`• Кол-во каналов       :: ${channels}`,
				`• Klasa                :: v${klasaVersion}`,
				`• Discord.js           :: v${discordVersion}`,
				`• Node.js              :: ${processVersion}`,
				`• Shard                :: ${(message.guild ? message.guild.shardID : 0) + 1} / ${this.client.options.totalShardCount}`
			],
			COMMAND_STATS_DESCRIPTION: 'Отображает статистику бота.',
			MESSAGE_PROMPT_TIMEOUT: 'Время запроса истекло.',
			TEXT_PROMPT_ABORT_OPTIONS: ['отмена']
		};
	}

	async init() {
		await super.init();
	}

	pluralize(num, s0, s1, s2) {
		if (num % 10 === 1 && num % 100 !== 11) {
			return s0;
		} else if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) {
			return s1;
		} else {
			return s2;
		}
	}

};
