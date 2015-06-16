'use strict';

var fs = require('fs');
var globby = require('globby');
var through = require('through2');
var xtend = require('xtend');
var Handlebars = require('handlebars');


function EasyHandlebars(files, opts) {

  if (!(this instanceof EasyHandlebars)) {
    return new EasyHandlebars(files, opts);
  }

  this.opts = EasyHandlebars.normalizeOpts(opts);

  return this.generateBundle(files);
}

EasyHandlebars.prototype.generateBundle = function(files) {

  var self = this;

  var stream = through();

  stream.write(
    '(function (global, factory) {\n' +
      'if (typeof module === "object" && typeof module.exports === "object") {\n' +
        'module.exports  = factory;\n' +
      '} else {\n' +
        'factory(global.Handlebars);\n' +
      '}' +
    '}(typeof window !== "undefined" ? window : this, function (Handlebars) {\n'
  );

  globby.sync(files).forEach(function(filePath) {
    var html = fs.readFileSync(filePath, 'utf-8');
    var tplId = self.extractTplId(filePath);
    var hasData = self.opts.noData[tplId] === undefined;
    var compilerOpts = JSON.parse(JSON.stringify(self.opts.defaultCompilerOpts));
    compilerOpts.data = hasData;
    stream.write('\n');
    var tpl = Handlebars.precompile(html, compilerOpts);
    if (self.opts.detectPartialPattern === undefined || self.opts.detectPartialPattern.test(tplId)) {
      stream.write('Handlebars.registerPartial("' + tplId + '", Handlebars.template(' + tpl + '));');
    } else {
      stream.write('Handlebars.templates["' + tplId + '"] = Handlebars.template(' + tpl + ');');
    }
  });

  stream.write('\n\n}));');
  stream.end();

  return stream;
};

EasyHandlebars.prototype.extractTplId = function(filePath) {
  var match = this.opts.nameCapturingPattern.exec(filePath);
  var tplId = match.slice(1).join('/');
  return tplId;
};

EasyHandlebars.normalizeOpts = function(opts) {

  if (opts === undefined) {
    opts = {};
  } else {
    if (Array.isArray(opts.noData)) {
      opts.noData = EasyHandlebars.arrToObj(opts.noData);
    }
    if (opts.defaultCompilerOpts && Array.isArray(opts.defaultCompilerOpts.knownHelpers)) {
      opts.defaultCompilerOpts.knownHelpers = EasyHandlebars.arrToObj(opts.defaultCompilerOpts.knownHelpers);
    }
  }

  if (opts.nameCapturingPattern === undefined) {
    // Capture the file name without the extension by default.
    opts.nameCapturingPattern = /.*\/([^\.]+)/;
  }

  return xtend({noData: {}, defaultCompilerOpts: {}}, opts);
};

EasyHandlebars.arrToObj = function(arr) {
  var resp = {};
  if (arr) {
    arr.forEach(function(entry) {
      resp[entry] = true;
    });
  }
  return resp;
}


module.exports = EasyHandlebars;
