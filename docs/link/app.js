const container = document.getElementById('container');

const urlParams = new URLSearchParams(window.location.search);

const hasDiscordCode = urlParams.has("code");

const CLIENT_ID = "1215770435887698042"
const scope = "identify+connections";
const redirect = "https://discord.extensio.xyz/link";
const API_URL = "https://discord.com/api/v10";
const SUBMIT_URL = "http://strawberry.fps.ms:10994";

async function generatePKCE() {
    const code_verifier = [...Array(64)]
        .map(() => Math.random().toString(36)[2])
        .join("");

    localStorage.setItem("code_verifier", code_verifier);

    const encoder = new TextEncoder();
    const data = encoder.encode(code_verifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const code_challenge = btoa(String.fromCharCode(...hashArray))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    return code_challenge;
}

async function redirectToDiscord() {
    const code_challenge = await generatePKCE();

    const discordAuthURL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&scope=${scope}&code_challenge=${code_challenge}&code_challenge_method=S256`;

    window.location.href = discordAuthURL;
}

const github_login_page = () => {
    container.innerHTML = `
        <h1>Github not linked!</h1>
        <p>Github is not linked to your discord account! In order to recieve the contributor role, link GitHub to your account.</p>
    `;
}

async function main() {
    if (!hasDiscordCode) {
        container.innerHTML = `
            <h1>Sign in with discord</h1>
            <p>Click the button below to log in with discord</p>
            <button onclick="redirectToDiscord()">Link Discord</button>
        `;
        return;
    } else {
        if (!!window.localStorage.getItem("loggedIn")) {
            window.localStorage.clear();
            window.location.href = "/link";
            return;
        }
        const code = urlParams.get("code");
        const code_verifier = localStorage.getItem("code_verifier");
        if (!code_verifier) {
            console.error("No PKCE code_verifier found.");
            return;
        }
        const r = await fetch(`${SUBMIT_URL}/${code}/${code_verifier}/roles_check`);

        window.localStorage. setItem("loggedIn", "true");
        if (r.status === 403) {
            container.innerHTML = `
                <h1>Not a contributor</h1>
                <p>You are not a contributor! Keep in mind, it may take up to one (1) hour for our cache to refresh.</p>
            `;
        } else if (r.status === 400) {
            github_login_page();
        } else {
            container.innerHTML = `
                <h1>Contributer role granted!</h1>
                <p>You have been given the contributer role!</p>
            `;
        }
    }
}

main();
