require('dotenv').config();
const express = require('express');
const app = express();
const https = require('https');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/moviesDB');


const userSchema = mongoose.Schema({
    email: String,
    password: String,
    movieList: [{
        name: String,
        movieUrl: String
    }]
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

let movie = "";
let movieUrl = "";
let log = "";

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", function (req, res) {
    console.log(req.user);
    if (req.user) {
        log = "Logout";
    } else {
        log = "Login";
    }
    res.render("home", {log: log});

})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    User.register({
        username: req.body.email
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local', function (err) {
                if (err) {
                    console.log(err)
                } else {
                    res.redirect("/");
                }


            })(req, res);
        }
    })
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/logout", function(req, res) {
    req.session.destroy(function(err) {
        res.redirect("/login");
    })
    
})

app.get("/favoriteMovies", function (req, res) {
    if (req.user) {
        console.log("I know that we have a user");
        User.findById(req.user.id, function (err, foundUser) {
            const listOfMovies = foundUser.movieList;
            res.render("favorite-movies", {
                movies: listOfMovies
            });
        })

    } else {
        res.redirect("/login");
    }
})

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.email,
        password: req.body.password
    });


    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local", function () {
                res.redirect("/");
            })(req, res);
        }

    });
})

app.post("/addToMovieList", function (req, res) {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, foundUser) {
            foundUser.movieList.push({
                name: movie.toUpperCase(),
                movieUrl: movieUrl
            });
            foundUser.save();
        })
    } else {
        res.redirect("/login");
    }
})





app.post("/", function (req, res) {
    movie = req.body.userMoviePick;


    // let exampleMovie = "Iron Man";
    const url = "https://www.omdbapi.com/?i=tt3896198&apikey=" + process.env.API_KEY + "&t=" +
        movie;

    https.get(url, function (response) {
        let rawData = '';
        response.on('data', (chunk) => {
            rawData += chunk;
        });
        response.on('end', () => {
            try {
                const movieData = JSON.parse(rawData);
                let titleOfMovie = movieData.Title;
                let moviePlot = movieData.Plot;
                let moviePoster = movieData.Poster;
                movieUrl = moviePoster;
                let imdbSource = movieData.Ratings[0].Source;
                let imdbRating = movieData.Ratings[0].Value;
                let rottenTomatoRating = movieData.Ratings[1].Value;
                let metaCriticRating = movieData.Ratings[2].Value;
                res.render("movies", {
                    movieTitle: titleOfMovie,
                    moviePlot: moviePlot,
                    moviePoster: moviePoster,
                    imdbSource: imdbSource,
                    imdbRating: imdbRating,
                    rottenTomatoRating: rottenTomatoRating,
                    metaCriticRating: metaCriticRating,
                    log: log
                })
            } catch (e) {
                console.error(e.message);
                res.render("movie-error");
            }
        });

    })

})

app.listen(4000, function () {
    console.log("Listening on port 4000.");
})