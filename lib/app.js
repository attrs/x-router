var path = require('path');
var URL = require('url');
var Router = require('tinyrouter');
var meta = require('./meta.js');
var normalize = require('./normalize.js');
var pathbar = require('./pathbar.js');
var debug = meta('debug') === 'true' ? true : false;

function parseQuery(query) {
  query = query.trim();
  if( query[0] === '?' ) query = query.substring(1);
  var match,
      pl     = /\+/g,
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); };
      
  var params = {};
  while (match = search.exec(query)) {
    var key = decode(match[1]);
    var value = decode(match[2]);
    if( Array.isArray(params[key]) ) params[key].push(value);
    else if( params[key] ) (params[key] = [params[key]]).push(value);
    else params[key] = value;
  }
  return params;
}

function addEventListener(scope, type, fn, bubble) { 
  if( scope.addEventListener ) scope.addEventListener(type, fn, bubble);
  else scope.attachEvent(type, fn); 
}

function capture(o) {
  return JSON.parse(JSON.stringify(o));
}

var Emitter = function(scope) {
  var listeners = {};
  
  var on = function(type, fn) {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
    return this;
  };
  
  var once = function(type, fn) {
    var wrap = function(e) {
      off(type, wrap);
      return fn.call(this, e);
    };
    body.on(type, wrap);
    return this;
  };
  
  var off = function(type, fn) {
    var fns = listeners[type];
    if( fns ) for(var i;~(i = fns.indexOf(fn));) fns.splice(i, 1);
    return this;
  };
  
  var emit = function(type, value) {
    var fns = listeners[type];
    (fns || []).forEach(function(fn) { fn.call(scope || this, value) });
    return this;
  };
  
  return {
    on: on,
    once: once,
    off: off,
    emit: emit
  };
};


var apps = [], seq = 100;

// class Application
function Application(id) {
  id = id || ('app-' + seq++);
  if( apps[id] ) throw new Error('[x-router] already defined id: ' + id);
  
  var baseURL = '',
    router = Router(id),
    hashrouter,
    request,
    response,
    session = {},
    engines = {},
    timeout,
    config = {},
    referer,
    history = [],
    currenthref,
    emitter = Emitter(router);
  
  apps.push(router);
  apps[id] = router;
  
  router.timeout = function(msec) {
    if( typeof msec !== 'number' ) return console.warn('illegal arguments', msec);
    timeout = msec;
  };
  
  router.emitter = function() {
    return emitter;
  };
  
  router.base = function(url) {
    if( !arguments.length ) return baseURL;
    if( !url ) {
      baseURL = '';
      return this;
    }
    baseURL = path.dirname(path.resolve(url, 'index.html'));
    return this;
  };
  
  var _get = router.get;
  router.get = function(key) {
    if( arguments.length <= 1 ) return config[key];
    return _get.apply(router, arguments);
  };
  
  router.set = function(key, value) {
    config[key] = value;
    if( key === 'debug' ) router.debug = value;
    return this;
  };
  
  router.router = function(name) {
    return Router(name);
  };
  
  router.util = {
    ajax: function(src, done) {
      if( !src ) throw new Error('missing src');
      var text, error;
      var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
      xhr.open('GET', src, true);
      xhr.onreadystatechange = function(e) {
        if( this.readyState == 4 ) {
          if( this.status == 0 || (this.status >= 200 && this.status < 300) ) done.call(router, null, this.responseText);
          else done.call(router, new Error('[' + this.status + '] ' + this.responseText));
        }
      };
      xhr.send();
    }
  };
  
  router.fullhref = function(url) {
    var state = router.state();
    var o = url;
    if( !url ) return baseURL || '/';
    
    url = url.trim();
    if( url[0] === '/' ) {
      url = baseURL + url;
    } else {
      var currentdir = path.dirname(state);
      
      if( currentdir.length <= 1 ) currentdir = '';
      else currentdir += '/';
      
      if( !state ) url = baseURL + '/' + url;
      else url = baseURL + currentdir + url;
    }
    
    return normalize(url.split('//').join('/')).fullpath;
  };
  
  router.engine = function(name, fn) {
    if( arguments.length === 1 ) return engines[name] || Application.engine(name);
    engines[name] = fn;
    return this;
  };
    
  router.on('replace', function(e) {
    if( router.debug ) console.info('replaced', e.detail);
    currenthref = e.detail.replaced;
    
    var request = e.detail.request;
    if( request.options.writestate !== false ) {
      history[history.length - 1] = e.detail.replaced;
      router.fire('changestate', {
        state: request.parentURL + request.url,
        request: request,
        response: e.detail.response
      });
    }
  });
  
  router.state = function(index) {
    index = +index || 0;
    return history[history.length - 1 + index];
  };
  
  // @deprecated
  router.laststate = function() {
    console.warn('[x-router] router.laststate() is deprecated, use router.state() instead');
    return history[history.length - 1];
  };
  
  // @deprecated
  router.lasthref = function() {
    console.warn('[x-router] router.lasthref() is deprecated, use router.referer() instead');
    return referer;
  };
  
  router.history = function() {
    return history;
  };
  
  router.referer = function() {
    return referer;
  };
  
  router.reload = function(statebase) {
    statebase = statebase === false ? false : true;
    
    if( !statebase ) {
      if( currenthref ) return router.href(currenthref, null, {force: true});
      return;
    }
    
    var state = router.state();
    if( state ) return router.href(state, null, {force: true});
  };
  
  router.href = function(requesthref, body, options) {
    if( !arguments.length ) return currenthref;
    if( typeof body === 'boolean' ) options = {writestate:body}, body = null;
    if( typeof options === 'boolean' ) options = {writestate:options};
    if( !options || typeof options !== 'object' ) options = {};
    if( !requesthref ) return console.error('[x-router] missing url');
    if( typeof requesthref === 'number' ) url = url + '';
    if( typeof requesthref !== 'string' ) return console.error('[x-router] illegal type of url');
    
    var fullhref = router.fullhref(requesthref);
    var href = fullhref.substring(baseURL.length) || '/';
    var parsed = normalize(href || '');
    var url = parsed.pathname;
    var force = options.force === true ? true : false;
    
    if( options.writestate === false ) force = true;
    if( router.get('always') === true ) force = true;
    
    if( router.debug ) console.info('href', requesthref, {
      fullhref: fullhref,
      href: href,
      url: url,
      force: force,
      prevstate: router.state(),
      referer: currenthref,
      writestate: options.writestate
    });
    
    if( !force && currenthref === parsed.fullpath ) return;
    
    referer = currenthref;
    currenthref = parsed.fullpath;
    if( options.writestate !== false ) {
      history.push(parsed.fullpath);
      if( history.length > 30 ) history = history.slice(history.length - 30);
    }
    
    if( router.debug ) console.info('request', currenthref);
    
    hashrouter = Router('hash');
    emitter = Emitter(router);
    var reqconfig = {};
    
    request = router.request = {
      referer: referer || '',
      app: router,
      requesthref: requesthref,
      originalhref: requesthref, // @deprecated
      fullhref: fullhref,
      href: parsed.fullpath,
      parsed: parsed,
      baseURL: baseURL,
      method: 'get',
      url: url || '/',
      options: options,
      hash: parsed.hash,
      hashname: parsed.hash, // @deprecated
      query: parseQuery(parsed.search),
      params: {},
      body: body || {},
      session: session,
      get: function(key) {
        console.warn('Deprecated: use response.get');
        return reqconfig[key];
      },
      set: function(key, value) {
        console.warn('Deprecated: use response.set');
        if( value === null || value === undefined ) delete reqconfig[key];
        else reqconfig[key] = value;
        return this;
      }
    };
    
    var render = function(src, options, odone) {
      if( arguments.length == 2 && typeof options === 'function' ) odone = options, options = null;
      
      var done = function(err, result) {
        if( err ) return odone ? odone.call(this, err) : console.error(err);
        var oarg = [].slice.call(arguments, 1);
        var arg = [null, target];
        if( odone ) odone.apply(this, arg.concat(oarg));
      };
      
      var o = {};
      var engine;
      
      if( !src ) {
        return done(new Error('missing src'));
      } if( typeof src === 'string' ) {
        var extname = path.extname(src).substring(1).toLowerCase();
        var defenginename = reqconfig['view engine'] || config['view engine'] || 'default';
        var enginename = (options && options.engine) || extname || defenginename;
        var base = reqconfig['views'] || config['views'] || '/';
        
        engine = router.engine(enginename) || router.engine(defenginename);
        if( !engine ) return done(new Error('not exists engine: ' + enginename));
        
        if( !(~src.indexOf('://') || src.indexOf('//') === 0) ) {
          if( src.trim()[0] === '/' ) src = '.' + src;
          o.src = path.join(base, src);
        } else {
          o.src = src;
        }
      } else if( typeof src === 'object' ) {
        var defenginename = reqconfig['view engine'] || config['view engine'] || 'default';
        var enginename = (options && options.engine) || (function() {
          for(var k in src) {
            if( router.engine(k) ) return k;
          }
        })();
        
        engine = router.engine(enginename) || router.engine(defenginename);
        if( !engine ) return done(new Error('not exists engine: ' + enginename));
        
        o.html = src[enginename || 'html'];
      } else {
        return done(new Error('illegal type of src: ' + typeof src));
      }
      
      if( !options ) options = {};
      if( typeof options === 'string' ) options = {target:options};
      if( typeof options !== 'object' ) return done(new TypeError('options must be an object or string(target)'));
      
      for(var k in options) o[k] = options[k];
      
      var target = o.target || reqconfig['view target'] || config['view target'];
      if( typeof target === 'string' ) target = document.querySelector(target);
      if( !target ) return done(new Error('view target not found: ' + (o.target || reqconfig['view target'] || config['view target'])));
      o.target = target;
      
      if( router.fire('beforerender', {
        fullhref: fullhref,
        href: parsed.fullpath,
        options: o,
        src: src,
        target: target,
        url: request.currentURL,
        request: request,
        response: response
      }) ) {
        engine.call(router, o, function(err) {
          if( err ) return done(err);
          
          router.fire('render', {
            fullhref: fullhref,
            href: parsed.fullpath,
            options: o,
            src: src,
            target: target,
            url: request.currentURL,
            request: request,
            response: response
          });
          
          target.xrouter = router;
          done.apply(this, arguments);
        });
      }
      
      return this;
    };
    
    render.html = function(html, options, done) {
      if( typeof html !== 'string' ) return done && done(new Error('html must be a string'));
      
      html = {html: html};
      render.apply(this, arguments);
      return this;
    };
    
    var finished = false;
    response = router.response = {
      render: render,
      get: function(key) {
        return reqconfig[key];
      },
      set: function(key, value) {
        if( value === null || value === undefined ) delete reqconfig[key];
        else reqconfig[key] = value;
        return this;
      },
      hash: function(hash, fn) {
        hashrouter.get('#' + hash, fn);
        return this;
      },
      redirect: function(to, body, options) {
        response.end();
        options = options || {};
        options.redirect = true;
        body = body || request.body || {};
        
        if( to[0] !== '#' && to[0] !== '/' ) {
          to = path.resolve(path.join(request.parentURL, request.url), to);
        }
        
        router.fire('redirect', {
          fullhref: fullhref,
          href: parsed.fullpath,
          options: options,
          referer: referer,
          url: request.currentURL,
          to: to,
          requested: arguments[0],
          request: request,
          response: response
        });
        
        router.href(to, body, options);
        return this;
      },
      emit: function(type, value) {
        return emmitter.emit(type, value);
      },
      end: function() {
        if( finished ) return console.warn('[x-router] request \'' + request.href + '\' already finished.');
        finished = true;
        
        //router.exechash(req.hash, fire);
        router.fire('end', {
          fullhref: fullhref,
          href: parsed.fullpath,
          url: request.currentURL,
          request: request,
          response: response
        });
      }
    };
    
    if( timeout > 0 ) {
      setTimeout(function() {
        if( finished ) return;
        console.warn('[x-router] router timeout(' + timeout + ')');
        response.end();
      }, timeout);
    }
    
    router.fire('request', {
      fullhref: fullhref,
      href: parsed.fullpath,
      url: url,
      request: request,
      response: response
    });
    
    if( options.writestate !== false ) router.fire('changestate', {
      state: url,
      request: request,
      response: response
    });
    
    router(request, response);
    return this;
  };
  
  router.on('*', function wrapapp(e) {
    e.app = router;
    if( !e.stopped ) Application.fire(e);
  });
  
  return router;
};

// initialize context feature
(function() {
  var currentapp, apps = {}, listeners = {}, engines = {};
  
  var current = function(app) {
    if( !arguments.length ) return currentapp || apps['root'];
    currentapp = app;
    return this;
  };
  
  var get = function(name) {
    return apps[name];
  }
  
  var href = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.href.apply(app, arguments);
  };
  
  var reload = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.reload.apply(app, arguments);
  };
  
  var referer = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.referer.apply(app, arguments);
  };
  
  var state = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.state.apply(app, arguments);
  };
  
  // @deprecated
  var laststate = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.laststate.apply(app, arguments);
  };
  
  // @deprecated
  var lasthref = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.lasthref.apply(app, arguments);
  };
  
  var history = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.history.apply(app, arguments);
  };
  
  var emitter = function() {
    var app = current();
    if( !app ) return console.warn('[x-router] not yet initialized');
    return app.emitter();
  };
  
  var on = function(type, fn) {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
    return this;
  };
  
  var once = function(type, fn) {
    var wrap = function(e) {
      off(type, wrap);
      return fn.call(Application, e);
    };
    on(type, wrap);
    return this;
  };
  
  var off = function(type, fn) {
    var fns = listeners[type];
    if( fns )
      for(var i;~(i = fns.indexOf(fn));) fns.splice(i, 1);
    
    return this;
  };

  var fire = function(event) {
    if( !listeners[event.type] ) return;
    
    var stopped = false, prevented = false;
    var action = function(listener) {
      if( stopped ) return;
      listener.call(this, event);
      if( event.defaultPrevented === true ) prevented = true;
      if( event.stoppedImmediate === true ) stopped = true;
    };
    
    listeners[event.type].forEach(action);
    return !prevented;
  };
  
  var engine = function(name, fn) {
    if( arguments.length === 1 ) return engines[name];
    engines[name] = fn;
    return this;
  };
  
  Application.apps = apps;
  Application.get = get;
  Application.Router = Router;
  Application.current = current;
  Application.reload = reload;
  Application.href = href;
  Application.history = history;
  Application.referer = referer;
  Application.state = state;
  Application.engine = engine;
  Application.on = on;
  Application.once = once;
  Application.off = off;
  Application.fire = fire;
  Application.emitter = emitter;
  
  // @deprecated
  Application.lasthref = lasthref;
  Application.laststate = laststate;
})();

// add default rendering engine
Application.engine('default', function(options, done) {
  var target = options.target;
  var src = options.src;
  var html = options.html;
  
  var render = function(err, html) {
    if( err ) return done(err);
    if( typeof html === 'object' && html.html ) html = html.html;
    if( typeof html !== 'string' ) return done(new Error('html must be a string'));
    
    target.innerHTML = html;
    done();
  };
  
  if( src ) this.util.ajax(src, render);
  else if( html ) render(null, html);
  else done(new Error('missing src or html'));
});

module.exports = Application;