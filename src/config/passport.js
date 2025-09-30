const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { prisma } = require('./database');

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: '/auth/discord/callback',
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma().user.findUnique({
      where: { discordId: profile.id }
    });

    if (user) {
      user = await prisma().user.update({
        where: { discordId: profile.id },
        data: {
          discordUsername: profile.username,
          discordDiscriminator: profile.discriminator,
          discordAvatar: profile.avatar,
          email: profile.email,
          lastLogin: new Date()
        }
      });
    } else {
      user = await prisma().user.create({
        data: {
          discordId: profile.id,
          discordUsername: profile.username,
          discordDiscriminator: profile.discriminator,
          discordAvatar: profile.avatar,
          email: profile.email,
          lastLogin: new Date()
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma().user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;