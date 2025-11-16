import { Client, GatewayIntentBits, Partials } from 'discord.js';
import {
  joinVoiceChannel,
  getVoiceConnection,
  entersState,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import dotenv from 'dotenv';
dotenv.config();

const VOICE_CHANNEL_ID = '1439356845608140992';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

async function connectToChannel(channel) {
  const existing = getVoiceConnection(channel.guild.id);
  if (existing?.joinConfig.channelId === channel.id) return existing;
  if (existing) existing.destroy();

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  console.log(`[voice] Connected to ${channel.name}`);
  return connection;
}

async function ensureVoicePresence() {
  try {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
    if (channel?.isVoiceBased()) await connectToChannel(channel);
  } catch (err) {
    console.error('[voice] Error:', err);
  }
}

client.once('ready', async () => {
  console.log(`Bot ready: ${client.user.tag}`);
  await ensureVoicePresence();

  setInterval(ensureVoicePresence, 30_000);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.id === client.user.id && newState.channelId !== VOICE_CHANNEL_ID) {
    console.log('[voice] Bot moved or disconnected, reconnecting...');
    await ensureVoicePresence();
  }
});

client.login(process.env.TOKEN);
