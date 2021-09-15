require('dotenv').config();
const express = require('express');
const app = express();
const https = require('https');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/moviesDB');

const userSchema = ({
    email: String,
    password: String
})

const User = mongoose.model("User", userSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(__dirname + '/public'));

let movie = "";


app.get("/", function (req, res) {
    res.render("home");

})

app.get("/register", function(req, res) {
    res.render("register");
})

app.post("/register", function(req, res) {
    const newUser = new User({
        email: req.body.email,
        password: req.body.password
    });

    newUser.save(function(err) {
        if (!err) {
            res.render("home");
        }
    });
})

app.get("/login", function(req, res) {
    res.render("login");
})

app.post("/login", function(req, res) {
    User.findOne({email: req.body.email}, function(err, result) {
        if (!err) {
            if (result.password === req.body.password) {
                res.render("home");
            }
        }
    })
})

app.post("/", function(req, res) {
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
                let imdbSource = movieData.Ratings[0].Source;
                let imdbRating = movieData.Ratings[0].Value;
                let rottenTomatoRating = movieData.Ratings[1].Value;
                let metaCriticRating = movieData.Ratings[2].Value;
                res.render("movies", {movieTitle: titleOfMovie, 
                                        moviePlot: moviePlot,
                                        moviePoster: moviePoster,
                                        imdbSource: imdbSource,
                                        imdbRating: imdbRating,
                                        rottenTomatoRating: rottenTomatoRating,
                                        metaCriticRating: metaCriticRating})
            } catch (e) {
                console.error(e.message);
            }
        });

    })
    
})

app.listen(4000, function () {
    console.log("Listening on port 4000.");
})