const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser((user, done) => {
	done(null, user);
})
passport.deserializeUser(function (user, done) {
	done(null, user);
});


passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID, // Your Credentials here. 
	clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Credentials here. 
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	passReqToCallback: true
},
	function (request, accessToken, refreshToken, profile, done) {
		return done(null, profile);
	}
));


// passport.use(new FacebookStrategy({
// 	clientID: process.env.FACEBOOK_CLIENT_ID, // Your Credentials here. 
// 	clientSecret: process.env.FACEBOOK_CLIENT_SECRET, // Your Credentials here. 
// 	callbackURL: process.env.FACEBOOK_CALLBACK_URL,
// 	passReqToCallback: true
// },
// 	function (request, accessToken, refreshToken, profile, done) {
// 		return done(null, profile);
// 	}
// ));
