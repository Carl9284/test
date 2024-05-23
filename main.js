require('dotenv/config');

const shortid = require('shortid');
const express = require('express');
const nlp = require('compromise');

//Version 1.5

const CronJob = require('cron').CronJob;

const { cheesecakeVal, motivationalQuote, lateGif } = require('./model/model.js')
const { TEST_COMMAND, CALCULATE, ADD_TODO, REM_TODO, PREP_PLAN, PREP_UPDATE } = require('./commands/commands.js')
const { InteractionType, InteractionResponseType, InteractionResponseFlags, MessageComponentTypes, ButtonStyleTypes } = require('discord-interactions');
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

var admin = require("firebase-admin");

const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseUrl: "https://uncletetsu-todos.firebaseio.com",
});

const DB = admin.firestore();

let isFirstCall = true

function VerifyDiscordRequest(clientKey) {
    return function (req, res, buf, encoding) {
        const signature = req.get('X-Signature-Ed25519');
        const timestamp = req.get('X-Signature-Timestamp');

        const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
        if (!isValidRequest) {
            res.status(401).send('Bad request signature');
            throw new Error('Bad request signature');
        }
    };
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

// Create an express app
const app = express();


const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});



let currentplan = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '']
let savedBtnStyle = [ButtonStyle.Danger, ButtonStyle.Danger, ButtonStyle.Danger, ButtonStyle.Danger, ButtonStyle.Danger]


let helpEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('MANUAL')
    .setDescription('Below are the list of commands and how to use them')
    .setTimestamp()
    .setFooter({ text: `Updated since` });

let orderCalculatorEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('ORDER CALCULATOR')
    .setDescription('These are estimated numbers of what we need to order')
    .setTimestamp()
    .setFooter({ text: `Updated since` });

let calcHelpEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('ORDER CALCULATOR GUIDE')
    .setDescription('These will help you understand how to use this command')
    .setTimestamp()
    .setFooter({ text: `Updated since` });


let exampleEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('TODOS')
    .setDescription('Here are the list of todos')
    .setTimestamp()
    .setFooter({ text: `Updated since` });

let prepEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('PREP PLAN')
    .setDescription('Here are the list of todos')
    .setTimestamp()
    .setFooter({ text: `Updated since` });


let reminderLayout = new EmbedBuilder()
    .setColor(0xff7700)
    .setFooter({ text: `Cheesecake` });

function createRow(style) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('btn_flr')
                .setLabel('Flour')
                .setStyle(style[0]),
            new ButtonBuilder()
                .setCustomId('btn_sgr')
                .setLabel('Sugar')
                .setStyle(style[1]),
            new ButtonBuilder()
                .setCustomId('btn_cheese')
                .setLabel('Cheese')
                .setStyle(style[2]),
            new ButtonBuilder()
                .setCustomId('btn_butter')
                .setLabel('Butter')
                .setStyle(style[3]),
            new ButtonBuilder()
                .setCustomId('btn_done')
                .setLabel('Everything Done')
                .setStyle(style[4])
        );

    return row;
}



//Function to flip the style of the button
function showButton(interaction, collector) {
    //Link
    //https://www.appsloveworld.com/nodejs/100/133/discord-js-how-to-change-style-of-button

    collector.on('collect', async i => {
        //loop through each action row on the embed and update it accordingly

        let newActionRowEmbeds = i.message.components.map(oldActionRow => {

            //create a new action row to add the new data
            updatedActionRow = new ActionRowBuilder();

            // Loop through old action row components (which are buttons in this case)
            updatedActionRow.addComponents(oldActionRow.components.map(buttonComponent => {

                //create a new button from the old button, to change it if necessary
                newButton = ButtonBuilder.from(buttonComponent)

                //if this was the button that was clicked, this is the one to change!
                if (i.component.customId == buttonComponent.customId) {

                    //If the button was a primary button then change to secondary, or vise versa
                    if (newButton.data.custom_id != 'btn_done') {
                        if (buttonComponent.style == ButtonStyle.Danger) {
                            newButton.setStyle(ButtonStyle.Success)
                            // console.log(newButton.data.style)

                        }
                        else if (buttonComponent.style == ButtonStyle.Success) {
                            newButton.setStyle(ButtonStyle.Danger)
                            // console.log(newButton.data.style)
                        }
                    } else {
                        if (buttonComponent.style == ButtonStyle.Danger) {
                            newButton.setStyle(ButtonStyle.Primary)
                            // console.log(newButton.data.style)

                        }
                        else if (buttonComponent.style == ButtonStyle.Primary) {
                            newButton.setStyle(ButtonStyle.Danger)
                            // console.log(newButton.data.style)
                        }
                    }



                    switch (newButton.data.custom_id) {
                        case 'btn_flr':
                            savedBtnStyle[0] = newButton.data.style == 3 ? ButtonStyle.Success : ButtonStyle.Danger;
                            break;
                        case 'btn_sgr':
                            savedBtnStyle[1] = newButton.data.style == 3 ? ButtonStyle.Success : ButtonStyle.Danger;
                            break;
                        case 'btn_cheese':
                            savedBtnStyle[2] = newButton.data.style == 3 ? ButtonStyle.Success : ButtonStyle.Danger;
                            break;
                        case 'btn_butter':
                            savedBtnStyle[3] = newButton.data.style == 3 ? ButtonStyle.Success : ButtonStyle.Danger;
                            break;
                        case 'btn_done':
                            savedBtnStyle[4] = newButton.data.style == 1 ? ButtonStyle.Primary : ButtonStyle.Danger;
                            break;
                        default:
                            break;
                    }
                }
                return newButton
            }));
            return updatedActionRow
        });

        // console.log('In function')
        // and then finally update the message
        await i.update({ components: newActionRowEmbeds })

    });

}


client.on('ready', () => {
    console.log(`${client.user.tag} has logged in!`)


    /**
     * Job1 = Agropur - Milk And Butter
     * Due: Mondays 2:30PM
     */

    /**
    * Job2 = Agropur - Milk And Butter
    * Due: Thursdays 2:30PM
    */

    /**
    * Job3 = Farines - Cheese, yolk, sugar, etc.
    * Due: Tuesdays 2PM
    */

    /**
     * Job4 = Costco - EggWhite and Honey
     * Tuesdays
     */

    /**
     * Job5 = Request tart cups number
     * Mondays
     */




    //Send a message reminder 
    /**
     * 19 12 * * 3
     * 
     * 19 12 = 12:19PM 
     * 3 = Wednesday
     */
    const job1 = new CronJob('0 10 * * 1,2,4', () => {
        const today = new Date();
        const dayOfWeek = today.getDay();

        switch (dayOfWeek) {
            case 1:
                sendReminder("job1");
                break;
            case 2:
                sendReminder("job2");
                break;
            case 4:
                sendReminder("job3");
                break;
            default:
                break
        }
    }, null, true, 'America/New_York');



    job1.start();


})

client.on("guildMemberAdd", (member) => {
    member.guild.channels.cache.get("1073493664799658029").send(`Hi <@${member.id}>. Welcome to uncle tetsu discord server! Check out our ${member.guild.channels.cache.get("1073493664799658025").toString()} and ${member.guild.channels.cache.get("1073496059701112873").toString()} to see some important instructions`)
})



client.on('messageCreate', async message => {
    let emojis = ['👍', '🤝', '🙌', '👌', '👏', '🥳'];


    if (message.channelId === '1077280880055304333') {
        console.log(message.attachments.size > 0)
        if (message.attachments.size > 0) {

            if (attachIsImage) {
                await message.react(emojis[Math.floor(Math.random() * emojis.length)])
            }
        }
    }


    if (message.channelId === '1102988594148286604') {

        if (message.attachments.size > 0) {
            if (attachIsImage) {
                emojis = ['1105199890193186906'].concat(emojis);
                await message.react(emojis[Math.floor(Math.random() * emojis.length)])
            }

        }
    }


    if (message.channelId === '1077281240564121641') {
        if (message.attachments.size > 0) {
            if (attachIsImage) {
                emojis = ['1107724715033886780'].concat(emojis);
                await message.react(emojis[Math.floor(Math.random() * emojis.length)])
            }
        }
    }


    if (message.content.includes('<@1077614044342653061>')) {
        message.reply(`Hi theree! ${message.author}`)

    }


    /**
     * Send a GIF regarding late notice
     * 
     * ID - Represent the channel ID
     */
    // if (message.channelId === "1073493664799658030") {
    //     if (isLateMessage(message.content.toLocaleLowerCase())) {
    //         message.reply(lateGif[Math.floor(Math.random() * lateGif.length)])
    //     }
    // }

    if (message.content.toLocaleLowerCase() == 'quote') {
        message.reply(motivationalQuote[Math.floor(Math.random() * motivationalQuote.length - 1)].quote.toString())
    }

    if (message.content === '!clear') {
        await message.channel.messages.fetch({ limit: 100 }).then(messages => {
            message.channel.bulkDelete(messages)
        })
    }

    if (message.content.toLocaleLowerCase() === 'help') {
        helpEmbed.spliceFields(0, 25)
        helpEmbed.addFields({ name: '\u200B', value: '\u200B' })
        helpEmbed.addFields({ name: '/calculate', value: 'This command helps you calculate how much ingredients you need for a specific number of cheesecake', inline: false })
        helpEmbed.addFields({ name: '/add', value: 'This command add a thing to do on a todo list', inline: false })
        helpEmbed.addFields({ name: '/remove', value: 'This command remove a thing to do on a todo list by inputting its ID', inline: false })
        helpEmbed.addFields({ name: '/prep', value: 'This command create a prep plan for a week', inline: false })
        helpEmbed.addFields({ name: '/updateprep', value: 'This command update a number on its current prep plan by choosing which thing to update', inline: false })

        helpEmbed.addFields({ name: '\u200B', value: '\u200B' })
        helpEmbed.addFields({ name: 'Off Topic', value: ' ', inline: false })
        helpEmbed.addFields({ name: 'quote', value: 'Gives you a random quote', inline: false })
        helpEmbed.addFields({ name: 'calc-help', value: 'Tells you how to use /calculate command', inline: false })
        helpEmbed.addFields({ name: 'todos', value: 'Shows a list of todos', inline: false })

        helpEmbed.addFields({ name: '\u200B', value: '\u200B' })
        message.channel.send({ embeds: [helpEmbed] })
    }


    if (message.content.toLocaleLowerCase() === 'calc-help') {

        calcHelpEmbed.addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Calculate the amount of ingredients needed for a specific number of batches', value: '\u200B' },
            { name: 'FLVR', value: 'Represents the Flavour of the cheesecake and the following code can be entered to it: (O) (C) (M) (B)' },
            { name: 'BATCHES', value: `Represents the Number of batches you'd like to calculate` },
            { name: '\u200B', value: '\u200B' },
        )


        message.channel.send({ embeds: [calcHelpEmbed] })
    }

    if (message.content.toLocaleLowerCase() === 'todos') {

        exampleEmbed.spliceFields(0, 25)

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })
        await DB.collection('todos').orderBy('date').get()
            .then(snapshot => {
                snapshot.size === 0 && exampleEmbed.addFields({ name: `Nothing todo`, value: ' ', inline: false })
                exampleEmbed.setImage(snapshot.size == 0 ? 'https://media.giphy.com/media/l41YmQjOz9qg2Ecow/giphy.gif' : 'https://media.giphy.com/media/l41Yh1olOKd1Tgbw4/giphy.gif')
                snapshot.forEach((td) => {
                    exampleEmbed.addFields({ name: `-> ` + td.data().todo, value: td.data().todoid, inline: false })
                })
            })

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })
        message.channel.send({ embeds: [exampleEmbed] })
    }




    /**
     * Message reminder weekly
     */



})



client.on('interactionCreate', async interaction => {


    exampleEmbed.spliceFields(0, 25)
    prepEmbed.spliceFields(0, 25)

    const collector = interaction.channel.createMessageComponentCollector({ time: 2147483647 });



    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'test') {
        await interaction.reply('Test working')
    }

    //Calculator
    if (interaction.commandName === 'calculate') {

        const batchNum = interaction.options.get('batches').value
        const flvr = interaction.options.get('flvr').value

        var cheeseval = cheesecakeVal[0];
        if (flvr === 'choco') cheeseval = cheesecakeVal[1];
        else if (flvr === 'matcha') cheeseval = cheesecakeVal[2];
        else if (flvr === 'berry') cheeseval = cheesecakeVal[3];

        orderCalculatorEmbed.addFields({ name: '\u200B', value: '\u200B' })
        orderCalculatorEmbed.addFields({ name: `Total Ingredients Needed For ${batchNum} batches of ${flvr} cheesecake\n`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: '\u200B', value: '\u200B' })
        orderCalculatorEmbed.addFields({ name: `Milk: ${Math.round((cheeseval[0] * batchNum) / 4000)} bags`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Cheese: ${parseInt((cheeseval[1] * batchNum / 15000))} boxes and ${Math.round(((cheeseval[1] * batchNum / 15000) % parseInt((cheeseval[1] * batchNum / 15000)) * 1000))} grams`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Butter: ${Math.round((cheeseval[2] * batchNum) / 454)} pcs or ${Math.round((cheeseval[2] * batchNum) / 454) / 25} boxes`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Egg yolk: ${Math.round(cheeseval[3] * batchNum)}`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Egg whites: ${cheeseval[4] * batchNum}`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Flour: ${cheeseval[5] * batchNum}`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: `Sugar: ${cheeseval[6] * batchNum}`, value: ' ', inline: false })
        orderCalculatorEmbed.addFields({ name: '\u200B', value: '\u200B' })
        orderCalculatorEmbed.setImage('https://media.giphy.com/media/EI386ETxYqjQaFGXAz/giphy.gif')

        await interaction.reply({ embeds: [orderCalculatorEmbed] });
    }


    //Adding to todos
    if (interaction.commandName === 'add') {

        try {
            var id = Math.floor(1000 + Math.random() * 9000);
            await DB.collection('todos').add({
                todo: interaction.options.get('todo').value,
                user: `${interaction.user.username}`,
                date: new Date(),
                todoid: id.toString()
            })



        } catch (err) {
            console.log(err)
        }

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })

        await DB.collection('todos').orderBy('date').get()
            .then(snapshot => {
                snapshot.size === 0 && exampleEmbed.addFields({ name: `Nothing todo`, value: ' ', inline: false })
                snapshot.forEach((td) => {
                    exampleEmbed.setImage('https://media.giphy.com/media/l41Yh1olOKd1Tgbw4/giphy.gif')
                    exampleEmbed.addFields({ name: `-> ` + td.data().todo, value: td.data().todoid, inline: false })
                })
            })

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })

        await interaction.reply({ embeds: [exampleEmbed] });

    }

    if (interaction.commandName === 'remove') {

        var todelete = ''
        try {

            await DB.collection('todos').where('todoid', '==', interaction.options.get('id').value).get()
                .then(snapshot => {
                    snapshot.docs.forEach(td => {
                        todelete = (' ' + td.data().todo).slice(1)
                        td.ref.delete()
                    })
                })

        } catch (err) {
            console.log(err)
        }

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })
        exampleEmbed.setImage('https://media.giphy.com/media/l41YmQjOz9qg2Ecow/giphy.gif')
        await DB.collection('todos').orderBy('date').get()
            .then(snapshot => {
                snapshot.size === 0 && exampleEmbed.addFields({ name: `Nothing todo`, value: ' ', inline: false })
                snapshot.forEach((td) => {
                    exampleEmbed.addFields({ name: `-> ` + td.data().todo, value: td.data().todoid, inline: false })
                })
            })

        exampleEmbed.addFields({ name: '\u200B', value: '\u200B' })

        await interaction.reply({ embeds: [exampleEmbed] });
    }


    if (interaction.commandName === 'updateprep') {
        collector.stop();
        // console.log(interaction.options.get('update').value)

        switch (interaction.options.get('update').value) {
            case 'occ':
                currentplan[1] = interaction.options.get('value').value
                break;
            case 'mcc':
                currentplan[2] = interaction.options.get('value').value
                break;
            case 'ccc':
                currentplan[3] = interaction.options.get('value').value
                break;
            case 'otc':
                currentplan[4] = interaction.options.get('value').value
                break;
            case 'mtc':
                currentplan[5] = interaction.options.get('value').value
                break;
            case 'ctc':
                currentplan[6] = interaction.options.get('value').value
                break;
            case 'ocb':
                currentplan[8] = interaction.options.get('value').value
                break;
            case 'mcb':
                currentplan[9] = interaction.options.get('value').value
                break;
            case 'ccb':
                currentplan[10] = interaction.options.get('value').value
                break;
            case 'mb':
                currentplan[11] = interaction.options.get('value').value
                break;
            case 'nt':
                currentplan[12] = interaction.options.get('value').value
                break;
            default:
                break;
        }

        const totalCheese = ((currentplan[1] * 1100) + (currentplan[2] * 1000) + (currentplan[3] * 800))
        const totalButter = ((currentplan[8] * 500) + (currentplan[9] * 500) + (currentplan[10] * 200) + (currentplan[11] * 625))

        currentplan[0] = Math.round((totalCheese) / 15000).toString()
        currentplan[7] = Math.round(((totalButter) / 454) / 25).toString()

        // console.log(currentplan)

        prepEmbed.addFields(
            { name: '\u200B', value: '\u200B' },
            { name: `Cheese Box`, value: currentplan[0].toString(), inline: false },
        )

        currentplan[1] != 0 && prepEmbed.addFields({ name: `Original Cheese`, value: currentplan[1], inline: true })
        currentplan[2] != 0 && prepEmbed.addFields({ name: `Matcha Cheese`, value: currentplan[2], inline: true })
        currentplan[3] != 0 && prepEmbed.addFields({ name: `Choco Cheese`, value: currentplan[3], inline: true })
        currentplan[4] != 0 && prepEmbed.addFields({ name: `Original Tart Cheese`, value: currentplan[4], inline: true })
        currentplan[5] != 0 && prepEmbed.addFields({ name: `Matcha Tart Cheese`, value: currentplan[5], inline: true })
        currentplan[6] != 0 && prepEmbed.addFields({ name: `Choco Tart Cheese`, value: currentplan[6], inline: true })
        prepEmbed.addFields({ name: '\u200B', value: ' ' })
        prepEmbed.addFields({ name: `Butter Box`, value: currentplan[7].toString(), inline: false },)
        currentplan[8] != 0 && prepEmbed.addFields({ name: `Original Butter`, value: currentplan[8], inline: true })
        currentplan[9] != 0 && prepEmbed.addFields({ name: `Matcha Buter`, value: currentplan[9], inline: true })
        currentplan[10] != 0 && prepEmbed.addFields({ name: `Choco Butter`, value: currentplan[10], inline: true })
        prepEmbed.addFields({ name: '\u200B', value: ' ' })
        currentplan[11] != 0 && prepEmbed.addFields({ name: `Madeleine Butter`, value: currentplan[11], inline: true })

        prepEmbed.addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Special Notes', value: `${currentplan[12]}` },
            { name: '\u200B', value: '\u200B' },
            { name: '\u200B', value: `Click the button under if it's done\n\nRED: Not Done\nGREEN: Done` },
            { name: '\u200B', value: '\u200B' })

        prepEmbed.addFields({ name: `**PLEASE USE /updateprep TO UPDATE CERTAIN NUMBERS**`, value: ' ' })

        showButton(interaction, collector)

        const row = createRow(savedBtnStyle)

        const message = await interaction.reply({ embeds: [prepEmbed], fetchReply: true, components: [row] });

        // let isDone = false

        // currentplan.forEach(p => {
        //     if (p == 0) isDone = true
        //     else isDone = false
        // })

        // console.log(1)

        return;
    }

    //prep oc-cheese:20 mc-cheese:10 cc-cheese:10 ot-cheese:5 mt-cheese:5 ct-cheese:5 oc-butter:20 mc-butter:20 cc-butter:20 m-butter:20

    if (interaction.commandName === 'prep') {
        //Change the numnbers based on actual amount - These numbers must reflect the actual -> 1100 1000 800 -> 500 500 200

        if (isFirstCall == false) collector.stop();


        const totalCheese = ((interaction.options.get('oc-cheese').value * 1100) + (interaction.options.get('mc-cheese').value * 1000) + (interaction.options.get('cc-cheese').value * 800))
        const totalButter = ((interaction.options.get('oc-butter').value * 500) + (interaction.options.get('mc-butter').value * 500) + (interaction.options.get('cc-butter').value * 200) + (interaction.options.get('m-butter').value * 625))
        currentplan[0] = Math.round((totalCheese) / 15000).toString()

        currentplan[1] = interaction.options.get('oc-cheese').value
        currentplan[2] = interaction.options.get('mc-cheese').value
        currentplan[3] = interaction.options.get('cc-cheese').value
        currentplan[4] = interaction.options.get('ot-cheese').value
        currentplan[5] = interaction.options.get('mt-cheese').value
        currentplan[6] = interaction.options.get('ct-cheese').value
        currentplan[7] = Math.round(((totalButter) / 454) / 25).toString()
        currentplan[8] = interaction.options.get('oc-butter').value
        currentplan[9] = interaction.options.get('mc-butter').value
        currentplan[10] = interaction.options.get('cc-butter').value
        currentplan[11] = interaction.options.get('m-butter').value
        currentplan[12] = interaction.options.get('notes').value



        prepEmbed.addFields(
            { name: '\u200B', value: '\u200B' },
            { name: `Cheese Box`, value: currentplan[0].toString(), inline: false },
        )

        currentplan[1] != 0 && prepEmbed.addFields({ name: `Original Cheese`, value: currentplan[1], inline: true })
        currentplan[2] != 0 && prepEmbed.addFields({ name: `Matcha Cheese`, value: currentplan[2], inline: true })
        currentplan[3] != 0 && prepEmbed.addFields({ name: `Choco Cheese`, value: currentplan[3], inline: true })
        currentplan[4] != 0 && prepEmbed.addFields({ name: `Original Tart Cheese`, value: currentplan[4], inline: true })
        currentplan[5] != 0 && prepEmbed.addFields({ name: `Matcha Tart Cheese`, value: currentplan[5], inline: true })
        currentplan[6] != 0 && prepEmbed.addFields({ name: `Choco Tart Cheese`, value: currentplan[6], inline: true })
        prepEmbed.addFields({ name: '\u200B', value: ' ' })
        prepEmbed.addFields({ name: `Butter Box`, value: currentplan[7].toString(), inline: false },)
        currentplan[8] != 0 && prepEmbed.addFields({ name: `Original Butter`, value: currentplan[8], inline: true })
        currentplan[9] != 0 && prepEmbed.addFields({ name: `Matcha Buter`, value: currentplan[9], inline: true })
        currentplan[10] != 0 && prepEmbed.addFields({ name: `Choco Butter`, value: currentplan[10], inline: true })
        prepEmbed.addFields({ name: '\u200B', value: ' ' })
        currentplan[11] != 0 && prepEmbed.addFields({ name: `Madeleine Butter`, value: currentplan[11], inline: true })



        prepEmbed.addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Special Notes', value: `${currentplan[12]}` },
            { name: '\u200B', value: '\u200B' },
            { name: '\u200B', value: `Click the button under if it's done\n\nRED: Not Done\nGREEN: Done` },
            { name: '\u200B', value: '\u200B' })
        prepEmbed.addFields({ name: `**PLEASE USE /updateprep TO UPDATE CERTAIN NUMBERS**`, value: ' ' })

        showButton(interaction, collector)


        const row = createRow(savedBtnStyle)


        const message = await interaction.reply({ embeds: [prepEmbed], fetchReply: true, components: [row] });

        isFirstCall = false

        return;

    }
});


const main = {
    commands: [
        CALCULATE,
        TEST_COMMAND,
        ADD_TODO,
        REM_TODO,
        PREP_PLAN,
        PREP_UPDATE
    ],
    init: async () => {
        try {
            console.log('Refreshing application (/) commands');
            await rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID), {
                body: main.commands
            })
            client.login(process.env.DISCORD_TOKEN);

        } catch (err) {
            console.log(err)
        }
    }


}


function isLateMessage(sentence) {
    const doc = nlp(sentence);

    const keyWords = [
        'be late', 'be there', 'run late', 'delayed', 'running behind', 'behind schedule', 'tardy', 'late', 'overdue', 'behind time',
        'not on time', 'not punctual', 'not arriving on time', 'not making it on time', 'not meeting the deadline',
        'right now', 'on my way', 'omw', 'almost there', 'arriving shortly', 'en route'
    ];

    // Check for keywords indicating either lateness or imminent arrival
    if (keyWords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        return true;
    }

    // Check for phrases indicating an estimated arrival time
    const estimatedTime = doc.match('#Value #Duration');
    if (estimatedTime.found) {
        return true;
    }

    return false;
}

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
    const extension = url.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
}


/**
 * Send a weekly reminder
 */

/**
 * Job1 = Agropur - Milk And Butter
 * Due: Mondays 2:30PM
 */

/**
* Job2 = Agropur - Milk And Butter
* Due: Thursdays 2:30PM
*/

/**
* Job3 = Farines - Cheese, yolk, sugar, etc.
* Due: Tuesdays 2PM
*/

/**
 * Job4 = Costco - EggWhite and Honey
 * Tuesdays
 */

/**
 * Job5 = Request tart cups number
 * Mondays
 */
const sendReminder = (job) => {

    let day = ''
    let msgTitle = []
    let msgValue = []

    switch (job) {
        case 'job1':
            day = "Monday"
            msgTitle.push("Agropur: Milk and Butter")
            msgTitle.push("Montreal Request: Tart Cups")
            msgTitle.push("Agropur: Tart Cheese")
            msgValue.push("Order Before 2:30PM")
            msgValue.push("Send Request by the end of Today")
            msgValue.push("Order Before 2:00PM")
            break;
        case 'job2':
            day = "Tuesday"
            msgTitle.push("Farinex: Cheese, Yolk, Sugar, and more...")
            msgTitle.push("Costco: Egg Whites and Honey")
            msgValue.push("Order Before 2:00PM")
            msgValue.push("Reminder to Order")
            break;
        case 'job3':
            day = "Thursday"
            msgTitle.push("Agropur: Milk and Butter")
            msgValue.push("Order Before 2:30PM")
            break;
        default:
            break;
    }


    reminderLayout.spliceFields(0, 25)


    client.channels.fetch('1073511379765567528').then((channel) => {

        reminderLayout.setTitle(day + " reminder")
        reminderLayout.addFields({ name: '\u200B', value: ' ' })

        msgTitle.forEach((val, i) => {
            reminderLayout.addFields({ name: `${val}`, value: `${msgValue[i]}` })
            reminderLayout.addFields({ name: '\u200B', value: ' ' })
        })

        channel.send({ content: "Good Morning <@&1096137274770587658>", embeds: [reminderLayout] })
    })
}






main.init()

