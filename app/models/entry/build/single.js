var Metadata = require('./metadata');
var Dependencies = require('./dependencies');
var helper = require('../../../helper');
var Plugins = require('../../../plugins').convert;
var ensure = helper.ensure;
var time = helper.time;
var file = require('./file');

var doc = file.doc;
var readDoc = doc.read;
var isDoc = doc.is;

var odt = file.odt;
var readODT = odt.read;
var isODT = odt.is;

var html = file.html;
var readHTML = html.read;
var isHTML = html.is;

var markdown = file.markdown;
var readMarkdown = markdown.read;
var isMarkdown = markdown.is;

var image = file.image;
var readImage = image.read;
var isImage = image.is;

var webloc = file.webloc;
var readWebloc = webloc.read;
var isWebloc = webloc.is;

module.exports = function(blog, path, callback){

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  var Read;

  if (isImage(path)) {

    Read = readImage;

  } else if (isMarkdown(path)) {

    Read = readMarkdown;

  } else if (isHTML(path)) {

    Read = readHTML;

  } else if (isWebloc(path)) {

    Read = readWebloc;

  } else if (isDoc(path)) {

    Read = readDoc;

  } else if (isODT(path)) {

    Read = readODT;

  } else {

    return callback(cannotConvert(path));
  }

  time('READ');

  Read(blog, path, function(err, contents, stat){

    time.end('READ');

    if (err) return callback(err);

    var parsed, metadata, dependencies;

    // Now we extract any metadata from the file
    // This modifies the 'contents' if it succeeds
    try {
      parsed = Metadata(contents);
      metadata = parsed.metadata;
      contents = parsed.contents;
    } catch (err) {
      return callback(err);
    }


    // We have to compute the dependencies before 
    // passing the contents to the plugins because
    // the image cache plugin replaces local URLs with
    // remove URLs and this will prevent the dependency
    // module from determining which other files in the blog's
    // folder this file depends on.
    try {
      parsed = Dependencies(contents, path);
      dependencies = parsed.dependencies;
      contents = parsed.contents;
    } catch (err) {
      return callback(err);
    }

    time('PLUGINS');

    // We pass the contents to the plugins for
    // this blog. The resulting HTML is now ready.
    Plugins(blog, path, contents, function(err, html){

      time.end('PLUGINS');

      if (err) return callback(err);

      html = fixMustache(html);

      return callback(null, html, metadata, stat, dependencies);
    });
  });
};



function fixMustache (str) {
  return str.split('{{&gt;').join('{{>');
}



function cannotConvert (path) {
  return new Error('Cannot turn this path into an entry: ' + path);
}