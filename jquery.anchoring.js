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
      $.anchoring.settings.anchor = window.location.href;

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
    settings: {xhr:false, dataType:'JSON', skip:false, init:false, debug:false, current:false, anchor:false, fallback:false, page:false, location:window.location.href},
    history : [],
    loading : function() {},
    loaded : function() {$.anchoring.settings.xhr = false;},
    retrieve : function(obj) {
      if ($.anchoring.settings.xhr) $.anchoring.settings.xhr.abort();
      obj = $.extend({url : $.anchoring.settings.current, method : 'GET', dataType : $.anchoring.settings.dataType, complete : function() {$.anchoring.loaded();}, beforeSend : function() {$.anchoring.loading();}, success : function(response) {$(document).html(response);}, error : function(request) {if (request.status > 0) alert('Sorry, but an unknown error has occured in fetching '+ ($.anchoring.settings.debug ? $.anchoring.settings.current : 'this page') +'.');}}, (typeof(obj) == 'object' ? obj : {}));
      if (!(/^(http)/.test(obj.url))) obj.url = (window.location.href.replace(/(http|https)(\:\/\/)([a-z0-9\_\-\.\:]*)(\/)(.*)/i, '$1$2$3')) + obj.url;

      // Appending cache issue if called url is the anchored url
      if (obj.url == $.anchoring.settings.anchor) obj.url += (/\?/.test(obj.url) ? '&' : '?') + '_=' + (new Date()).getTime();

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
      if (/(\#)(.+)$/.test(window.location.href)) {
        $.anchoring.anchor(window.location.href.replace(/^(.*)(\#)(.+)$/, '$3'));
        $.anchoring.settings.location = window.location.href;
      } else if (typeof($.anchoring.settings.fallback) == 'function') {
        $.anchoring.settings.skip = true;
        $.anchoring.settings.fallback();
        $.anchoring.settings.skip = false;
      }
    },
    setElement : function(item) {
      if (item && item.id && item.id != '') $.anchoring.set(item.tagName.toLowerCase()+'.'+item.id);
    },
    set : function(loc) {
      if ($.anchoring.settings.skip) {$.anchoring.anchor(''); return;}

      var url = $.anchoring.url(window.location.href), 
        m = new RegExp('^('+url.clean.replace(/\//, '\\/') +')(\\?)(.*)$', 'i');

      loc = loc.replace(new RegExp(url.domain, 'i'), '').replace(/(#.*)?$/, '');
      if (loc.match(m)) loc = loc.replace(m, '$2$3');

      if (loc != url.clean && loc != $.anchoring.settings.current) {
        $.anchoring.anchor(loc);
        $.anchoring.settings.location = url.url +'#'+ loc;
        window.location.href = $.anchoring.settings.location;
        // is this needed? prob not (since it stops animations & other events.)
        //if ($.browser.msie) document.execCommand('Stop');
        //window.stop();
      }
    },
    is_f : function(func) {
      eval("var is_f = (typeof($.anchoring.funcs."+func+") == 'function');");
      return is_f;
    },
    url : function(str) {
      var url = (/(\#)(.*)$/.test(str) ? str.replace(/^(.*)(\#)(.*)$/, '$1') : str.replace(/\#/, '')),
        domain = url.replace(/(http|https)(\:\/\/)([a-z0-9\_\-\.\:]*)(\/)(.*)/i, '$1$2$3'),
        path = url.replace(new RegExp(domain, 'i'), '').replace(/(#.*)?$/, ''),
        clean = path.replace(/(\?.*)$/, '');
      return {url:url, domain:domain, path:path, clean:clean};
    },
    sniff : function() {
      $.anchoring.settings.init = true;
      $.anchoring.parse();

      // Attempt to sniff out the click function of the event, if an element exists with that href.

      var em = $('a[href=\''+$.anchoring.settings.current+'\']:eq(0)');
      if (em.length > 0) {
        em.click();
      } else {
        if ($.anchoring.settings.current) {
          if (/^\?/.test($.anchoring.settings.current)) {
            var url = $.anchoring.url(window.location.href);
            $.anchoring.settings.current = url.clean + $.anchoring.settings.current;
          }

          // if matches an element id, then execute onclick command
          var em = $($.anchoring.settings.current.replace(/\./, '#'));
          if (em.length > 0) {
            em.click();

          // Else try to use fallback function
          } else if (typeof($.anchoring.settings.fallback) == 'function') {
            $.anchoring.settings.fallback($.anchoring.settings.current);
          // Else do normal link request
          } else {
            $.anchoring.funcs.link($.anchoring.settings.current);
          }
        }
      }
    }
  });
})(jQuery);