(function($) {
  $.anchoring = {};

  $.fn.anchoring = function(settings) {
    $.anchoring.settings = $.extend($.anchoring, settings);

    if (!$.anchoring.init) {
      $.anchoring.watch = setInterval(function() {
        if ($.anchoring.location != location.href) {
          $.anchoring.location = location.href;
          $.anchoring.sniff(true);
        }
      }, 250);
      $.anchoring.sniff();
    }

    return this.click(function() {$.anchoring.analyze(this); return false;});
  };


	$.extend($.anchoring, {
    settings: {},
    history : [],
    init : false,
    current : false,
    page : false,
    xhr : false,
    location : window.location.href,
    loading : function() {},
    loaded : function() {$.anchoring.xhr = false;},
    retrieve : function(obj) {
      if ($.anchoring.xhr) $.anchoring.xhr.abort();
      obj = $.extend({url : $.anchoring.current, method : 'GET', dataType : "json", complete : function() {$.anchoring.loaded();}, beforeSend : function() {$.anchoring.loading();}, success : function(response) {$('body').html(response);}, error : function(request) {if (request.status > 0) alert('Sorry, but an unknown error has occured in fetching '+ $.anchoring.current +'.');}}, (typeof(obj) == 'object' ? obj : {}));
      $.anchoring.xhr = $.ajax(obj);
    },
    runAs : {
      /* Setting custom funcs in this obj allows for passing of additional funcs by specific pages. */
      link : function(loc) {
        if (loc && loc != '') $.anchoring.set(loc);
        $.anchoring.retrieve();
      }
    },
    analyze : function(item) {
      var rel = $(item).attr('rel');
      if (/^([A-Z0-9\_\-\.]+)(\s)([A-Z0-9\_\-\.]+)/i.test(rel)) {
        var rels = rel.replace(/(\s){2,}/, '').split(' ');
        var data = rel.replace(/^([A-Z0-9\_\-\.]+)(\s)([A-Z0-9\_\-\.]+)(.*)/i, '$4').replace(/(\s){2,}/, '').split(' ');
        if (rels[1] != '' && $.anchoring.is_f(rels[1])) {
          eval('$.anchoring.runAs.'+ rels[1])(item.href, data);
        } else {
          $.anchoring.runAs.link(item.href, data);
        }
      } else {
        $.anchoring.runAs.link(item.href);
      }
    },
    anchor : function(loc) {
      $.anchoring.current = loc;
      $.anchoring.history.unshift($.anchoring.current);
    },
    addFunc : function(name, func) {$.anchoring.runAs[name] = func;},
    browseHistory : function() {alert($.anchoring.history);},
    parse : function(reload) {
      if (/(\#)(.*)$/.test(window.location.href)) {
        $.anchoring.anchor(window.location.href.replace(/^(.*)(\#)(.*)$/, '$3'));
        $.anchoring.location = window.location.href;
      } else if (reload) {
        window.location.reload();
      }
    },
    set : function(loc) {
      var base = (/(\#)(.*)$/.test(location.href) ? window.location.href.replace(/^(.*)(\#)(.*)$/, '$1') : window.location.href);
      var domain = base.replace(/(http|https)(\:\/\/)([a-z0-9\_\-\.\:]*)(\/)(.*)/i, '$1$2$3');
      loc = loc.replace(new RegExp(domain, 'i'), '');

      if (loc != $.anchoring.current) {
        $.anchoring.anchor(loc);
        $.anchoring.location = base +'#'+ loc;
        window.location.href = $.anchoring.location;
        if ($.browser.msie) document.execCommand('Stop');
        window.stop();
      }
    },
    is_f : function(func) {
      eval("var is_f = ($.anchoring.page != '' && typeof($.anchoring.runAs."+func+") == 'function');");
      return is_f;
    },
    sniff : function(reload) {
      $.anchoring.init = true;
      $.anchoring.page = $('body').attr('class');
      $.anchoring.parse(reload);
      if ($.anchoring.current) {
        if ($.anchoring.is_f($.anchoring.page)) {
          eval("$.anchoring.runAs."+$.anchoring.page)();
        } else {
          $.anchoring.runAs.link();
        }
      }
    }
  });
})(jQuery);