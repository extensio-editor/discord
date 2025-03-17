const { Client, Events, EmbedBuilder, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const token = process.env.TOKEN;

const express = require("express");
const app = express();
const axios = require("axios");

let cache = { lastFetched: new Date(0), data: {} };

// Repos to count the user as 'contributor'
const repos = {
    'extensio': "1214265791877488640",
    'docs': "1351212691825496107",
    'website': "1214265890883768360",
    'extension_repository': "1214265836639100990"
}

const client = new Client({ intents: [ GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds ] });

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

app.get("/:discordCode/:code_verifier/roles_check", async (req, res) => {
    const data = new URLSearchParams({
        client_id: "1215770435887698042",
        grant_type: "authorization_code",
        code: req.params.discordCode,
        redirect_uri: "http://discord.extensio.xyz/link",
        code_verifier: req.params.code_verifier,
    });

    const res_ = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res_.ok) {
        res.status(500).send("Failed to get token");
        return;
    }

    const json = await res_.json();
    const discord_token = json.access_token;

    const identify_res = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${discord_token}` },
    });
    const identify_json = await identify_res.json();

    const connections_res = await fetch("https://discord.com/api/v10/users/@me/connections", {
        headers: { Authorization: `Bearer ${discord_token}` },
    });
    const connections_json = await connections_res.json();

    const github_connection = connections_json.find((c) => c.type === "github");

    if (!github_connection) {
        res.status(400).send("Github not linked");
        return;
    }

    const githubId = github_connection.id;
    const discordId = identify_json.id;

    if ((new Date() - cache.lastFetched) > 60 * 60 * 1000) {
        for (const [key, value] of Object.entries(repos)) {
            const data = await axios.get(`https://api.github.com/repos/extensio-editor/${key}/contributors`);
            const contributors = data.data.map((contributor) => contributor.id);
            cache.data[key] = contributors.map(x => x.toString());
        }
    }

    let isContributor = false;
    for (const [repo, contributors] of Object.entries(cache.data)) {
        if (contributors.includes(githubId)) {
            isContributor = true;
            const guild = client.guilds.cache.get("1214250202106564618");
            const member = await guild.members.fetch(discordId);
            if (!member) {
                console.warn("Member not found");
                res.status(404).send("Member not found");
                return;
            }
            member.roles.add(repos[repo]);
        }
    }

    if (isContributor) {
        const guild = client.guilds.cache.get("1214250202106564618");
        const member = await guild.members.fetch(discordId);
        if (!member) {
            console.warn("Member not found");
            res.status(404).send("Member not found");
            return;
        }
        member.roles.add("1214265928905396345");

        res.sendStatus(200);
    } else {
        res.status(403).send("User is not a contributor");
    }
});

app.listen(process.env.BOT_SERVER_PORT, () => {
    console.log(`Server is running on port ${process.env.BOT_SERVER_PORT}`);
    client.login(token);
});

