const { Client, Events, EmbedBuilder } = require("discord.js");
require("dotenv").config();
const token = process.env.TOKEN;

const client = new Client({ intents: [] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("guildMemberAdd", (member) => {
    const welcomeEmbed = new EmbedBuilder()
        .setColor("#c3c2cb")
        .setTitle(`Welcome ${member.user.globalName}!`)
        .setDescription("Welcome to the Extensio discord server!\nMake sure to check out our links in <#1214250203096289292>!")
        .setTimestamp()
        .addFields({ "name": "If you're a contributor", "value": "Link your github account on https://discord.extensio.xyz/link to get the contributor role" });
    member.guild.channels.cache.get("1351154982690230362").send({ embeds: [welcomeEmbed] });
});

client.login(token);
