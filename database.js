"use strict"

const database = require('better-sqlite3')

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)

let row = stmt.get();
if (row === undefined) {
    console.log('Log database appears to be empty. Creating log database.')


    const logdata =   ` CREATE TABLE accesslog ( 
        remoteaddr TEXT, 
        remoteuser TEXT, 
        time TEXT, 
        method TEXT, 
        url TEXT, 
        protocol TEXT,
        httpversion TEXT,  
        status TEXT, 
        referer TEXT,
        useragent TEXT
    ); `
    const sqlInit = 
    logdb.exec(logdata)
    
} else {
    console.log('Log database exists.')
}
module.exports = logdb