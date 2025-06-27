const path = require('path');
const { TikTokLiveConnection } = require('tiktok-live-connector');
const { Client, GatewayIntentBits,REST, Routes, EmbedBuilder } = require('discord.js');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const client = new TikTokLiveConnection('iknowbando', {
    authenticateWs: false,  
});
const token = "UR_BOT_TOKEN"
const commands = [
  {
    name: 'tiktok_poll',
    description: 'Replies with Pong!',
    options: [
      { name: 'time', type: 4, description: 'Time Untill Poll Closes In Minutes!', required: true },
      { name: 'choice1', type: 3, description: 'choice 1', required: true },
      { name: 'choice2', type: 3, description: 'choice 2', required: true },
      { name: 'choice3', type: 3, description: 'choice 3', required: false },
      { name: 'choice4', type: 3, description: 'choice 4', required: false },
      { name: 'choice5', type: 3, description: 'choice 5', required: false },
    ]
  },
  // Add more commands here
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {

  try {
    await client.connect();
    console.log('Started refreshing global application (slash) commands.');

    await rest.put(
      Routes.applicationCommands("UR_APPLICATION_ID"),  // Notice no guildId here
      { body: commands }
    );

    console.log('Successfully reloaded global application (slash) commands.');
  } catch (error) {
    console.error(error);
  }
})();
bot.login(token);
function updateFieldValue(fields, targetLabel, newValue) {
  return fields.map(f => {
    if (f.name === targetLabel) {
      return {
        name: f.name,
        value: newValue,
        inline: true
      };
    }
    return f;
  });
}

(async () => {
  try {
    let voteCounts = {};
    let choices = [];
    let choices_poll = [];
    let embed;
    let replyMessage;

    function isExactWordInMessage(word, message) {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  return pattern.test(message);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function onChatListener(data) {
  const msg = data.comment.toLowerCase();

  for (const choice of choices_poll) {
    if (!choice) continue;

    // Match full word exactly
    if (isExactWordInMessage(choice.toLowerCase(), msg)) {
      voteCounts[choice.toLowerCase()] += 1;

      const foundChoice = choices.find(
        c => c.value.toLowerCase() === choice.toLowerCase()
      );

      if (foundChoice) {
        const currentFields = embed.data.fields || [];

        const updatedFields = currentFields.map(f => {
          if (f.name === foundChoice.label) {
            return {
              name: f.name,
              value: `${foundChoice.value}: ${voteCounts[choice.toLowerCase()]}`,
              inline: true
            };
          }
          return f;
        });

        embed.setFields(updatedFields);
        if (replyMessage) {
          await replyMessage.edit({ embeds: [embed] });
        }
      }
    }
  }
}

      
    

    bot.once('ready', () => {
      console.log(`Logged in as ${bot.user.tag}!`);
    });

    bot.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;
      if (interaction.commandName !== 'tiktok_poll') return;

      const time = interaction.options.getInteger('time');
      const choice1 = interaction.options.getString('choice1')
      const choice2 = interaction.options.getString('choice2');
      const choice3 = interaction.options.getString('choice3');
      const choice4 = interaction.options.getString('choice4');
      const choice5 = interaction.options.getString('choice5');

      const choice1Value = "";
      const choice2Value = "";
      const choice3Value = "";
      const choice4Value = "";
      const choice5Value = "";

      choices = [
        { label: 'Choice 1', value: choice1, extra: choice1Value },
        { label: 'Choice 2', value: choice2, extra: choice2Value },
        { label: 'Choice 3', value: choice3, extra: choice3Value },
        { label: 'Choice 4', value: choice4, extra: choice4Value },
        { label: 'Choice 5', value: choice5, extra: choice5Value },
      ].filter(c => c.value);

      voteCounts = {};
      for (const choice of choices) {
        voteCounts[choice.value.toLowerCase()] = 0;
      }

      choices_poll = choices.map(c => c.value);

      embed = new EmbedBuilder()
        .setColor(0x00AEFF)
        .setTitle('🗳️ TikTok Poll')
        .setDescription('Vote by typing in the TikTok chat!')
        .setFooter({ text: 'Poll running...' })
        .setTimestamp();

      const fields = [{ name: 'Time', value: `${time} minute(s)`, inline: false }];
      for (const choice of choices) {
        fields.push({
          name: choice.label,
          value: choice.value,
          inline: true,
        });
      }

      embed.addFields(...fields);

      replyMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

      if (time < 0)
      {
        embed.setFooter({ text: 'Poll closed ⏱️' });
        embed.setColor(0x00FF00);
        if (replyMessage) replyMessage.edit({ embeds: [embed] });
        console.log('Stopped listening to chat!');
        return
      }
        client.on('chat', onChatListener);
      let remainingTime = time; 
      const interval = setInterval(async () => {
        if (remainingTime <= 0) {
            clearInterval(interval);
            console.log("Poll ended!");
            return;
        }
        remainingTime--; 

        const updatedFields = updateFieldValue(
            embed.data.fields || [],
            'Time',
            `${remainingTime} minute(s)`
        );

        embed.setFields(updatedFields);

        if (replyMessage) {
            await replyMessage.edit({ embeds: [embed] });
        }

        console.log(`Editing Time! ${remainingTime} minute(s) remaining`);
         // decrement AFTER editing so countdown is correct
        }, 60 * 1000);  // run every minute
      setTimeout(() => {
        client.removeListener('chat', onChatListener);
        embed.setFooter({ text: 'Poll closed ⏱️' });
        embed.setColor(0x00FF00);
        if (replyMessage) replyMessage.edit({ embeds: [embed] });
        console.log('Stopped listening to chat!');
      }, time * 60 * 1000);
    });
  } catch (err) {
    console.error(err);
  }
})();
