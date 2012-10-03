/**
 * # JSTmpl - JavaScript Templates
 *
 * Plain-text template engine with JavaScript support.
 *
 * Adapted from [underscore.js](https://github.com/documentcloud/underscrore/).
 * Forked from: bfa4fe8a4f / November 23, 2011 
 *
 * @author Monwara LLC / Branko Vukelic <branko@brankovukelic.com>
 * @version 0.0.4
 */
 void(0);
/**
 * ## Overview
 * 
 * JSTmpl started off as a simple project of shamelessly ripping out
 * underscore.js' template functionality and converting it into an AMD module
 * for use in frontends. Since then, quite a few things have changed, and
 * functionality of the template engine has been somewhat expanded.
 *
 * JSTmpl now supports a handful of useful helper functions that makes combining
 * JavaScript with your template much easier, and ads performance improvements
 * like in-memory cache.
 *
 * The JSTmpl module itself has been converted to UMD format so it can be used
 * both server- and client-side.
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.jstmpl = factory();
  }
})(this, function() {

  var jstmpl = {};

  var cache = {};

  /**
   * ## TAGS
   *
   * Variable holding all enclosable tags
   */
  var TAGS = ('p a strong em button code pre blockquote div li dd dt td th ' +
              'tr h1 h2 h3 h4 h5 h6 tt').split(' ');

  /**
   * ## jstmplmpl.html
   *
   * HTML-related helper methods.
   *
   * Following tags are supported: p, a, strong, em, button, code, pre, 
   * blockquote, div, li, dd, dt, td, th, tr, h1, h2, h3, h4, h5, h6, and tt.
   *
   * The b and i tags are aliases for strong and em respectively.
   *
   * You can convert a sring into a tagged string by calling a method named
   * after the tag:
   *
   *     jstmpl.html.p('This is a paragraph');
   *     // results in '<p>This is a paragraph</p>'
   *
   * You can also use arbitrary attributes:
   *
   *     jstmpl.html.a('click here', {href: 'http://example.com'});
   *     // results in '<a href="http://example.com">click here</a>'
   *
   * All HTML helper methods are available inside templates as well, prefixed
   * by `g.h.`. For example `jstmpl.html.a()` will be `g.h.a()` within 
   * the templates.
   *
   * Other helper methods are documented in their own sections.
   */
  jstmpl.html = {};

  /**
   * ### jstmpl.html.enclose(s, t, attr)
   *
   * Enclose in HTML tags. `s` is the string to be enclosed in tags. `t` is the
   * tag name, and `attr` is an object containing key-value mappings of HTML
   * attributes.
   *
   * @param {String} s String to enclose
   * @param {String} t Tag name
   * @param {Object} attr Optional attribute-value mapping
   * @return {String} String enclosed in proper HTML
   */
  jstmpl.html.enclose = function(s, t, attr) {
    var r = '<' + t;
    if (typeof attr === 'object') {
      for (k in attr) { r += ' ' + k + '="' + attr[k].toString() + '"'; }
    }
    return r + '>' + s + '</' + t + '>';
  };

  // Add all tags in TAGS to `jstmpl.html` object
  TAGS.forEach(function(t) {
    jstmpl.html[t] = function(s, attr) {
      return this.enclose(s, t, attr);
    };
  });

  // Alias b and i to strong and em respectively
  jstmpl.html.b = jstmpl.html.strong;
  jstmpl.html.i = jstmpl.html.em;

  /**
   * ### jstmpl.html.select(opts, attrs)
   *
   * Creates `<option>` elements for a select input and wraps them in
   * `<select>` tags.
   *
   * @param {Object/Array} opts The key-value pair of options and values or
   * array of label which would be also used as values.
   * @param {Object} attrs Attributes for select element
   */
  jstmpl.html.select = function(opts, attrs) {
    var optHTML;
    if (Array.isArray(opts)) {
      optsHTML = opts.map(function(v, idx) {
        return '<option value="' + v + '">' + v + '</option>';
      }).join('');
    } else {
      optsHTML = Object.keys(opts).map(function(key) {
        return '<option value="' + key + '">' + opts[key] + '</option>';
      }).join('');
    }
    return this.enclose(optsHTML, 'select', attrs);
  };

  /**
   * ### jstmpl.html.escape(s)
   *
   * Escapes HTML tags and special characters in string `s`.
   *
   * @param {String} s String to be escaped
   * @return {String} Escaped string
   */
  jstmpl.html.escape = function(s) {
    return s.
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').
      rplace(/>/g, '&gt;').
      replace(/"/g, '&quot;').
      replace(/'/g, '&#x27;').
      replace(/\//g, '&#x2F;');
  }

  /**
   * ## jstmpl.url
   *
   * URL-related helper methods.
   */
  jstmpl.url = {};

  /**
   * ### jstmpl.url.toQuery(parameters)
   *
   * Converts a key-value pair of parameters into an URL query string. The
   * resulting string does not include the leading question mark `?`.
   *
   * It is assumed that keys are valid, and require no special treatment.
   *
   * @param {Object} parameters Key-value pair of URL parameters
   */
  jstmpl.url.toQuery = function(parameters) {
    return Object.keys(parameters).map(function(key) {
      return key + '=' + encodeURIComponent(parameters[key]);
    }).join(';');
  }

  /**
   * ## jstmpl.settings
   *
   * Main template settings. Following are used:
   *
   *  + evaluate: Regexp for evaluate tag (default matches `<% %>`)
   *  + interpolate: Regexp for interpolate tag (default matches `<%= %>`)
   *  + escape: Regexp for escape tag (default matches `<%- %>`)
   *  + debug: Flag that enables debugging messages in the templates
   *  + globals: Object which will be available inside the object as `g`. You 
   *    can use it to make anything available to the template.
   *
   */
  jstmpl.settings = {
    evaluate: /<%([\s\n\r\S]+?)%>/g,
    interpolate: /<%=([\s\n\r\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g,
    debug: false,
    globals: {
      debug: function(msg) {
        if (!__debug) { return; }
        if (msg) {
          console.log(msg);
        } else {
          console.log.apply(console, arguments);
        }
      }
    }
  };

  jstmpl.settings.globals.h = jstmpl.html;
  jstmpl.settings.globals.u = jstmpl.url;

  /**
   * ## jstmpl.render(str, [data, settings])
   *
   * Renders the template contained in `str` using `data`. `settings` can be
   * passed to override global settings.
   *
   * If `data` is omitted, a function is returned which can be used to render
   * the template by specifying only the data, at some later time. If `data` is
   * just `true`, the template function is returned as a string instead of the
   * rendered template.
   *
   * Passing `true` instead of the data can be a useful debugging tool.
   *
   * @param {String} str Template to be rendered
   * @param {Object} data Optional set of data to use in the template
   * @param {Object} settings Object containing overrides for global settings
   * @return {String} Rendered template or template function as string
   */
  jstmpl.render = function(str, data, settings) {
    if (settings) {
      settings.__proto__ = this.settings;
    }
    var c = settings || this.settings;
    var func;

    if (str in cache) {
      func = cache[str];
      if (data === true) {
        return func.toString();
      }
    } else {
      var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
        'var __debug = ' + c.debug.toString() + ';' +
        'var g = this;' +
        'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(c.escape, function(match, code) {
          return "',g.h.escape(" + code.replace(/\\'/g, "'") + "),'";
        })
        .replace(c.interpolate, function(match, code) {
          return "'," + code.replace(/\\'/g, "'") + ",'";
        })
        .replace(c.evaluate || null, function(match, code) {
          return "');" + code.replace(/\\'/g, "'")
          .replace(/[\r\n\t]/g, ' ') + ";__p.push('";
        })
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t') +
        "');}return __p.join('');";

      if (data === true) {
        return tmpl;
      }

      func = new Function('obj', tmpl);
    }

    // Cache the compiled template
    cache[str] = func;
      
    var funcWrapped = function(data) {
      try {
        return func.call(jstmpl.settings.globals, data);
      } catch(e) {
        if (c.debug) {
          console.log('[jstmpl] ' + e + ' in:\n\n' +
            func.toString() + '\n\n' + str);
          throw e;
        }
        return '';
      }
    };

    if (data) { 
      return funcWrapped(data); 
    } else {
      return funcWrapped;
    }
  };

  return jstmpl;
});
