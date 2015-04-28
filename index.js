'use strict';

var fs = require('fs');
var glob = require('glob');
var through = require('through2');
var xtend = require('xtend');
var Handlebars = require('handlebars');

function arrToObj(arr) {
    var resp = {};
    if (arr) {
        arr.forEach(function (entry) {
            resp[entry] = true;
        });
    }
    return resp;
}

function EasyHandlebars(files, opts) {

    if (!(this instanceof EasyHandlebars)) {
        return new EasyHandlebars(files, opts);
    }

    this.opts = this.normalizeOpts(opts);

    return this.generateBundle(files);
}

EasyHandlebars.prototype.generateBundle = function (files) {
    
    var self = this;

    var header = '(function (global, factory) {\n' +
            'if (typeof module === "object" && typeof module.exports === "object") {\n' +
            'module.exports  = factory;\n' +
            '} else {\n' +
            'factory(global.Handlebars);\n' +
            '}' +
            '}(typeof window !== "undefined" ? window : this, function (Handlebars) {\n';

    var stream = through();

    stream.write(header);

    glob.sync(files).forEach(function (filePath) {
        var html = fs.readFileSync(filePath, 'utf-8');
        var tplId = self.extractTplId(filePath);
        var hasData = self.opts.noData[tplId] === undefined;
        var compilerOpts = JSON.parse(JSON.stringify(self.opts.defaultCompilerOpts));
        compilerOpts.data = hasData;
        stream.write('\n\n');
        var tpl = Handlebars.precompile(html, compilerOpts);
        if (self.opts.detectPartial && self.opts.detectPartial.test(tplId)) {
            stream.write('Handlebars.registerPartial("' + tplId + '", Handlebars.template(' + tpl + '));');
        } else {
            stream.write('Handlebars.templates["' + tplId + '"] = Handlebars.template(' + tpl + ');');
        }
    });

    stream.write('\n\n');
    stream.write('}));');
    stream.end();

    return stream;
};

EasyHandlebars.prototype.extractTplId = function (filePath) {
    var tplStartPosId = filePath.lastIndexOf('/') + 1;
    var fileName = filePath.slice(tplStartPosId);
    var tplId;
    if (typeof this.opts['prefix'] !== 'undefined') {
        tplId = this.opts.prefix + fileName;
    } else {
        tplId = fileName;
    }
    var extPost = tplId.lastIndexOf('.');
    return extPost >= 0 ? tplId.slice(0, extPost) : tplId;
};

EasyHandlebars.prototype.normalizeOpts = function (opts) {
    
    if (opts) {
        if (Array.isArray(opts.noData)) {
            opts.noData = arrToObj(opts.noData);
        }
        if (opts.defaultCompilerOpts && Array.isArray(opts.defaultCompilerOpts.knownHelpers)) {
            opts.defaultCompilerOpts.knownHelpers = arrToObj(opts.defaultCompilerOpts.knownHelpers);
        }
    }

    return xtend({noData: {}, defaultCompilerOpts: {}}, opts);
};

module.exports = EasyHandlebars;