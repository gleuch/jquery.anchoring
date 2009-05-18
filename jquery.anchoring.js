/*
jQuery.anchoring

A jQuery plugin to allow AJAX permalinking with anchoring tags.
Released by Greg Leuch <http://gleuch.com>, originally for Magma <http://hotlikemagma.com>.

*/
(function($) {
  $.anchoring = {};

  $.fn.anchoring = function(settings) {
    $.anchoring.settings = $.extend($.anchoring.settings, settings);

    var r = this.click(function() {$.anchoring.analyze(this); return false;});

    if (!$.anchoring.settings.init) {
      $.anchoring.watch = setInterval(function() {
        if ($.anchoring.settings.location != window.location.href) {
          $.anchoring.settings.location = window.location.href;
          $.anchoring.sniff();
        }
      }, 100);
      $.anchoring.sniff();
    }

    return r;
  };


	$.extend($.anchoring, {
    settings: {xhr : false, dataType : 'JSON', init : false, current : false, page : false, location : window.location.href},
    history : [],
    loading : function() {},
    loaded : function() {$.anchoring.settings.xhr = false;},
    retrieve : function(obj) {
      if ($.anchoring.settings.xhr) $.anchoring.settings.xhr.abort();
      obj = $.extend({url : $.anchoring.settings.current, cache : false, method : 'GET', dataType : $.anchoring.settings.dataType, complete : function() {$.anchoring.loaded();}, beforeSend : function() {$.anchoring.loading();}, success : function(response) {$(document).html(response);}, error : function(request) {if (request.status > 0) alert('Sorry, but an unknown error has occured in fetching '+ $.anchoring.settings.current +'.');}}, (typeof(obj) == 'object' ? obj : {}));
      if (!(/^(http)/.test(obj.url))) obj.url = (window.location.href.replace(/(http|https)(\:\/\/)([a-z0-9\_\-\.\:]*)(\/)(.*)/i, '$1$2$3')) + obj.url;
      $.anchoring.settings.xhr = $.ajax(obj);
    },
    funcs : {
      /* Setting custom funcs in this obj allows for passing of additional funcs by specific pages. */
      link : function(item) {
        if (item && item.href && item.href != '') $.anchoring.set(item.href);
        $.anchoring.retrieve();
      }
    },
    analyze : function(item) {
      var rel = $(item).attr('rel');
      if (/^([A-Z0-9\_\-\.]+)(\s)([A-Z0-9\_\-\.]+)/i.test(rel)) {
        var rels = rel.replace(/(\s){2,}/, '').split(' ');
        var data = rel.replace(/^([A-Z0-9\_\-\.]+)(\s)([A-Z0-9\_\-\.]+)(.*)/i, '$4').replace(/(\s){2,}/, '').replace(/^\s+|\s+$/m, '').split(' ');

        if (rels[1] != '' && $.anchoring.is_f(rels[1])) {
          eval('$.anchoring.funcs.'+ rels[1])(item, data);
        } else {
          $.anchoring.funcs.link(item, data);
        }
      } else {
        $.anchoring.funcs.link(item);
      }
    },
    anchor : function(loc) {
      $.anchoring.settings.current = loc;
      $.anchoring.history.unshift($.anchoring.settings.current);
    },
    addFunc : function(name, func) {$.anchoring.funcs[name] = func;},
    browseHistory : function() {alert($.anchoring.history);},
    parse : function() {
      if (/(\#)(.*)$/.test(window.location.href)) {
        $.anchoring.anchor(window.location.href.replace(/^(.*)(\#)(.*)$/, '$3'));
        $.anchoring.settings.location = window.location.href;
      } else if (typeof($.anchoring.settings.default) == 'function') {
        $.anchoring.settings.skip = true;
        $.anchoring.settings.default();
        $.anchoring.settings.skip = false;
      }
    },
    setElement : function(item) {
      if (item && item.id && item.id != '') $.anchoring.set(item.tagName.toLowerCase()+'.'+item.id);
    },
    set : function(loc) {
      if ($.anchoring.settings.skip) {
        $.anchoring.anchor('');
        return;
      }

      var base = (/(\#)(.*)$/.test(location.href) ? window.location.href.replace(/^(.*)(\#)(.*)$/, '$1') : window.location.href.replace(/\#/, ''));
      var domain = base.replace(/(http|https)(\:\/\/)([a-z0-9\_\-\.\:]*)(\/)(.*)/i, '$1$2$3');
      loc = loc.replace(new RegExp(domain, 'i'), '').replace(/(#.*)?$/, '');

      if (loc != base.replace(new RegExp(domain, 'i'), '').replace(/(#.*)?$/, '') && loc != $.anchoring.settings.current) {
        $.anchoring.anchor(loc);
        $.anchoring.settings.location = base +'#'+ loc;
        window.location.href = $.anchoring.settings.location;
        // Is this needed? Prob not since it stops animations & other events.
        // if ($.browser.msie) document.execCommand('Stop');
        // window.stop();
      }
    },
    is_f : function(func) {
      eval("var is_f = (typeof($.anchoring.funcs."+func+") == 'function');");
      return is_f;
    },
    sniff : function() {
      $.anchoring.settings.init = true;
      $.anchoring.parse();
      if ($.anchoring.settings.current) {
        // if matches an element id, then execute onclick command
        if ($($.anchoring.settings.current.replace(/\./, '#')).length > 0) {
          $($.anchoring.settings.current.replace(/\./, '#')).click();
        // Else try to use default function
        } else if (typeof($.anchoring.settings.default) == 'function') {
          $.anchoring.settings.default($.anchoring.settings.current);
        // Else do normal link request
        } else {
          $.anchoring.funcs.link($.anchoring.settings.current);
        }
      }
    }
  });
})(jQuery);