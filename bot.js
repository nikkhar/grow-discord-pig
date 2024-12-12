const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const pigs = {};

//data bout pigs will store in pigsData.json
const PIGS_DATA_FILE = './pigsData.json';


function savePigsData() {
    if (fs.existsSync(PIGS_DATA_FILE)) {
        const backupFilePath = PIGS_DATA_FILE + '.bak';
        fs.copyFileSync(PIGS_DATA_FILE, backupFilePath);
        console.log('Backup of pigs data created.');
    }

    fs.writeFileSync(PIGS_DATA_FILE, JSON.stringify(pigs, null, 2), 'utf8');
    console.log('Pigs data saved successfully.');
}

function loadPigsData() {
    if (fs.existsSync(PIGS_DATA_FILE)) {
        const data = fs.readFileSync(PIGS_DATA_FILE, 'utf8');
        if (data) {
            return JSON.parse(data);
        } else {
            console.log('Pigs data file was empty. Starting with an empty object.');
        }
    }
    return {};
}

client.once('ready', () => {
    console.log('Ready!');
    Object.assign(pigs, loadPigsData());
});

client.on('messageCreate', message => {
    if (!message.guild) return;

    const guildId = message.guild.id;
    if (!pigs[guildId]) pigs[guildId] = {};

    const initializePigForUser = (userId) => {
        if (!pigs[guildId][userId]) {
            pigs[guildId][userId] = { name: `${message.author.username}`, weight: 10 };
        }
    };

    if (message.content === '!ping') {
        message.channel.send('Pong!');
    }

    if (message.content.startsWith('!name')) {
        const args = message.content.split(' ').slice(1);
        const newName = args.join(' ');
        initializePigForUser(message.author.id);
        pigs[guildId][message.author.id].name = newName;
        message.channel.send(`Your pig is now named **${newName}**`);
        savePigsData();
    }

    if (message.content.startsWith('!grow')) {
        initializePigForUser(message.author.id);
        let weightChange = Math.floor(Math.random() * 47) - 23;
        let currentWeight = pigs[guildId][message.author.id].weight;
    
        let newWeight = currentWeight + weightChange;
        let responseMessage = `Your pig **${pigs[guildId][message.author.id].name}** `;
    
        if (newWeight < 0) {
            newWeight = 0;
            responseMessage += `has reached zero weight. Your pig **${pigs[guildId][message.author.id].name}** weighs 0 kg.`;
        } else {
            if (weightChange > 0) {
                responseMessage += `gained ${weightChange} kg. `;
            } else if (weightChange < 0) {
                responseMessage += `lost ${Math.abs(weightChange)} kg. `;
            } else {
                responseMessage += `remains the same weight. `;
            }
            responseMessage += `Your pig **${pigs[guildId][message.author.id].name}** now weighs ${newWeight}kg`;
        }
    
        pigs[guildId][message.author.id].weight = newWeight;
        savePigsData();
        message.channel.send(responseMessage);
    }

    if (message.content === '!top') {
        const guildPigs = Object.entries(pigs[guildId] || {})
                                 .sort((a, b) => b[1].weight - a[1].weight)
                                 .map(([id, { name, weight }], index) => `${index + 1}. ${name} - ${weight} kg`)
                                 .slice(0, 5); 
        message.channel.send(`🐷 Top-5 heavyweight pigs 🐷\n\n${guildPigs.join('\n')}`);
    }

    if (message.content === '!help') {
        const helpMessage = `🐷 **Available commands:** 🐷
        \`!name [name]\`: Sets the name for your pig.
        \`!grow\`: Changes the weight of your pig by a random amount.
        \`!top\`: Shows the Top-5 pigs by weight.`;
        message.channel.send(helpMessage);
    }
});


client.login(process.env.DISCORD_BOT_TOKEN);
