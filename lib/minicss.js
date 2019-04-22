/*
    Imports
 */
const fs = require("fs");
const path = require("path");

/*
    Runtime variables.
 */

var options;
var mediaVariables = [];

/*
    Helper functions
 */

// Checks whether a given file exists.
// Result is passed to the callback
exports.file_exists = function( filePath, callback ) {
    fs.access( filePath, fs.constants.W_OK, (err) => {
        if( err ) {
            callback( false );
            return;
        }
        
        callback( true );
    });
}

// Read back content of a file.
// Content is passed through to the callback.
exports.read_file = function( filePath, callback, encoding = "utf8" ) {
    fs.readFile( filePath, encoding, (err, data) => {
        if(err) throw err;
        callback(data);
    });
}

// Write 'content'-variable to a file.
exports.write_file = function( filePath, content ) {
    fs.writeFile( filePath, content, (err) => {
        if( err ) throw err;
    });
}

// Append content to a file.
exports.append_to_file = function( filePath, extraContent ) {
    fs.appendFile( filePath, extraContent, (err) => {
        if(err) throw err;
    });
}

/*
    Processing functions
 */

// Removes unnecessary clutter, to minimize the file size.
// Clutter-free content is passed through to the callback.
exports.remove_clutter = function( fileContent, callback ) {
    var content = fileContent;

    while(content.indexOf( "/*" ) != -1) {
        var start = content.indexOf("/*");
        var end = content.indexOf("*/", start);
        content = content.substring( 0, start ) + content.substring( end + 2 );
    }

    // Remove all newlines.
    while(content.indexOf("\n") != -1) {
        content = content.replace("\n", "");
    }
    
    // Remove all unnecessary space between brackets, colons, etc.
    const tabPattern = new RegExp(/[\*\/,:;\{\}\%]([\ \t\n])+./);
    while( tabPattern.test( content ) ) {
        const res = tabPattern.exec( content );
        const start = res.index + 1;
        const end = res.index + res[0].toString().length - 1;

        content = content.substring(0, start ) + content.substring( end );
    }

    const extraStep = new RegExp(/[A-Za-z]([\ \t\n])+[\{\}]/);
    while( extraStep.test( content ) ) {
        const res = extraStep.exec( content );
        const start = res.index + 1;
        const end = res.index + res[0].toString().length - 1;

        content = content.substring(0, start ) + content.substring( end );
    }

    callback( content );
}

exports.replace_media_variables = function( fileContent, callback ) {
    var content = fileContent;
    Object.keys( mediaVariables ).forEach((key) => {
        const value = mediaVariables[ key ];

        // Replace all instances of the key, in question.
        while( content.indexOf( options["variable-prefix"] + key ) != -1 ) {
            content = content.replace( options["variable-prefix"] + key, value );
        }
    });
    callback( content );
}

exports.read_media_variables = function( optionPath ) {
    this.read_file( optionPath, ( data ) => {
        options = JSON.parse( data );
        mediaVariables = options["mediakeys"];
    });
}

exports.read_imports = function( filePath, callback ) {
    var imports = [];
    var relativePath = filePath.substring( 0, filePath.lastIndexOf("/") );

    this.read_file( filePath, ( content ) => {
        var pointer = content.indexOf( "@import" );
        while( pointer != -1 ) {
            var start = content.indexOf( "\"", pointer );
            var end = content.indexOf( "\"", start + 1 );
            pointer = content.indexOf( "@import", end );

            imports.push( content.substring( start + 1, end ) );
            this.read_imports( path.join( relativePath, imports[ imports.length - 1 ] ), () => {} );
        }
        callback( imports );
    });
}

/*
    User-based functions.
 */

exports.render_file = function( filePath, outputFile = filePath + ".new", optionPath = "minicss.json" ) {
    var relativePath = filePath.substring( 0, filePath.lastIndexOf("/") );
    this.file_exists( outputFile, (exists) => {
        if( exists ) {
            fs.unlink( outputFile, (err) => {
                if(err) throw err;
            });
        }
    });

    this.read_media_variables( optionPath );
    this.read_imports( filePath, ( files ) => {
        files.push( filePath.substring( filePath.lastIndexOf("/") ) );
        files.forEach( ( file ) => {
            this.read_file( path.join( relativePath, file ), ( content ) => {
                this.replace_media_variables( content, ( newContent ) => {
                    this.remove_clutter( newContent, ( clutter_free_content ) => {
                        this.append_to_file( outputFile, clutter_free_content );
                    });
                });
            });
        });
    });
}