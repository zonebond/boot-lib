/**
 * Created by zonebond on 2014-2-15.
 */

var boot_libs_version = "1.2.0";


/**
 * Log
 */
(function(W)
{
    W.$LOG = function(txt)
    {
        if(W.console)
        {
            W.console.info(txt);
        }
    };

})(window);


/**
 * xCaching
 */
(function(W)
{
    if (typeof Object.create != 'function') {
        (function () {
            var F = function () {};
            Object.create = function (o) {
                if (arguments.length > 1) {
                    throw Error('Second argument not supported');
                }
                if (o === null) {
                    throw Error('Cannot set a null [[Prototype]]');
                }
                if (typeof o != 'object') {
                    throw TypeError('Argument must be an object');
                }
                F.prototype = o;
                return new F();
            };
        })();
    }
    /**
     *  function plugin inherit
     */
    if (!Function.prototype.inherit) {
        Function.prototype.inherit = function (superClass) {
            this.prototype = Object.create(superClass.prototype);
            return this.prototype;
        };
    }

    /**
     * Abstract Object Caching-Provider
     * */
    var CachingProvider = function(type)
    {
        this.type = type;
        this.isAvailable = false;
    }, _CachingProvider_Proto_ = CachingProvider.prototype;
    _CachingProvider_Proto_.length = function(){};
    _CachingProvider_Proto_.item = function(key, value){};
    _CachingProvider_Proto_.removeItem = function(key){};
    _CachingProvider_Proto_.clear = function(){};


    /**
     * Cookie-Provider : Caching-Provider
     * */
    var CookieProvider = function(){
        CachingProvider.call(this, "Cookie-Provider");
    }, _CookieProvider_ = CookieProvider.inherit(CachingProvider);


    /**
     * Storage-Provider : Caching-Provider
     * */
    var StorageProvider = function(type, storage)
    {
        CachingProvider.call(this, type);
        this.storage = storage;
        this.isAvailable = this.storage ? true : false;

    }, _StorageProvider_ = StorageProvider.inherit(CachingProvider);
    _StorageProvider_.item = function(key, value)
    {
        if(!this.isAvailable || typeof key != 'string') return;

        if(value != undefined)
        {
            this.storage.setItem(key, value);
        }
        else
        {
            return this.storage.getItem(key)
        }
    };


    /**
     * SessionStorage-Provider : Caching-Provider
     * */
    var SessionStorageProvider = function()
    {
        StorageProvider.call(this, "SessionStorage-Provider", W.sessionStorage);
    },_SessionStorageProvider_ = SessionStorageProvider.inherit(StorageProvider);


    /**
     * LocalStorage-Provider : Caching-Provider
     * */
    var LocalStorageProvider = function()
    {
        StorageProvider.call(this, "LocalStorage-Provider", W.localStorage);
    }, _LocalStorageProvider_ = LocalStorageProvider.inherit(StorageProvider);


    /**
     * X-Caching
     * */
    var XCaching = function(owner)
    {
        this.owner = owner;
        this.initial();
    }, _XCaching_Proto_ = XCaching.prototype;
    _XCaching_Proto_.initial = function()
    {
        this.providers = {};
    };
    _XCaching_Proto_.getCookieProvider = function()
    {
        if(!this.providers.cookie)
            this.providers.cookie = new CookieProvider();

        return this.providers.cookie;
    };
    _XCaching_Proto_.getSessionStorageProvider = function()
    {
        if(!this.providers.sessionStorage)
            this.providers.sessionStorage = new SessionStorageProvider();
        return this.providers.sessionStorage;
    };
    _XCaching_Proto_.getLocalStorageProvider = function()
    {
        if(!this.providers.localStorage)
            this.providers.localStorage = new LocalStorageProvider();

        return this.providers.localStorage;
    };
    _XCaching_Proto_.__getAvailableProvider__ = function()
    {
        if(this.getSessionStorageProvider().isAvailable)
            return this.getSessionStorageProvider();

        if(this.getLocalStorageProvider().isAvailable)
            return this.getLocalStorageProvider();

        return null;

        if(this.getCookieProvider().isAvailable)
            return this.getCookieProvider();
    };
    _XCaching_Proto_.item = function(key, value, expire)
    {
        if(typeof key != 'string') return;

        var provider = this.__getAvailableProvider__();

        if(!provider) return;

        if(value)
        {
            provider.item(key, value);
        }
        else
        {
            return provider.item(key)
        }
    };
    _XCaching_Proto_.clearItem = function(key)
    {
        if(W.sessionStorage)
        {
            W.sessionStorage.removeItem(key);
        }
        //if(W.localStorage)
        //{
        //    W.localStorage.removeItem(key);
        //}
    };
    _XCaching_Proto_.clear = function()
    {
        if(W.sessionStorage)
            W.sessionStorage.clear();

        //if(W.localStorage)
        //    W.localStorage.clear();
    };


    if(!W.xCaching) W.xCaching = new XCaching(W);


    /**
     * Intent
     * */
    var Intent = function(destination)
    {
        this.destination = destination;
        this.__initial__();
    }, _Intent_ = Intent.prototype;
    Intent.SEqual = "*@*@*"; Intent.SDivis = "*~~~*"; Intent.RegExp = /\?/g;
    _Intent_.__initial__ = function()
    {
        if(!W.localStorage) return;

        this.storage = W.sessionStorage;

        if(!this.destination)
        {
            if(!Intent.RegExp.test(W.location.href)) return;

            var search = W.location.href.split('?')[1],
                params = search.split('&'),
                intent = null;
            for(var i = 0; i < params.length; i++)
            {
                if(params[i].indexOf('intent') != -1)
                {
                    intent = params[i];
                    break;
                }
            }

            if(intent == null) return;
            this.expNo = intent.split('=')[1];

            this.__takeExtra__();
        }
        else
        {
            this.expNo = (new Date()).getMilliseconds() + "" + parseInt(Math.random() * 10000);

            if(Intent.RegExp.test(this.destination))
            {
                this.__express__ = this.destination + "&intent=" + this.expNo;
            }
            else
            {
                this.__express__ = this.destination + "?intent=" + this.expNo;
            }
        }
    };
    _Intent_.__takeExtra__ = function()
    {
        if(!this.storage) return;

        var putExtraItemsTxt = this.storage.getItem(this.expNo);
        this.storage.removeItem(this.expNo);

        if(!putExtraItemsTxt || putExtraItemsTxt.trim() == "" )
        {
            this.putExtraItems = null;
        }
        else
        {
            this.putExtraItems = this.__stringToMap__(putExtraItemsTxt, Intent.SEqual, Intent.SDivis)
        }
    };
    _Intent_.__mapToString__ = function(map, eq, sp)
    {
        var set = [], str = "";
        for(var key in map)
        {
            var val = map[key];
            if(typeof val != 'string') continue;
            set.push(key + eq + map[key]);
        }
        return set.join(sp);
    };
    _Intent_.__stringToMap__ = function(txt, eq, sp)
    {
        var map = {};
        var set = txt.split(sp);
        for(var i = 0; i < set.length; i++)
        {
            var t = set[i];
            if(t == null || t.trim() == '' || t.indexOf(eq) == -1) continue;
            var tt = t.split(eq);
            map[tt[0]] = tt[1];
        }
        return map;
    };
    _Intent_.putExtra = function(key, value)
    {
        if (typeof key != 'string' || typeof value != 'string' || !this.storage) return;

        if(!this.putExtraItems) this.putExtraItems = {};

        this.putExtraItems[key] = value;
    };
    _Intent_.getExtra = function(key)
    {
        if (typeof key != 'string' || this.expNo == undefined || this.putExtraItems == null) return;

        return this.putExtraItems[key];
    };
    _Intent_.start = function()
    {
        if(!this.storage) return;

        var items = this.putExtraItems;
        if(!items || !this.expNo) return;

        this.storage.setItem(this.expNo, this.__mapToString__(items, Intent.SEqual, Intent.SDivis));

        W.location = this.__express__;
    };

    if(!W.Intent) W.Intent = Intent;


})(window);


/**
 * Handle & Event
 */
(function(W)
{
    /**
     * inherit ability
     */
    if (typeof Object.create != 'function') {
        (function () {
            var F = function () {};
            Object.create = function (o) {
                if (arguments.length > 1) {
                    throw Error('Second argument not supported');
                }
                if (o === null) {
                    throw Error('Cannot set a null [[Prototype]]');
                }
                if (typeof o != 'object') {
                    throw TypeError('Argument must be an object');
                }
                F.prototype = o;
                return new F();
            };
        })();
    }
    if (!Function.prototype.inherit) {
        Function.prototype.inherit = function (superClass) {
            this.prototype = Object.create(superClass.prototype);
            return this.prototype;
        };
    }

    /**
     * Retrieve Package [bases]
     * @type {Window}
     */
    var namespace = W;

    /**
     * Define Class Handle [implement IHandle]
     */
    var Handle = function () {

    }, _Handle_ = Handle.prototype;
    _Handle_.todo = function (event) {
        if (this._handles_ == undefined || event instanceof _Event == false)
        {
            return;
        }

        event = event.clone();
        event.trigger = this;

        var handlers = this._handles_[event.type];

        if (handlers instanceof Array == false) {
            event = null;
            return;
        }

        var nums = handlers.length,
            handler;
        for (var i = 0; i < nums; i++) {
            handler = handlers[i];

            if (typeof handler != 'function') continue;

            handler.call(this, event);
        }

        event = null;
    };
    _Handle_.when = function (type, handler) {
        if (this._handles_ == undefined) {
            this._handles_ = {};
        }

        if (typeof handler != 'function') {
            return;
        }

        var handlers = this._handles_[type];
        if (handlers == undefined) {
            handlers = this._handles_[type] = [];
        }
        handlers.push(handler);
    };
    _Handle_.hasWhen = function(type) {
        if (this._handles_ == undefined)
        {
            return false
        }

        return this._handles_[type] ? true : false;
    };
    _Handle_.delWhen = function(type, handler) {
        if (this._handles_ && this._handles_[type])
        {
            delete this._handles_[type];
        }
    };
    _Handle_.dispose = function () {
        if (this._handles_)
        {
            for(var key in this._handles_)
            {
                delete this._handles_[key];
            }
        }
        this._handles_ = null;
    };
    //_Handle_.tobo = function (state)
    //{
    //    if (this._states_ == undefined || typeof state != 'string')
    //        return;
    //
    //    this.currentState = state;
    //
    //    var handlers = this._states_[state];
    //
    //    if (handlers instanceof Array == false)
    //        return;
    //
    //    while(handlers.length)
    //    {
    //        var handler = handlers.shift();
    //        if (typeof handler != 'function') continue;
    //        handler.call(this);
    //    }
    //};
    //_Handle_.been = function (state, handler)
    //{
    //    if (typeof handler != 'function')
    //        return;
    //
    //    if (this._states_ == undefined)
    //    {
    //        this._states_ = {};
    //    }
    //
    //    // check state
    //    var hasBeen = false;
    //    for(var s in this._states_)
    //    {
    //        if(s == state) hasBeen = true;
    //    }
    //
    //    var handlers = this._states_[state];
    //    if (handlers == undefined) {
    //        handlers = this._states_[state] = [];
    //    }
    //    handlers.push(handler);
    //
    //    this.tobe(state);
    //};
    namespace.Handle = Handle;

    /**
     * Define Class Event [The Event is not System Window Event of User's Manipulation, but event of Business]
     * @param type
     * @param cancelable
     * @private
     */
    var _Event = function (type, cancelable) {
        this.type = type;
        this.cancelable = cancelable;
    };
    _Event.prototype.clone = function () {
        var clone = new _Event(this.type, this.cancelable);
        clone.trigger = this.trigger;
        return clone;
    };
    namespace._Event = _Event;


    /**
     * DataEvent : An Event can carry data
     */
    var DataEvent = function(type, data, cancelable)
    {
        _Event.call(this, type, cancelable);
        this.data = data;
    }, _DataEvent_ = DataEvent.inherit(_Event);
    _DataEvent_.clone = function()
    {
        var clone = new DataEvent(this.type, this.data,this.cancelable);
        clone.trigger = this.trigger;
        return clone
    };
    namespace.DataEvent = DataEvent;

})(window);


/**
 * optimize head loading and alive
 */
(function(win)
{
    /*@cc_on
     // conditional IE < 9 only fix
     @if (@_jscript_version <= 9)
     (function(f){
     window.setTimeout =f(window.setTimeout);
     window.setInterval =f(window.setInterval);
     })(function(f){return function(c,t){var a=[].slice.call(arguments,2);return f(function(){c.apply(this,a)},t)}});
     @end
     @*/

    if(win._boot)
    {
        return;
    }

    if(!win.doExe)
    {
        win.doExe = function(something, scope)
        {
            return eval("(function(){ \n" + something + "\n }).call(scope)");
        };
    }

    if(!String.prototype.trim)
    {
        (function(){
            // Make sure we trim BOM and NBSP
            var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
            String.prototype.trim = function ()
            {
                if(this instanceof String)
                {
                    return this.replace(rtrim, "");
                }
                else
                {
                    if(console)
                        console.error("调用 trim()函数 对象不是于String类型！");
                }
            }
        })();
    }

    // Support the smallest version of IE is 8
    try
    {
        Object.defineProperty(HTMLScriptElement.prototype, "uri", {
            get: function()
            {
                if(this.src && this.src.indexOf("file:") == 0)
                {
                    var baseURI = this.src.substr(5);
                    if(baseURI.charAt(0) == 'h')
                    {
                        return baseURI;
                    }
                    else
                    {
                        var indent = baseURI.indexOf('http');
                        return baseURI.substr(indent);
                    }
                }

                if(this.getAttribute('local'))
                {
                    return this.getAttribute('local');
                }

                return this.src;
            }
        });
    }catch (ex){}

    (function()
    {
        if(window.addEvent)
        {
            return;
        }

        var addEvent = function(type, handler)
        {
            return function(elem, type, handler)
            {
                if (elem.addEventListener)
                {
                    elem.addEventListener(type, handler, false);
                }
                else if (typeof elem.attachEvent == 'function')
                {
                    elem.attachEvent('on' + type, handler);
                }
                else
                {
                    elem['on' + type] = handler;
                }
            }(this, type, handler);
        };

        var delEvent = function(type, handler)
        {
            return function(elem, type, handler)
            {
                if(elem.removeEventListener)
                {
                    elem.removeEventListener(type, handler, false);
                }
                else if (typeof elem.detachEvent == 'function')
                {
                    elem.detachEvent('on' + type, handler);
                }
                else
                {
                    elem['on' + type] = null;
                }
            }(this, type, handler);
        }

        try
        {
            if(!EventTarget.prototype.addEvent)
            {
                EventTarget.prototype.addEvent = window.addEvent = addEvent;
                EventTarget.prototype.delEvent = window.delEvent = delEvent;
            }
        }
        catch (ex)
        {
            if(!Element.prototype.addEvent)
            {
                Element.prototype.addEvent =
                    window.addEvent =
                        document.addEvent = addEvent;

                Element.prototype.delEvent =
                    window.delEvent =
                        document.delEvent = delEvent;
            }
        }
    }).call(win);

    var boot = {}, doc = win.document, UNDEF = "undefined", nav = win.navigator,
        isOpera = typeof opera !== UNDEF && opera.toString() === '[object Opera]',
        isBrowser = !!(typeof win !== UNDEF && nav && doc),
        readyRegExp = isBrowser && nav.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/,
        ua = function()
        {
            var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
                u = nav.userAgent.toLowerCase(),
                p = nav.platform.toLowerCase(),
                windows = p ? /win/.test(p) : /win/.test(u),
                mac = p ? /mac/.test(p) : /mac/.test(u),
                webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false,
                ie = !+"\v1",
                d = null;

            return { w3:w3cdom, wk:webkit, ie:ie, win:windows, mac:mac};
        }();


    if(win.frameElement && win.frameElement.beforeReady)
    {
        try
        {
            win.frameElement.beforeReady.call(win.frameElement);
        }catch(ex){$LOG("ERROR ::boot:: beforeReady " + ex)}
    }

    /***************************************/
    /*******      detect browser     *******/
    /***************************************/

    function isFunction( obj )
    {
        return typeof obj == 'function';
    }

    function addMaskStyle(css)
    {
        var style = doc.createElement('style');
        style.type = 'text/css';
        style.rel  = 'stylesheet';
        try
        {
            style.appendChild(doc.createTextNode(css));
        }
        catch(ex)
        {
            style.styleSheet.cssText = css;
        }
        doc.getElementsByTagName("head")[0].appendChild(style);
    }

    addMaskStyle("defer-boot{ display: none; }");
    addMaskStyle("body{opacity: 0 !important;}");
    addMaskStyle("body.content-ready{opacity: 1 !important;}");

    var CacheCode = function()
    {
        var name = arguments[0], code = arguments[1];
        try
        {
            if(/http:\/\//.test(name))
            {
                name = (name+'').split('/').splice(3).join('/')
            }

            try
            {
                if(!window.top.__CacheCode__)
                {
                    window.top.__CacheCode__ = {};
                }

                if(code == undefined)
                {
                    var cached = window.top.__CacheCode__[name];
                    if(cached)return cached;
                }
                else
                {
                    window.top.__CacheCode__[name] = code;
                }
            }catch(ex){$LOG(" = CACHE ERROR = CrossDomain!!!")}

            if(window.localStorage)
            {
                if(code == undefined)
                {
                    return window.localStorage.getItem(name);
                }
                else
                {
                    window.localStorage.setItem(name+"", code);
                }
            }
        }
        catch(ex)
        {
            $LOG(" = CACHE ERROR = " + name + "  | " + code.length);

            if(arguments.length == 1)
            {
                return null;
            }
        }
    };

    boot.link = function(href)
    {
        return {
            attrs: arguments[1] || null,
            link: null,
            alive: function(callback)
            {
                var link = doc.createElement('link');
                link.async = true;
                link.type  = "text/css";
                link.rel   = "stylesheet";
                link.href  = href;

                // set attributes
                var attrs = this.attrs;
                if(attrs)
                {
                    var len = attrs.length;
                    for (var i = 0; i < len; i++) {
                        var attr = attrs[i];
                        link.setAttribute(attr.name, attr.value);
                    }
                }

                link.callback = callback;

                // attachEvent
                if (link.attachEvent && !(link.attachEvent.toString && link.attachEvent.toString().indexOf('[native code') < 0) && !isOpera)
                {
                    link.attachEvent('onreadystatechange', this.hand);
                }
                else
                {
                    link.addEventListener('load', this.hand);
                }

                this.link = link;
                doc.getElementsByTagName('head')[0].appendChild(link);
            },
            hand: function(event)
            {
                var target = event.currentTarget || event.srcElement;
                if (event.type === 'load' || (readyRegExp.test(target.readyState)))
                {
                    if(target.callback)
                    {
                        target.callback.call(null);
                        target.callback = null; delete target.callback;
                    }
                }
            }
        }
    };

    boot.script = function(src)
    {
        return {
            attrs: arguments[1] || null,
            alive: function(callback)
            {
                // instance script
                var node = doc.createElement('script');
                node.async = true;
                node.type = "text/javascript";

                // set attributes
                var attrs = this.attrs;
                if(attrs)
                {
                    var len = attrs.length;
                    for (var i = 0; i < len; i++) {
                        var attr = attrs[i];
                        node.setAttribute(attr.name, attr.value);
                    }
                }

                node.callback = callback;

                // attachEvent
                if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera)
                {
                    node.attachEvent('onreadystatechange', this.hands);
                }
                else
                {
                    node.addEventListener('load', this.hands, false);
                }

                node.src = src;
                doc.getElementsByTagName('head')[0].appendChild(node);
            },
            hands: function(event)
            {
                var target = event.currentTarget || event.srcElement;
                if (event.type === 'load' || (readyRegExp.test(target.readyState)))
                {
                    if(target.callback)
                    {
                        target.callback.call(null);
                        target.callback = null; delete target.callback;
                    }
                }
            }
        };
    };

    // for cache-code
    boot.httpLoader = function(href)
    {
        return {
            cache: arguments[1] == undefined ? true : arguments[1],
            href: href,
            alive: function(callback)
            {
                this.callback = callback;

                var local_cache = CacheCode(href);

                if(local_cache)
                {
                    this.response = local_cache;
                    return this.handle();
                }

                // get remote source
                var loader, who = this;

                if(win.XMLHttpRequest)
                {
                    loader = new XMLHttpRequest();
                }
                else if(win.ActiveXObject)
                {
                    try
                    {
                        loader = new ActiveXObject("Msxml2.XMLHTTP");
                    }
                    catch(ex)
                    {
                        try
                        {
                            loader = new ActiveXObject("Microsoft.XMLHTTP");
                        }
                        catch (ex) {}
                    }
                }

                if(loader)
                {
                    this.loader = loader;

                    loader.onreadystatechange = function(evt)
                    {
                        if(loader.readyState == 4 && loader.status == 200)
                        {
                            var code = loader.responseText;

                            if(who.cache)
                            {
                                CacheCode(who.href, code);
                            }

                            who.response = code;

                            loader = null;
                            code = null;
                            return who.handle();
                        }
                    };

                    loader.error = function(evt)
                    {
                        loader = null;
                        return boot.onLoadError(evt);
                    };

                    loader.open("POST", href, true);
                    loader.send();
                }
            },
            handle: function()
            {
                if(this.callback && isFunction(this.callback))
                {
                    this.callback.call(this);
                    this.callback = null; delete this.callback;
                }
            }
        };
    };

    /**
     *  boot-lib major component
     *  ** boot.js **
     */

        //boot.optimize = ua.ie && /MSIE 8.0/.test(nav.appVersion) ? false : true;

    boot.getOptions = function()
    {
        var options = doc.getElementsByTagName('boot-option'),
            attr_src, attr_config, attr_optimized, attr_cache_style, attr_cache_defer, isDebugMode = false;

        if(!options.length)
        {
            var scripts = doc.scripts, len = scripts.length;

            for(var i = 0; i < len; i++)
            {
                var script = scripts[i];
                if(script.src.indexOf('boot.js') != -1)
                {
                    options = script;

                    attr_src = options.src;
                    attr_config = options.getAttribute('config');
                    attr_optimized = options.getAttribute('optimized') === "false" ? false : true;
                    attr_cache_style = options.getAttribute('cache-style') === "false" ? false : true;
                    attr_cache_defer = options.getAttribute('cache-defer') === "false" ? false : true;
                    isDebugMode = options.hasAttribute('debug-mode') ? true : false;
                    break;
                }
            }

            if(!attr_src)
            {
                return;
            }
        }
        else
        {
            attr_src = options.getAttribute('root');
            attr_config = options.getAttribute('config');
            attr_optimized = options.getAttribute('optimized') === "false" ? false : true;
            attr_cache_style = options.getAttribute('cache-style') === "false" ? false : true;
            attr_cache_defer = options.getAttribute('cache-defer') === "false" ? false : true;
            isDebugMode = options.hasAttribute('debug-mode') ? true : false;
        }

        boot.root = attr_src ? attr_src.replace('boot.js', '') : '/boot-libs/';
        boot.config_path = attr_config;

        if(isDebugMode)
        {
            boot.optimize = boot.styleCached = boot.deferCached = false;
        }
        else
        {
            boot.optimize = attr_optimized;
            boot.styleCached = attr_cache_style;
            boot.deferCached = attr_cache_defer;
        }
    };

    boot.detectVersion = function()
    {
        if(!win.localStorage)
        {
            return;
        }

        var storage = win.localStorage;
        var version = storage.getItem('--boot-libs-version--');
        if(version)
        {
            if(version.indexOf('beta') != -1 && !sessionStorage.getItem('--boot-libs-version--'))
            {
                $LOG("--boot-libs-- :: beta version -> clear-cache ::");
                localStorage.clear();
                sessionStorage.setItem('--boot-libs-version--', 'beta-version-strategy')
            }
            else if(version != boot_libs_version)
            {

                $LOG("--boot-libs-- :: Caching Version Different !!!");
                localStorage.clear();
            }
        }
        else
        {
            localStorage.clear();
        }
        storage.setItem('--boot-libs-version--', boot_libs_version);
    };

    boot.attach_stylesheet = function(href, cssText)
    {
        var parts = href.split('/');
        parts.length = parts.length - 1;
        cssText = cssText.replace(/url\("/g, 'url("' + parts.join('/') + '/');
        cssText = cssText.replace(/url\('/g, 'url(\'' + parts.join('/') + '/');

        var styleNode = doc.createElement('style');
        styleNode.setAttribute('type', 'text/css');

        if (!styleNode.styleSheet)
        {
            styleNode.appendChild(document.createTextNode(cssText));
        }

        var head = doc.getElementsByTagName('head')[0];

        head.appendChild(styleNode);

        /**
         * For IE.
         * This needs to happen *after* the style element is added to the DOM, otherwise IE 7 and 8 may crash.
         * See http://social.msdn.microsoft.com/Forums/en-US/7e081b65-878a-4c22-8e68-c10d39c2ed32/internet-explorer-crashes-appending-style-element-to-head
         */
        if (styleNode.styleSheet) {
            try
            {
                styleNode.styleSheet.cssText = cssText;
            }
            catch (e) { throw new Error("Couldn't reassign styleSheet.cssText."); }
        }
    };

    boot.instance_script_node = function(src)
    {
        var node = doc.createElement('script');
        node.async = true;
        node.setAttribute('local', src);

        //doc.scripts[doc.scripts.length] = node;
        doc.getElementsByTagName('head')[0].appendChild(node);
    };

    // launch
    boot.init = function()
    {
        boot.getOptions();

        doc.getElementsByTagName('html')[0].style.opacity = '0';

        boot.DOMContentLoaded_Thread();

        boot.script(boot.config_path && boot.config_path != "" ? boot.config_path : boot.root + 'config.js').alive(boot.get);
    };

    boot.DOMContentLoaded_Thread = function()
    {
        var WhenContentLoaded = function(callback)
        {
            var WIN = window, DOC = window.document, UND = undefined, fn = function()
            {
                if(WhenContentLoaded.called)
                    return;
                WhenContentLoaded.called = true;
                callback.call();
            };

            WhenContentLoaded.called = false;

            if((DOC.readyState != UND && DOC.readyState == "complete") || (DOC.readyState == UND && (DOC.getElementsByTagName('body')[0] || DOC.body)))
            {
                fn();
            }

            if(!WhenContentLoaded.called)
            {
                if(DOC.addEventListener != UND)
                {
                    DOC.addEventListener("DOMContentLoaded", fn, false);
                }
                else
                {
                    DOC.attachEvent("onreadystatechange", function()
                    {
                        if (DOC.readyState == "complete")
                        {
                            DOC.detachEvent("onreadystatechange", arguments.callee);
                            fn();
                        }
                    });
                }

                //win loaded
                if (WIN.addEventListener != UND)
                {
                    WIN.addEventListener("load", fn, false);
                }
                else if (DOC.addEventListener != UND)
                {
                    DOC.addEventListener("load", fn, false);
                }
                else if (WIN.attachEvent != UND)
                {
                    WIN.attachEvent("onload", fn);
                }
                else if (WIN.onload == "function")
                {
                    var fnOld = WIN.onload;
                    WIN.onload = function()
                    {
                        fn();
                        //确保在其它目标(exp:onpageshow)事件之前触发
                        fnOld();
                    };
                }
                else
                {
                    WIN.onload = fn;
                }
            }

        };

        WhenContentLoaded(function()
        {
            boot._trigger_DOM_standby_();

            if(!boot._dom_sync_ready_)
            {
                boot._dom_sync_ready_ = true;
                return;
            }

            //boot._trigger_boot_ready_();
            boot._trigger_real_ready_();
        });
    };

    boot.extraLibraryPath = function(file)
    {
        var pri = (boot.config_path != undefined && boot.config_path != "") ? boot.config_path + "../../" : boot.root + "../";
        return pri + file;
    };

    boot.CacheScriptActivate = function(href)
    {
        var local_cache = CacheCode(href);

        if(local_cache)
        {
            try
            {
                eval.call(win, local_cache);
            }
            catch(ex)
            {
                $LOG(href + "\n optimize ::" + ex);
            }
        }
    };

    boot.get = function()
    {
        if(_boot.version) boot_libs_version = _boot.version;

        boot.detectVersion();

        var queue = [];
        var heads = doc.createDocumentFragment();
        var items = _boot.configs || [];

        var count = items.length;

        if(!count)
        {
            return;
        }

        for(var i = 0; i < count; i++)
        {
            var item = items[i];

            if (typeof item != 'string' || item.trim() == "")
                continue;

            var part = item.split('.');
            var href = item[0] == "~" ? boot.extraLibraryPath(item.substr(1)) : _boot.root + item;
            var node;
            if(part[part.length - 1] == 'css')
            {
                node = (boot.styleCached && boot.optimize) ? boot.httpLoader(href) : boot.link(href);
                node.type = 'css';
            }
            else
            {
                if(boot.optimize)
                {
                    node = boot.httpLoader(href);
                    boot.instance_script_node(href);
                }
                else
                {
                    node = boot.script(href);
                }
            }
            node.href = href;
            queue.push(node);
        }

        //attach css
        doc.getElementsByTagName("head")[0].appendChild(heads);

        if(boot.optimize)
        {
            dequeuing(queue.concat([]), function()
            {
                if(!this._loaded_count_) return;

                dequeuing(queue, boot._trigger_boot_ready_).sequence(function(item)
                {
                    var href = item.href, local_cache = CacheCode(href);

                    if(local_cache)
                    {
                        if(item.type)
                        {
                            boot.attach_stylesheet(href, local_cache);
                        }
                        else
                        {
                            try
                            {
                                //doExe(local_cache, win);
                                win.eval.call(win, local_cache);
                            }
                            catch(ex)
                            {
                                $LOG(href + "\n optimize ::" + ex);
                            }
                        }
                    }
                });

            }).parallel(boot.parallel_load);
        }
        else
        {
            var every = function(item)
            {
                var who = this;
                item.alive(function()
                {
                    who.next(every);
                });
            };

            dequeuing(queue, boot._trigger_boot_ready_).next(every);
        }

        return;
    };

    // intro: dequeuing Function's feature are queue
    //
    //
    function dequeuing(queue, clear)
    {
        return {
            queue: queue,
            clear: clear,
            clean: function()
            {
                if(this.clear && isFunction(this.clear))
                {
                    this.clear.call(this);
                }
            },
            parallel: function(every)
            {
                if(!isFunction(every) || !this.queue)
                {
                    return;
                }

                var who = this;
                var len = who.queue.length;
                for(var i = 0; i < len; i++)
                {
                    every.call(who, who.queue[i]);
                }
            },
            sequence: function(every)
            {
                if(!isFunction(every) || !this.queue)
                {
                    return;
                }

                var who = this;
                while(who.queue.length)
                {
                    every.call(who, who.queue.shift());
                }

                who.clean();
            },
            next: function(every)
            {
                if(!isFunction(every) || !this.queue)
                {
                    return;
                }

                var who = this;
                if(who.queue.length)
                {
                    every.call(who, who.queue.shift());
                }
                else
                {
                    who.clean();
                }
            }
        };
    }
    boot.dequeuing = dequeuing;

    boot.parallel_load = function(item)
    {
        var who = this;

        item.alive(function()
        {
            if(!who._loaded_count_)
            {
                who._loaded_count_ = 0;
            }

            who._loaded_count_++;

            if(who.queue.length == who._loaded_count_)
            {
                who.clean();
            }

            return;
        });
    };

    boot.sequence_load = function(item)
    {
        item.alive(function()
        {
            boot.instance_script_node(this.href);

            var code = this.response;

            try
            {
                win.eval.call(win, code);
            }
            catch(ex)
            {
                $LOG(ex);
            }

            code = null;

            return;
        });
    };

    boot.onLoadError = function(evt)
    {
        $LOG(evt);
    };

    boot._trigger_DOM_standby_ = function()
    {
        boot._dom_standby_ = true;

        if(!boot._dom_standby_fns_) return;

        var fns = boot._dom_standby_fns_;
        while(fns.length)
        {
            fns.shift().call();
        }
    };

    boot._trigger_boot_ready_ = function()
    {
        // library is ready

        if(boot._library_fns_)
        {
            var fns = boot._library_fns_;
            while(fns.length)
            {
                fns.shift().call();
            }
        }
        boot.isLibrary = true;

        if(!boot._dom_sync_ready_)
        {
            boot._dom_sync_ready_ = true;
            return;
        }

        boot._trigger_real_ready_();
    };

    boot._trigger_real_ready_ = function()
    {
        doc.body.setAttribute('class', 'content-ready');

        var i, items, len;
        if(_boot.$buffer)
        {
            items = _boot.$buffer;
            len   = items.length;
            for(i = 0; i < len; i++)
            {
                var item = items[i];
                try
                {
                    if(typeof item.dom == 'function')
                    {
                        $(item.dom);
                    }
                    else
                    {
                        $(item.dom).ready(item.onready);
                    }
                }
                catch (e)
                {
                    $LOG(e.toString());
                }
            }
        }


        if(_boot.readys)
        {
            items = _boot.readys;
            len   = items.length;

            for(i = 0; i < len; i++)
            {
                items[i].call(null);
            }
        }

        boot.isReady = true;

        doc.getElementsByTagName('html')[0].style.opacity = '1';

        boot._launch_defers_();
    };

    boot._launch_defers_ = function()
    {
        var queue = [];

        var defer_scripts;
        if(typeof doc.querySelectorAll == 'function')
        {
            defer_scripts = doc.querySelectorAll('defer-boot');
        }
        else
        {
            defer_scripts = doc.getElementsByTagName("defer-boot");
        }

        if (defer_scripts && defer_scripts.length != 0)
        {
            var index = 0, len = defer_scripts.length;
            while(index < len)
            {
                var item = defer_scripts.item(index);
                var node = boot.deferCached ? boot.httpLoader(item.getAttribute('src'), true) : boot.script(item.getAttribute('src'), item.attributes);
                queue.push(node);

                index++;
            }
            _boot.$scripts$ = queue;

            var every = function(item)
            {
                var who = this;
                item.alive(function()
                {
                    if(boot.deferCached)
                    {
                        boot.CacheScriptActivate(item.href);
                    }

                    who.next(every);
                });
            };
            dequeuing(queue, _boot.complete).next(every);
        }
        else
        {
            _boot.complete();
        }
    };

    boot.complete = function()
    {
        if(_boot.comp)
        {
            items = _boot.comp;
            len   = items.length;

            for(i = 0; i < len; i++)
            {
                items[i].call(null);
            }
        }
    };

    boot.isReady = false;
    boot.isComplete = false;

    win._boot = boot;

    win.$ = function(target)
    {
        if(!_boot.$buffer)
        {
            _boot.$buffer = [];
        }

        var item = {dom: target, ready: function(func)
        {
            item.onready = func;
        }};

        _boot.$buffer.push(item);

        return item;
    };

    win.library = function(fn)
    {
        if(typeof fn != 'function') return;

        if(boot.isLibrary)
        {
            fn();
            return;
        }

        if(!boot._library_fns_) boot._library_fns_ = [];

        boot._library_fns_.push(fn);
    };

    win.standby = function(fn)
    {
        if(typeof fn != 'function') return;

        if(boot._dom_standby_)
        {
            fn();
            return;
        }

        if(!boot._dom_standby_fns_) boot._dom_standby_fns_ = [];

        boot._dom_standby_fns_.push(fn);
    };

    win.ready = function(func)
    {
        if(_boot.isReady)
        {
            func.call(null);
            return;
        }

        if(!_boot.readys)
        {
            _boot.readys = [];
        }
        _boot.readys.push(func);
    };

    win.complete = function(func)
    {
        if(_boot.isComplete)
        {
            func.call(null);
            return;
        }

        if(!_boot.comp)
        {
            _boot.comp = [];
        }
        _boot.comp.push(func);
    };

    boot.init();

})(window);


/**
 * Sprite
 */
(function(win){

    var CacheCode = function()
    {
        var name = arguments[0], code = arguments[1];
        try
        {
            if(/http:\/\//.test(name))
            {
                name = (name+'').split('/').splice(3).join('/')
            }

            try
            {
                if(!window.top.__CacheCode__)
                {
                    window.top.__CacheCode__ = {};
                }

                if(code == undefined)
                {
                    var cached = window.top.__CacheCode__[name];
                    if(cached)return cached;
                }
                else
                {
                    window.top.__CacheCode__[name] = code;
                }
            }catch(ex){$LOG(" = CACHE ERROR = CrossDomain!!!")}

            if(window.localStorage)
            {
                if(code == undefined)
                {
                    return window.localStorage.getItem(name);
                }
                else
                {
                    window.localStorage.setItem(name+"", code);
                }
            }
        }
        catch(ex)
        {
            $LOG(" = CACHE ERROR = " + name + "  | " + code.length);

            if(arguments.length == 1)
            {
                return null;
            }
        }
    };

    win.___sprite___ =
    {
        task_queue: [],
        task_types: {},
        registered: {},
        /**
         @param {string} [src]
         @param {function} [callback]
         */
        fetch: function(src, callback)
        {
            var cached = arguments[2] == undefined ? false : arguments[2],
                loader =
                {
                    src: src,
                    cached: cached,
                    loaded: win.___sprite___.loaded,
                    pre_process: arguments[3],
                    callback: callback
                },
                xhr;

            if(cached)
            {
                var txt_stream = CacheCode(src);
                if(txt_stream)
                {
                    loader.txt_stream = txt_stream;
                    return loader.loaded.call(loader);
                }
            }

            if(win.XMLHttpRequest)
            {
                xhr = new XMLHttpRequest();
            }
            else if(win.ActiveXObject)
            {
                try
                {
                    xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
                catch(ex)
                {
                    try
                    {
                        xhr = new ActiveXObject("Microsoft.XMLHTTP");
                    }
                    catch (ex) {}
                }
            }

            if(xhr)
            {
                loader.xhr = xhr;

                xhr.onreadystatechange = function(event)
                {
                    if(xhr.readyState == 4 && xhr.status == 200)
                    {
                        loader.txt_stream = xhr.responseText;
                        return loader.loaded.call(loader);
                    }
                };

                xhr.error = function(event)
                {
                    xhr = null;
                    return function(event)
                    {
                        if(console) console.error("___sprite___.fetch :: " + event.toString());
                    }()
                };

                xhr.open("POST", src, true);
                xhr.send();
            }
        },
        loaded: function()
        {
            if(this.cached) CacheCode(this.src, this.txt_stream);

            if(typeof this.pre_process === 'function')
            {
                this.pre_process.call(this, {src: this.src, txt_stream: this.txt_stream});
            }

            win.___sprite___.registered[this.src] = true;

            if(this.callback)
            {
                this.callback.call(null, {src: this.src, txt_stream: this.txt_stream});
            }

            this.xhr = null; delete this.xhr;
            this.loaded = null; delete this.loaded;
            this.callback = null; delete this.callback;
        }
    };

    var TASK_STACK = function(tasks, callback, every)
    {
        var queue = tasks instanceof Array == true ? tasks : [tasks];

        var sprite = win.___sprite___,
            len = queue.length, qer, src;

        queue.callback = callback;
        queue.process  = function()
        {
            var queue = this;
            var total = queue.length, count = 0, qer, src;
            for(var i = 0; i < total; i++)
            {
                qer = queue[i];
                src = typeof qer == 'string' ? qer : qer['url'];

                if(!sprite.registered[src])
                    continue;

                count++;
            }

            if(total == count && total != 0)
            {
                if(queue.callback)queue.callback();
                return true;
            }

            return false;
        };

        sprite.task_queue.push(queue);

        for(var i = 0; i < len; i++)
        {
            qer = queue[i];
            src = typeof qer == 'string' ? qer : qer['url'];

            if(!src || src.trim() == "" || sprite.task_types[src]) continue;

            sprite.fetch(src, function()
            {
                var task_queue = sprite.task_queue,
                    index = 0,
                    queue;
                while(index < task_queue.length)
                {
                    queue = task_queue[index];
                    if(queue.process.call(queue))
                    {
                        delete task_queue[index];
                        task_queue.splice(index, 1);
                        continue;
                    }
                    index++;
                }
            }, qer['cached'], every);
        }
    };

    /**
     @param {object|string|Array} [tasks]
     @param {function} [callback]
     @return {void}
     */
    win.getScript = function (tasks, callback) {
        return TASK_STACK(tasks, callback, function(holder)
        {
            try
            {
                win.eval.call(win, holder.txt_stream);
            }
            catch(ex){}
        });
    };

    win.getStyles = function (tasks, callback) {
        return TASK_STACK(tasks, callback, function(holder)
        {
            // todo
            try
            {
                _boot.attach_stylesheet(holder.src, holder.txt_stream);
            }
            catch(ex){}
        });
    }
})(window);


/**
 * package management
 */
(function(W)
{
    W.btlibs =
    {
        bases:{},
        components:{}
    };

    _boot.package = function(parent, package)
    {
        if(typeof parent != 'string' || typeof package != 'string') return;

        var pack = W.btlibs[parent];

        if(!pack)
        {
            return null;
        }

        pack = pack[package];
        if(!pack)
        {
            pack = {};
        }

        return pack;
    };

    W.boot = _boot;
})(window);