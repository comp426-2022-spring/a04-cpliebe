// constants
const express = require('express')
const app = express()
const logdb = require('./database')
const morgan = require('morgan')
const {loadExtension } = require('./database')
const fs = require('fs')

// set up port
const args = require('minimist')(process.argv.slice(2))
console.log(args)
args["port"]
var port = args.port || 5555 || process.env.PORT


app.use(express.urlencoded({extended: true}));
app.use(express.json());

if (!args.log) {
const accessLog = fs.createWriteStream('access.log', {flags: 'a'})
app.use(morgan('combined', { stream: accessLog}))
}

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = logdb.prepare('INSERT INTO accesslog (remote_addr, remote_user, date, method, url, http_version, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remote_addr, logdata.remote_user, logdata.date, logdata.method, logdata.url, logdata.http_version, logdata.status)
    next()
})

const help = (` 
server.js [options]
--por		Set the port number for the server to listen on. Must be an integer
between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
a JSON access log from the database and /app/error which throws 
an error with the message "Error test successful." Defaults to 
false.

--log		If set to false, no log files are written. Defaults to true.
Logs are always written to database.

--help	Return this message and exit.
`)


if (args.help || args.h) {
    console.log(help)
        process.exit(0)
}


// COIN FLIP FUNCTIONS

// one random coin flip
function coinFlip() {
    var random = Math.random()

   if (random > 0.5) {
     return "heads"
   }
   else {
     return "tails"
   }
}

//many random coin flips
function coinFlips(flips) {
    if (flips<0||flips==0||typeof flips==="undefined"){flips = 1};
    const results = [];
    for (var i = 0; i < flips; i++) {
      results.push(coinFlip());
    }
    return results;
  }

// flip a coin with a call to see if it matches the call
function flipACoin(call2) {
    var outcome = ""
    var flip = ""
    var num = Math.random()
  
    if (call2 !== "heads" && call2 !== "tails") {
      console.log("Error: no input. Usage: node guess-flip -- call=[heads|tails]")
      return
    }
    if (num < 0.5) {
      flip = "heads"
    }
    else { 
      flip = "tails"
    }
    
    if (flip == call2) {
      outcome = "win"
    }
    else  {
      outcome = "lose"
    }
    return {call: call2, flip: flip, result: outcome}
  }

// an array that tallies the random coin flips
function countFlips(array) {
    const counts = {
        heads: 0,
        tails: 0
      }
    
      
      for (var i = 0; i < array.length; i++) {
        if (array[i] == "heads") {
          counts.heads++;
        } else if (array[i] == "tails") {
          counts.tails++;
      }
    }
      return counts
    }


// NEW ENDPOINTS

if (args.debug){
    app.get('/app/log/access', (req,res) => {
        const stmt = logdb.prepare('SELECT * FROM accesslog').all()
        res.statusCode = 200
        res.json(stmt)
    })
    
    app.get('/app/error', (req,res) => {
        throw new Error('Error test successful')
    })
  }


    const server = app.listen(port, () => {
        console.log('App listening on port %PORT%'.replace('%PORT%',port))
    });

//default check endpoint
app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
    });

//flip endpoint (one flip)
app.get('/app/flip', (req, res) => {
    
    const result = coinFlip()
    res.status(200).json({"flip": result})

    });

//flips endpoint (many flips)
app.get('/app/flips/:number', (req, res) => {
    
    const results = coinFlips(req.params.number)
    const summary = countFlips(results)
    res.status(200).json({"raw": results, "summary": summary})

    });

//flip while calling heads endpoing
app.get('/app/flip/call/heads', (req, res) => {
    var resStatusCode = 200

    res.status(200).json(flipACoin("heads"))
    });

//flip while calling tails endpoint
app.get('/app/flip/call/tails', (req, res) => {
    var resStatusCode = 200

    res.status(200).json(flipACoin("tails"))
    });

//default error message
app.use(function(req,res){
    res.status(404).send("endpoint does not Exist")
    res.type("text/plain")
}
)