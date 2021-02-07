const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');

mongoose.connect(config.database);
let db = mongoose.connection;

//Checking the Connection
db.once('open',function(){
    console.log('Connected to MongoDB');
});

//Checking for DB errors
db.on('error',function(err){
    console.log(err);
});

//Init App
const app = express();

//Bring in models
let Article = require('./models/article');

//Load View Engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

//Body-Parsee MiddleWare
//Parse Application
app.use(bodyParser.urlencoded({extended:true}));

//Parse Application/json
app.use(bodyParser.json());

//Set Public Folder
app.use(express.static(path.join(__dirname,'PUBLIC')));

//Express Session MiddleWare
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
}));

//Express Messages MiddleWare
app.use(require('connect-flash')());
app.use(function(req,res,next) {
    res.locals.messages = require('express-messages')(req,res);
    next();
});

//Express Validator MiddleWare
app.use(expressValidator({
    errorformatter: function(param,msg,value) {
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while(namespace.length) {
            formParam='[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg : msg,
            value : value
        };
    }
}));

//Passport Config
require('./config/passport')(passport);

//Passport MiddleWare
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req,res,next) {
    res.locals.user = req.user || null;
    next();
});

//Home Route
app.get('/',function(req,res){
    Article.find({},function(err,articles) {
        if(err) {
            console.log(err);
        }else {
            res.render('index',{
                title:'ARTICLES',
                articles: articles
            });
        }
    });
    
});

// Route Files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles',articles);
app.use('/users',users);

//Start Server
app.listen(process.env.PORT?process.env.PORT:3000,function(){
    console.log('Server started on port 3000...');
});