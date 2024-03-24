import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';

export function VerifyDiscordRequest(clientKey) {
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

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent':
        'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function getServerMembers(guildId, limit) {
  const endpoint = `guilds/${guildId}/members?limit=${limit}`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const parsedRes = await res.json();
    return parsedRes.map((member) => member.user.id);
  } catch (err) {
    return console.error(err);
  }
}

/**
 * Get SkyHanni patterns from the SkyHanni repository
 * @param {string} key - The key of the pattern to get
 * @returns {Promise<Map<key, pattern>} - A map of patterns
 * 
 * 
  {
    'data.hypixeldata.serverid.tablist' => ' Server: §r§8(?<serverid>\\S+)',
    'misc.compacttablist.advanced.level' => '.*\\[(?<level>.*)] §r(?<name>.*)',
    'features.gui.customscoreboard.tablist.gems' => '^\\s*Gems: §a(?<gems>\\d*,?(\\.\\d+)?[a-zA-Z]?)$',
    'features.gui.customscoreboard.tablist.bank' => '^\\s*Bank: §6(?<bank>[\\w.,]+(?:§7 \\/ §6(?<coop>[\\w.,]+))?)$',
    'features.gui.customscoreboard.tablist.mithrilpowder' => '^\\s*Mithril Powder: (?:§.)+(?<mithrilpowder>[\\d,\\.]+)$',
  }
 */
export async function getSkyHanniPatterns(key) {
  const patterns = await getSkyHanniPatternsRepo();
  const filteredPatterns = new Map();
  for (const [patternKey, patternValue] of Object.entries(patterns)) {
    if (patternKey.includes(key)) {
      filteredPatterns.set(patternKey, patternValue);
    }
  }
  return filteredPatterns;
}

/**
 * @returns {Promise<Map<key, pattern>} - A map of patterns
 * 
 * 
 * Example of the JSON response:
  {
    'data.hypixeldata.serverid.scoreboard': '§7\\d+/\\d+/\\d+ §8(?<servertype>[mM])(?<serverid>\\S+)',
    'data.hypixeldata.serverid.tablist': ' Server: §r§8(?<serverid>\\S+)',
    'data.hypixeldata.lobbytype': '(?<lobbyType>.*lobby)\\d+',
    'data.hypixeldata.playeramount': '^\\s*(?:§.)+Players (?:§.)+\\((?<amount>\\d+)\\)\\s*$',
    'data.hypixeldata.playeramount.coop': '^\\s*(?:§.)*Coop (?:§.)*\\((?<amount>\\d+)\\)\\s*$',
    'data.hypixeldata.playeramount.guesting': '^\\s*(?:§.)*Guests (?:§.)*\\((?<amount>\\d+)\\)\\s*$',
  }
 */
async function getSkyHanniPatternsRepo() {
  const url = "https://raw.githubusercontent.com/hannibal002/SkyHanni-REPO/main/constants/regexes.json";
  const res = await fetch(url);
  const data = await res.json();
  return data.regexes;
}