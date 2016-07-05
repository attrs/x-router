/*!
* browser-routes v0.0.8
* https://github.com/attrs/browser-routes
*
* Copyright attrs and others
* Released under the MIT license
* https://github.com/attrs/browser-routes/blob/master/LICENSE
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Routes", [], factory);
	else if(typeof exports === 'object')
		exports["Routes"] = factory();
	else
		root["Routes"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var path = __webpack_require__(1);
	var RoutePattern = __webpack_require__(3);
	
	/*
	(function() {
	  var defined = '/hello/:planet?foo=:foo&fruit=:fruit#:section';
	  var url = '/hello/earth?foo=bar&fruit=apple#chapter2';
	  var pattern = RoutePattern.fromString(defined);
	  var matches = pattern.matches(url);
	  var params = pattern.match(url);
	  
	  console.log('match', matches);
	  console.log(JSON.stringify(params, null, '  '));
	});
	*/
	
	function normalize(url, doc) {
	  if( !url || typeof url !== 'string' ) throw new TypeError('illegal url');
	  var a = (doc || document).createElement('a');
	  a.href = url;
	  return {
	    href: a.href,
	    protocol: a.protocol,
	    hostname: a.hostname,
	    port: a.port,
	    pathname: a.pathname,
	    fullpath: a.pathname + (a.search ? a.search : '') + (a.hash ? a.hash : ''),
	    search: a.search,
	    hash: a.hash,
	    host: a.host
	  };
	}
	
	function config(name, alt) {
	  var root = document.head.querySelector('meta[name="' + name + '"][content]');
	  return (root && root.getAttribute('content')) || alt;
	}
	
	function current(mode) {
	  if( mode === 'hash' ) {
	    return location.hash;
	  }
	
	  return location.href;
	}
	
	function endsWith(str, word) {
	  var i = str.toLowerCase().indexOf(word);
	  return i > 0 && i === str.length - word.length;
	}
	
	function parseQuery(query) {
	  query = query.trim();
	  if( query[0] === '?' ) query = query.substring(1);
	  var match,
	      pl     = /\+/g,
	      search = /([^&=]+)=?([^&]*)/g,
	      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
	      
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
	
	function defaultChecker() {
	  var tag = document.currentScript || document._currentScript;
	  return function() {
	    return tag && tag.ownerDocument && tag.ownerDocument.documentElement && tag.ownerDocument.documentElement.contains(tag);
	  };
	}
	
	function addEventListener(scope, type, fn, bubble) { 
	  if( scope.attachEvent ) scope.attachEvent(type,fn); 
	  else scope.addEventListener(type,fn,bubble);
	}
	
	function patternize(source, ignoresubdir) {
	  var pettern = RoutePattern.fromString(source);
	  var ap = RoutePattern.fromString(source + '/*after');
	  
	  return {
	    match: function(url) {
	      if( source === '/' ) return ignoresubdir ? true : (source === url);
	      
	      if( pettern.matches(url) ) {
	        return pettern.match(url).namedParams;
	      } else if( ignoresubdir && ap.matches(url) ) {
	        var params = ap.match(url).namedParams;
	        delete params.after;
	        return params;
	      }
	      return false;
	    },
	    matches: function(url) {
	      return pattern.matches(url) ? true : (ignoresubdir && ap.matches(url) ? true : false);
	    }
	  };
	}
	
	function dividepath(axis, full) {
	  if( axis[0] === '/' ) axis = axis.substring(1);
	  if( full[0] === '/' ) full = full.substring(1);
	  if( endsWith(axis, '/') ) axis = axis.substring(0, axis.length - 1);
	  if( endsWith(full, '/') ) full = full.substring(0, full.length - 1);
	  if( !axis ) return {
	    sub: '/' + full,
	    parent: '/'
	  };
	  
	  while(~axis.indexOf('//')) axis.split('//').join('/');
	  while(~full.indexOf('//')) full.split('//').join('/');
	  
	  axis = axis.split('/');
	  full = full.split('/');
	  var sub = [], parent = [];
	  
	  for(var i=0; i < full.length; i++) {
	    if( axis[i] && axis[i][0] !== ':' &&  full[i] !== axis[i] ) return null;
	    
	    if( i >= axis.length ) sub.push(full[i]);
	    else parent.push(full[i]);
	  }
	  
	  return {
	    parent: '/' + parent.join('/'),
	    sub: '/' + sub.join('/')
	  };
	}
	
	/*
	console.log('/', subpath('/', '/system/user/list'));
	console.log('/system', subpath('/system', '/system/user/list'));
	console.log('/system/user', subpath('/system/user', '/system/user/list'));
	console.log('/system/user/list', subpath('/system/user/list', '/system/user/list'));
	console.log('/:a', subpath('/:a', '/system/user/list'));
	console.log('/:a/:b', subpath('/:a/:b', '/system/user/list'));
	console.log('/:a/:b/:c', subpath('/:a/:b/:c', '/system/user/list'));
	
	var p = patternize('/', true);
	console.log('/a/b/c', p.match('/a/b/c'));
	*/
	
	function capture(o) {
	  return JSON.parse(JSON.stringify(o));
	}
	
	function redirector(url) {
	  return function redirector(req, res, next) {
	    res.redirect(url);
	  };
	}
	
	function mix() {
	  var result = {};
	  [].forEach.call(arguments, function(o) {
	    if( o && typeof o === 'object' ) {
	      for(var k in o ) result[k] = o[k];
	    }
	  });
	  return result;
	}
	
	
	// factory Router
	function Router(id) {
	  id = id || 'unknwon';
	  var boot = true;
	  var routes = [];
	  var listeners = {};
	  
	  var body = function Router(req, res, next) {
	    //console.log('router', req.url);
	    if( !req.url || req.url[0] !== '/' ) throw new Error('illegal url: ' + req.url);
	    
	    next = next || function() {};
	    
	    //console.log('body', req.baseUrl, req.url);
	    var fns = [];
	    routes.forEach(function(route) {
	      //console.log('[' + name + '] route', route);
	      if( route.type === 'boot' ) {
	        if( boot ) fns.push(route);
	        return;
	      }
	      
	      //console.log(route.path, req.url, route.pattern.match(req.url));
	      var params = route.pattern.match(req.url);
	      if( params ) return fns.push({
	        type: route.type,
	        fn: route.fn,
	        path: route.path,
	        pattern: route.pattern,
	        params: params
	      });
	    });
	    
	    if( !fns.length ) return next();
	    
	    /*console.info('[' + name + '] fns', req.url, fns.map(function(o) {
	      return (o.path || 'any') + '(' + (o.fn.name || 'unnamed') + ')';
	    }));*/
	    
	    req.boot = boot;
	    boot = false;
	    
	    var oParentUrl = req.parentUrl || '';
	    var oUrl = req.url;
	    var oParams = req.params || {};
	    var i = 0;
	    var forward = function(err) {
	      req.params = oParams;
	      req.parentUrl = oParentUrl;
	      req.url = oUrl;
	      
	      var route = fns[i++];
	      if( !route ) return next(err);
	      
	      var div = dividepath(route.path || '', req.url);
	      req.params = mix(oParams, route.params);
	      
	      if( route.fn.__router__ ) {
	        req.url = div.sub;
	        req.parentUrl = path.join(oParentUrl, div.parent);
	        /*console.log('routing', capture({
	          //type: type,
	          //id: route.fn.id,
	          path: route.path,
	          url: req.url,
	          parentUrl: req.parentUrl,
	          oParentUrl: oParentUrl,
	          oUrl: oUrl
	        }));*/
	        
	        route.fn.apply(body, [req, res, forward]);
	      } else {
	        route.fn.apply(body, [req, res, forward]);
	      }
	    };
	    forward();
	  };
	  
	  body.id = id;
	  body.__router__ = true;
	  body.exists = function(url) {
	    var exists = false;
	    routes.forEach(function(route) {
	      if( exists ) return;
	      if( route.type === 'get' ) {
	        var params = route.pattern.match(url);
	        if( params ) exists = true;
	      } else if( route.type === 'use' ) {
	        exists = route.fn.exists(url.substring(route.path.length));
	      }
	    });
	    return exists;
	  };
	  
	  body.use = function(path, fn) {
	    if( typeof path === 'function' ) fn = path, path = '/';
	    if( typeof path !== 'string' ) throw new TypeError('illegal type of path:' + typeof(path));
	    if( typeof fn === 'string' ) fn = redirector(fn);
	    if( typeof fn !== 'function' ) throw new TypeError('illegal type of router:' + typeof(fn));
	    path = path ? path.trim() : '/';
	    if( path[0] !== '/' ) path = '/' + path;
	    
	    routes.push({
	      type: 'use',
	      path: path,
	      pattern: patternize(path, true),
	      fn: fn
	    });
	    return this;
	  };
	  
	  body.get = function(path, fn) {
	    if( typeof path === 'function' ) fn = path, path = '/';
	    if( typeof path !== 'string' ) throw new TypeError('illegal type of path:' + typeof(path));
	    if( typeof fn === 'string' ) fn = redirector(fn);
	    if( typeof fn !== 'function' ) throw new TypeError('illegal type of router:' + typeof(fn));
	    path = path ? path.trim() : '/';
	    if( path[0] !== '/' ) path = '/' + path;
	    
	    routes.push({
	      type: 'get',
	      path: path,
	      pattern: patternize(path),
	      fn: fn
	    });
	    return this;
	  };
	  
	  body.boot = function(fn) {
	    if( typeof fn !== 'function' ) throw new TypeError('illegal type of router:' + typeof(fn));
	    routes.push({
	      type: 'boot',
	      fn: fn
	    });
	    return this;
	  };
	  
	  body.notfound = function(fn) {
	    body.on('notfound', fn);
	    return this;
	  };
	  
	  body.error = function(fn) {
	    body.on('error', fn);
	    return this;
	  };
	  
	  body.drop = function(fn) {
	    var dropfns = [];
	    routes.forEach(function(route) {
	      if( route.fn === fn ) dropfns.push(route);
	    });
	    
	    dropfns.forEach(function(route) {
	      routes.splice(routes.indexOf(route), 1);
	    });
	    return this;
	  };
	  
	  body.clear = function() {
	    routes = [];
	    return this;
	  };
	  
	  body.on = function(type, fn) {
	    listeners[type] = listeners[type] || [];
	    listeners[type].push(fn);
	    return this;
	  };
	  
	  body.once = function(type, fn) {
	    var wrap = function(e) {
	      body.off(type, wrap);
	      return fn.call(this, e);
	    };
	    body.on(type, wrap);
	    return this;
	  };
	
	  body.off = function(type, fn) {
	    var fns = listeners[type];
	    if( fns )
	      for(var i;~(i = fns.indexOf(fn));) fns.splice(i, 1);
	    
	    return this;
	  };
	
	  body.fire = function(type, detail) {
	    if( type === 'error' && !(listeners[type] && isteners[type].length) )
	      return console.error('[routes] error', detail);
	    
	    (listeners[type] || []).forEach(function(listener) {
	      listener.call(this, {
	        type: type,
	        detail: detail || {}
	      });
	    });
	  };
	  
	  return body;
	}
	
	// class Routes
	function Routes(options) {
	  if( !(this instanceof Routes) ) throw new Error('illegal state: \'new Routes()\' instead of \'Routes()\'');
	  
	  options = options || {};
	  
	  var self = this;
	  var baseURL = '';
	  var router = Router('root'), request, response, hashroutes;
	  
	  //console.info('baseURL', baseURL);
	  
	  this.config = function(key, value) {
	    var o = options;
	    if( arguments.length === 1 ) return o(key);
	    if( value === null ) delete o[key];
	    else o[key] = value;
	    return this;
	  };
	  
	  this.base = function(url) {
	    if( !arguments.length ) return baseURL;
	    if( !url ) {
	      baseURL = '';
	      return this;
	    }
	    baseURL = path.dirname(path.resolve(url, 'index.html'));
	    //console.log('baseURL', baseURL);
	    return this;
	  };
	  
	  this.router = function(name) {
	    return Router(name);
	  };
	  
	  this.normalize = function(url) {
	    url = url.trim();
	    if( !url ) return baseURL;
	    if( url[0] === '/' ) return baseURL + url;
	    return normalize(url).fullpath;
	  };
	  
	  var exec = this.exec = function(requrl) {
	    //console.info('exec', requrl);
	    var parsed = normalize(requrl);
	    var hash = parsed.hash;
	    var query = parsed.search;
	    var url = parsed.pathname;
	    var fullpath = parsed.fullpath;
	    if( request && request.requestURL && fullpath === request.requestURL ) return;
	    
	    //console.log('exec', baseURL, requrl, url, url.indexOf(baseURL), parsed);
	    if( baseURL && url.startsWith(baseURL) ) {
	      url = url.substring(baseURL.length);
	    } else if( baseURL ){
	      return console.error('given url is not a sub url of base url \'' + baseURL + '\'');
	    }
	    
	    hashroutes = [];
	    request = {
	      method: 'get',
	      parsed: parsed,
	      baseURL: baseURL,
	      requestURL: fullpath,
	      url: url || '/',
	      hashname: hash,
	      query: parseQuery(query),
	      params: {}
	    };
	    
	    //console.log('req', capture(request));
	    
	    response = {
	      redirect: function(tourl) {
	        //console.info('redirect', url, request.parentUrl, request.url, request);
	        if( tourl.startsWith('#') ) {
	          location.href = tourl;
	        } else if( tourl.startsWith('/') ) {
	          exec(path.join(baseURL, tourl));
	        } else {
	          exec(path.join(baseURL, request.parentUrl, request.url, tourl));
	        }
	        
	        router.fire('redirect', {
	          requestURL: fullpath,
	          url: url,
	          request: request,
	          response: response
	        });
	        
	        return this;
	      },
	      hash: function(hash, fn) {
	        hashroutes.push({hash:hash, fn:fn});
	      }
	    };
	    
	    router.fire('request', {
	      requestURL: fullpath,
	      url: url,
	      request: request,
	      response: response
	    });
	    
	    router(request, response);
	    return this;
	  };
	  
	  this.exechash = function() {
	    // TODO: hash 변경. 현재 request 의 hash 를 라우팅한다.
	    return this;
	  };
	  
	  // --- wire to router
	  this.use = function(path, fn) {
	    router.use.apply(router, arguments);
	    return this;
	  };
	  
	  this.boot = function(fn) {
	    router.boot(fn);
	    return this;
	  };
	  
	  this.get = function(path, fn) {
	    router.get(path, fn);
	    return this;
	  };
	  
	  this.notfound = function(fn) {
	    router.notfound(fn);
	    return this;
	  };
	  
	  this.error = function(fn) {
	    router.error(fn);
	    return this;
	  };
	  
	  this.drop = function(fn) {
	    router.drop(fn);
	    return this;
	  };
	  
	  this.exists = function(path) {
	    return router.exists(path);
	  };
	  
	  this.clear = function() {
	    router.clear();
	    return this;
	  };
	  
	  this.on = function(type, fn) {
	    router.on(type, fn);
	    return this;
	  };
	  
	  this.once = function(type, fn) {
	    router.once(type, fn);
	    return this;
	  };
	  
	  this.off = function(type, fn) {
	    router.off(type, fn);
	    return this;
	  };
	}
	
	var routes = new Routes();
	routes.Routes = Routes;
	routes.Router = Router;
	
	// instantiate main routes && trigger
	(function() {
	  //var always = config('routes.always') === 'true' ? true : true;
	  var mode = config('routes.mode') || (history.pushState ? 'pushstate' : 'hash');
	  
	  if( mode === 'pushstate' ) {
	    if( !history.pushState ) return console.error('[routes] unsupported \'history.pushState\'');
	    
	    var _pushState = history.pushState;
	    history.pushState = function(state, title, url) {
	      _pushState.apply(history, arguments);
	      routes.exec(location.href);
	    };
	    
	    window.onpopstate = function(e) {
	      routes.exec(location.href);
	    };
	    
	    routes.on('request', function(e) {
	      if( normalize(location.href).fullpath !== normalize(e.detail.requestURL).fullpath ) {
	        _pushState.call(history, null, null, e.detail.requestURL);
	      }
	    });
	    
	    routes.href = function(url) {
	      history.pushState(null, null, routes.normalize(url));
	    };
	  } else if( mode === 'hash' ) {
	    if( !('onhashchange' in window) ) return console.error('[routes] unsupported \'onhashchange\'');
	    
	    addEventListener(window, 'hashchange', function() {
	      routes.exec(location.hash);
	    });
	    
	    routes.on('redirect', function(e) {
	      location.href = '#' + e.detail.url;
	    });
	    
	    routes.href = function(url) {
	      location.href = '#' + routes.normalize(url);
	    };
	  }
	  
	  var observer;
	  function bootup() {
	    function routify(a) {
	      if( !a.__routes_managed__ ) {
	        a.__routes_managed__ = true;
	        addEventListener(a, 'click', function(e) {
	          var href = a.getAttribute('href');
	          var p = href.indexOf(':'), s = href.indexOf('/');
	          if( !href || (~p && p < s) ) return;
	          e.preventDefault();
	          routes.href(href);
	        });
	      }
	      return this;
	    }
	  
	    function scan() {
	      [].forEach.call(document.querySelectorAll('[routes], [data-routes]'), routify);
	      return this;
	    }
	    
	    // observe anchor tags
	    if( observer ) observer.disconnect();
	    observer = new MutationObserver(function(mutations) {
	      mutations.forEach(function(mutation) {
	        [].forEach.call(mutation.addedNodes, function(node) {
	          if( node.nodeType === 1 ) {
	            if( node.hasAttribute('routes') ) routify(node);
	            if( node.hasAttribute('data-routes') ) routify(node);
	            if( node.querySelectorAll ) [].forEach.call(node.querySelectorAll('[routes], [data-routes]'), routify);
	          }
	        });
	      });
	    });
	    
	    observer.observe(document.body, {
	      childList: true,
	      subtree: true
	    });
	    
	    scan();
	    routes.exec(location.href);
	  }
	  
	  if( document.body ) bootup();
	  else addEventListener(document, 'DOMContentLoaded', bootup);
	  
	  window.routes = routes.href;
	})();
	
	module.exports = routes;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }
	
	  return parts;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};
	
	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};
	
	
	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	exports.sep = '/';
	exports.delimiter = ':';
	
	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	exports.extname = function(path) {
	  return splitPath(path)[3];
	};
	
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}
	
	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ },
/* 2 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	(function () {
	  try {
	    cachedSetTimeout = setTimeout;
	  } catch (e) {
	    cachedSetTimeout = function () {
	      throw new Error('setTimeout is not defined');
	    }
	  }
	  try {
	    cachedClearTimeout = clearTimeout;
	  } catch (e) {
	    cachedClearTimeout = function () {
	      throw new Error('clearTimeout is not defined');
	    }
	  }
	} ())
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = cachedSetTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    cachedClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        cachedSetTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var querystring = __webpack_require__(4);
	
	// # Utility functions
	//
	// ## Shallow merge two or more objects, e.g.
	// merge({a: 1, b: 2}, {a: 2}, {a: 3}) => {a: 3, b: 2}
	function merge() {
	  return [].slice.call(arguments).reduce(function (merged, source) {
	    for (var prop in source) {
	      merged[prop] = source[prop];
	    }
	    return merged;
	  }, {});
	}
	
	// Split a location string into different parts, e.g.:
	// splitLocation("/foo/bar?fruit=apple#some-hash") => {
	//  path: "/foo/bar", queryString: "fruit=apple", hash: "some-hash" 
	// }
	function splitLocation(location) {
	  var re = /([^\?#]*)?(\?[^#]*)?(#.*)?$/;
	  var match = re.exec(location);
	  return {
	    path: match[1] || '',
	    queryString: match[2] && match[2].substring(1) || '',
	    hash: match[3] && match[3].substring(1) || ''
	  }
	}
	
	// # QueryStringPattern
	// The QueryStringPattern holds a compiled version of the query string part of a route string, i.e.
	// ?foo=:foo&fruit=:fruit
	var QueryStringPattern = (function () {
	
	  // The RoutePattern constructor
	  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
	  // location path
	  function QueryStringPattern(options) {
	
	    // The query parameters specified
	    this.params = options.params;
	
	    // if allowWildcards is set to true, unmatched query parameters will be ignored
	    this.allowWildcards = options.allowWildcards;
	
	    // The original route string (optional)
	    this.routeString = options.routeString;
	  }
	
	  QueryStringPattern.prototype.matches = function (queryString) {
	    var givenParams = (queryString || '').split("&").reduce(function (params, pair) {
	      var parts = pair.split("="),
	        name = parts[0],
	        value = parts[1];
	      if (name) params[name] = value;
	      return params;
	    }, {});
	
	    var requiredParam, requiredParams = [].concat(this.params);
	    while (requiredParam = requiredParams.shift()) {
	      if (!givenParams.hasOwnProperty(requiredParam.key)) return false;
	      if (requiredParam.value && givenParams[requiredParam.key] != requiredParam.value) return false;
	    }
	    if (!this.allowWildcards && this.params.length) {
	      if (Object.getOwnPropertyNames(givenParams).length > this.params.length) return false;
	    }
	    return true;
	  };
	
	  QueryStringPattern.prototype.match = function (queryString) {
	
	    if (!this.matches(queryString)) return null;
	
	    var data = {
	      params: [],
	      namedParams: {},
	      namedQueryParams: {}
	    };
	
	    if (!queryString) {
	      return data;
	    }
	
	    // Create a mapping from each key in params to their named param
	    var namedParams = this.params.reduce(function (names, param) {
	      names[param.key] = param.name;
	      return names;
	    }, {});
	
	    var parsedQueryString = querystring.parse(queryString);
	    Object.keys(parsedQueryString).forEach(function(key) {
	      var value = parsedQueryString[key];
	      data.params.push(value);
	      if (namedParams[key]) {
	        data.namedQueryParams[namedParams[key]] = data.namedParams[namedParams[key]] = value;
	      }
	    });
	    return data;
	  };
	
	  QueryStringPattern.fromString = function (routeString) {
	
	    var options = {
	      routeString: routeString,
	      allowWildcards: false,
	      params: []
	    };
	
	    // Extract named parameters from the route string
	    // Construct an array with some metadata about each of the named parameters
	    routeString.split("&").forEach(function (pair) {
	      if (!pair) return;
	
	      var parts = pair.split("="),
	        name = parts[0],
	        value = parts[1] || '';
	
	      var wildcard = false;
	
	      var param = { key: name };
	
	      // Named parameters starts with ":"
	      if (value.charAt(0) == ':') {
	        // Thus the name of the parameter is whatever comes after ":"
	        param.name = value.substring(1);
	      }
	      else if (name == '*' && value == '') {
	        // If current param is a wildcard parameter, the options are flagged as accepting wildcards
	        // and the current parameter is not added to the options' list of params
	        wildcard = options.allowWildcards = true;
	      }
	      else {
	        // The value is an exact match, i.e. the route string 
	        // page=search&q=:query will match only when the page parameter is "search"
	        param.value = value;
	      }
	      if (!wildcard) {
	        options.params.push(param);
	      }
	    });
	    return new QueryStringPattern(options);
	  };
	
	  return QueryStringPattern;
	})();
	
	// # PathPattern
	// The PathPattern holds a compiled version of the path part of a route string, i.e.
	// /some/:dir
	var PathPattern = (function () {
	
	  // These are the regexps used to construct a regular expression from a route pattern string
	  // Based on route patterns in Backbone.js
	  var
	    pathParam = /:\w+/g,
	    splatParam = /\*\w+/g,
	    namedParams = /(:[^\/\.]+)|(\*\w+)/g,
	    subPath = /\*/g,
	    escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
	
	  // The PathPattern constructor
	  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
	  // location path
	  function PathPattern(options) {
	    // The route string are compiled to a regexp (if it isn't already)
	    this.regexp = options.regexp;
	
	    // The query parameters specified in the path part of the route
	    this.params = options.params;
	
	    // The original routestring (optional)
	    this.routeString = options.routeString;
	  }
	
	  PathPattern.prototype.matches = function (pathname) {
	    return this.regexp.test(pathname);
	  };
	
	  // Extracts all matched parameters
	  PathPattern.prototype.match = function (pathname) {
	
	    if (!this.matches(pathname)) return null;
	    
	    // The captured data from pathname
	    var data = {
	      params: [],
	      namedParams: {}
	    };
	
	    // Using a regexp to capture named parameters on the pathname (the order of the parameters is significant)
	    (this.regexp.exec(pathname) || []).slice(1).forEach(function (value, idx) {
	      if(value !== undefined) {
	        value = decodeURIComponent(value);
	      }
	
	      data.namedParams[this.params[idx]] = value;
	      data.params.push(value);
	    }, this);
	
	    return data;
	  };
	
	  PathPattern.routePathToRegexp = function (path) {
	    path = path
	      .replace(escapeRegExp, "\\$&")
	      .replace(pathParam, "([^/]+)")
	      .replace(splatParam, "(.*)?")
	      .replace(subPath, ".*?")
	      .replace(/\/?$/, "/?");
	    return new RegExp("^/?" + path + "$");
	  };
	
	  // This compiles a route string into a set of options which a new PathPattern is created with 
	  PathPattern.fromString = function (routeString) {
	
	    // Whatever comes after ? and # is ignored
	    routeString = routeString.split(/\?|#/)[0];
	
	    // Create the options object
	    // Keep the original routeString and a create a regexp for the pathname part of the url
	    var options = {
	      routeString: routeString,
	      regexp: PathPattern.routePathToRegexp(routeString),
	      params: (routeString.match(namedParams) || []).map(function (param) {
	        return param.substring(1);
	      })
	    };
	
	    // Options object are created, now instantiate the PathPattern
	    return new PathPattern(options);
	  };
	
	  return PathPattern;
	}());
	
	// # RegExpPattern
	// The RegExpPattern is just a simple wrapper around a regex, used to provide a similar api as the other route patterns
	var RegExpPattern = (function () {
	  // The RegExpPattern constructor
	  // Wraps a regexp and provides a *Pattern api for it
	  function RegExpPattern(regex) {
	    this.regex = regex;
	  }
	
	  RegExpPattern.prototype.matches = function (loc) {
	    return this.regex.test(loc);
	  };
	
	  // Extracts all matched parameters
	  RegExpPattern.prototype.match = function (location) {
	
	    if (!this.matches(location)) return null;
	
	    var loc = splitLocation(location);
	
	    return {
	      params: this.regex.exec(location).slice(1),
	      queryParams: querystring.parse(loc.queryString),
	      namedParams: {}
	    };
	  };
	
	  return RegExpPattern;
	}());
	
	// # RoutePattern
	// The RoutePattern combines the PathPattern and the QueryStringPattern so it can represent a full location
	// (excluding the scheme + domain part)
	// It also allows for having path-like routes in the hash part of the location
	// Allows for route strings like:
	// /some/:page?param=:param&foo=:foo#:bookmark
	// /some/:page?param=:param&foo=:foo#/:section/:bookmark
	// 
	// Todo: maybe allow for parameterization of the kind of route pattern to use for the hash?
	// Maybe use the QueryStringPattern for cases like
	// /some/:page?param=:param&foo=:foo#?onlyCareAbout=:thisPartOfTheHash&*
	// Need to test how browsers handles urls like that
	var RoutePattern = (function () {
	
	  // The RoutePattern constructor
	  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
	  // location path
	  function RoutePattern(options) {
	    // The route string are compiled to a regexp (if it isn't already)
	    this.pathPattern = options.pathPattern;
	    this.queryStringPattern = options.queryStringPattern;
	    this.hashPattern = options.hashPattern;
	
	    // The original routestring (optional)
	    this.routeString = options.routeString;
	  }
	
	  RoutePattern.prototype.matches = function (location) {
	    // Whatever comes after ? and # is ignored
	    var loc = splitLocation(location);
	
	    return (!this.pathPattern || this.pathPattern.matches(loc.path)) &&
	      (!this.queryStringPattern || this.queryStringPattern.matches(loc.queryString) ) &&
	      (!this.hashPattern || this.hashPattern.matches(loc.hash))
	  };
	
	  // Extracts all matched parameters
	  RoutePattern.prototype.match = function (location) {
	
	    if (!this.matches(location)) return null;
	
	    // Whatever comes after ? and # is ignored
	    var loc = splitLocation(location),
	      match,
	      pattern;
	
	    var data = {
	      params: [],
	      namedParams: {},
	      pathParams: {},
	      queryParams: querystring.parse(loc.queryString),
	      namedQueryParams: {},
	      hashParams: {}
	    };
	
	    var addMatch = function (match) {
	      data.params = data.params.concat(match.params);
	      data.namedParams = merge(data.namedParams, match.namedParams);
	    };
	
	    if (pattern = this.pathPattern) {
	      match = pattern.match(loc.path);
	      if (match) addMatch(match);
	      data.pathParams = match ? match.namedParams : {};
	    }
	    if (pattern = this.queryStringPattern) {
	      match = pattern.match(loc.queryString);
	      if (match) addMatch(match);
	      data.namedQueryParams = match ? match.namedQueryParams : {};
	    }
	    if (pattern = this.hashPattern) {
	      match = pattern.match(loc.hash);
	      if (match) addMatch(match);
	      data.hashParams = match ? match.namedParams : {};
	    }
	    return data;
	  };
	
	  // This compiles a route string into a set of options which a new RoutePattern is created with 
	  RoutePattern.fromString = function (routeString) {
	    var parts = splitLocation(routeString);
	
	    var matchPath = parts.path;
	    var matchQueryString = parts.queryString || routeString.indexOf("?") > -1;
	    var matchHash = parts.hash || routeString.indexOf("#") > -1;
	
	    // Options object are created, now instantiate the RoutePattern
	    return new RoutePattern({
	      pathPattern: matchPath && PathPattern.fromString(parts.path),
	      queryStringPattern: matchQueryString && QueryStringPattern.fromString(parts.queryString),
	      hashPattern: matchHash && PathPattern.fromString(parts.hash),
	      routeString: routeString
	    });
	  };
	
	  return RoutePattern;
	}());
	
	// CommonJS export
	module.exports = RoutePattern;
	
	// Also export the individual pattern classes
	RoutePattern.QueryStringPattern = QueryStringPattern;
	RoutePattern.PathPattern = PathPattern;
	RoutePattern.RegExpPattern = RegExpPattern;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.decode = exports.parse = __webpack_require__(5);
	exports.encode = exports.stringify = __webpack_require__(6);


/***/ },
/* 5 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};
	
	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }
	
	  var regexp = /\+/g;
	  qs = qs.split(sep);
	
	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }
	
	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }
	
	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;
	
	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }
	
	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);
	
	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }
	
	  return obj;
	};
	
	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;
	
	    case 'boolean':
	      return v ? 'true' : 'false';
	
	    case 'number':
	      return isFinite(v) ? v : '';
	
	    default:
	      return '';
	  }
	};
	
	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }
	
	  if (typeof obj === 'object') {
	    return map(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray(obj[k])) {
	        return map(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);
	
	  }
	
	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};
	
	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};
	
	function map (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}
	
	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};


/***/ }
/******/ ])
});
;
//# sourceMappingURL=routes.js.map