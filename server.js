//core module
const path = require(`path`);
const express = require(`express`);
const cookieParser = require('cookie-parser');
const { default: mongoose } = require("mongoose");
const session = require("express-session");

// Load environment variables
const dotenv = require('dotenv');
const result = dotenv.config({ quiet: true });
if (result.error) {
  console.error('❌ Failed to load .env:', result.error);
  process.exit(1);
}
else{console.log(`.env file loaded`)
};

// env variables
const PORT = process.env.PORT;
const DB_PATH = process.env.DB_PATH;

//local modules
const rootDir = require("./utils/pathUtil");
const storeRouter = require("./routers/storeRouter");
const loginRouter = require("./routers/loginRouter");
const userRouter = require("./routers/userRouter");


//express functions
const server = express();
server.use(express.urlencoded());
server.use(express.static(path.join(rootDir,`public`)));
server.use(express.json());
server.use(cookieParser()); // ✅ must come before routes for cookies

// Testing session 
server.use(session({
  name: "honey.sid",
  secret: "dev-secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  }
}));

server.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash; // one-time use
  next();
});


//routers
server.use(storeRouter);
server.use(loginRouter);
server.use(userRouter);

// EJS
server.set(`view engine`, `ejs`);
server.set(`views`, `views`);


mongoose.connect(DB_PATH).then(() => {
  server.listen(PORT , () => {
    console.log(`Server is running at http://localhost:${PORT}`);
   });
}).catch(err => {
  console.log(`Error while connecting to mongo:` , err);
});