const crypto = require('crypto');
const DiscordRPC = require('discord-rpc');

const clientId = '1161295534770892860';
const sessionId = crypto.randomBytes(20).toString('hex');

DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
rpc.login({ clientId }).catch(console.error);

module.exports = { rpc, sessionId };
