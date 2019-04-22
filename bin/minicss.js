#!/usr/bin/env node

const minicss = require("../lib/minicss");
const path = require("path");

if( process.argv.length <= 2 ) {
    // Usage-print.
    console.log("MiniCSS, by Mads T. Kristiansen (@madstk1).\n\nUsage: input [output, options]\n\n\tinput: Input CSS-file.\n\n\toutput: The file to output the minimized input file to.\n\t\t- Defaults to output.min.css\n\n\toptions: The options JSON-file to read from. Example included in source folder.\n\t\t- Defaults to SOURCEFOLDER/minicss.example.json");
    return;
}

// Arguments
const inputFile = process.argv[2];
const outputFile = (process.argv.length > 3) ? process.argv[3] : "output.min.css";
const options = (process.argv.length > 4) ? process.argv[4] : path.join( __dirname, "../minicss.example.json" );

minicss.render_file( inputFile, outputFile, options );