/**
 * Created by zonebond on 2014-2-15.
 */

//optimize head loading and alive
(function(win)
{
    if(win._boot)
    {
        return;
    }

    if(!win.doExe)
    {
        win.doExe = function(something, boss)
        {
            return eval("(function(){ \n" + something + "\n }).call(boss)");
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
    if(HTMLScriptElement)
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
    }

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

    /***************************************/
    /*******      detect browser     *******/
    /***************************************/

    //boot.optimize = ua.ie && /MSIE 8.0/.test(nav.appVersion) ? false : true;
    boot.optimize = true;
    boot.styleCached = false;

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
    addMaskStyle("body{ opacity: 0; }");

    var CacheCode = function()
    {
        if(!win.top.__CacheCode__)
        {
            win.top.__CacheCode__ = {};
        }

        var name = arguments[0],
            code = arguments[1];

        if(code == undefined)
        {
            return win.top.__CacheCode__[name];
        }
        else
        {
            win.top.__CacheCode__[name] = code;
        }
    };

    boot.log = function(text)
    {
        return;

        if(!console) return;

        console.log(text);
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

    boot.attach_stylesheet = function(href, cssText)
    {
        var parts = href.split('/');
        parts.length = parts.length - 1;

        var css = cssText.replace(/url\("/g, 'url("' + parts.join('/') + '/');

        addMaskStyle(css);
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
        var boot_script,
            scripts = doc.scripts, len = scripts.length,
            root_path, config_path;

        for(var i = 0; i < len; i++)
        {
            var script = scripts[i];
            if(script.src.indexOf('boot.js') != -1)
            {
                boot_script = script;
                root_path = script.src.replace('boot.js', '');
                config_path = script.getAttribute('config');
                break;
            }
        }

        if(!root_path)
        {
            return;
        }

        boot.mian_node = boot_script;
        boot.root = root_path;
        boot.config_path = config_path;

        var config_uri = config_path && config_path != "" ? config_path : boot.root + 'config.js';

        doc.getElementsByTagName('html')[0].style.opacity = '0';

        if(boot.optimize)
        {
            boot.DOMContentLoaded_Thread();
        }
        else
        {
            boot._dom_ready_ = true;
        }

        boot.script(config_uri).alive(boot.get);

    };

    boot.DOMContentLoaded_Thread = function()
    {
        var handler = function(evt)
        {
            if (evt.type === 'DOMContentLoaded' || (readyRegExp.test(doc.readyState)))
            {
                if(!boot._dom_sync_ready_)
                {
                    boot._dom_sync_ready_ = true;
                }
                else
                {
                    boot._trigger_boot_ready_();
                }
            }
        };

        if (doc.attachEvent && !(doc.attachEvent.toString && doc.attachEvent.toString().indexOf('[native code') < 0) && !isOpera)
        {
            doc.attachEvent('onreadystatechange', handler);
        }
        else
        {
            doc.addEventListener('DOMContentLoaded', handler);
        }
    };

    boot.get = function()
    {
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
            var part = item.split('.');
            var href = item[0] == "~" ? boot.config_path + "../../" + item.substr(1) : _boot.root + item;
            var node;
            if(part[part.length - 1] == 'css')
            {
                node = boot.styleCached ? boot.httpLoader(href) : boot.link(href);
                node.type = 'css';
            }
            else
            {
                node = boot.optimize ? boot.httpLoader(href) : boot.script(href);
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
                            boot.instance_script_node(href);

                            try
                            {
                                win.eval(local_cache);
                            }
                            catch(ex)
                            {
                                if (window.console)
                                    window.console.log(href + "\n optimize ::" + ex);
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
                if (window.console)
                    window.console.log(ex);
            }

            code = null;

            return;
        });
    };

    boot.onLoadError = function(evt)
    {
        if (window.console)
            window.console.log(evt);
    };

    boot._trigger_boot_loaded_ = function()
    {

        boot._trigger_boot_ready_();
    };

    boot._trigger_boot_ready_ = function()
    {
        if(!boot._dom_sync_ready_)
        {
            boot._dom_sync_ready_ = true;
            return;
        }

        addMaskStyle("body{ opacity: 1; }");

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
                    if (window.console)
                        window.console.log(e.toString());
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
                var node = _boot.script(item.getAttribute('src'), item.attributes);
                queue.push(node);

                index++;
            }
            _boot.$scripts$ = queue;

            var every = function(item)
            {
                var who = this;
                item.alive(function()
                {
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


/**** sprite for loader resources ****/
(function(win)
{

    var CacheCode = function()
    {
        if(!win.top.__CacheCode__)
        {
            win.top.__CacheCode__ = {};
        }

        var name = arguments[0],
            code = arguments[1];

        if(code == undefined)
        {
            return win.top.__CacheCode__[name];
        }
        else
        {
            win.top.__CacheCode__[name] = code;
        }
    };

    win.$$sprite$$ =
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
            var cached = arguments[2] ? arguments[2] : false,
                loader =
                {
                    src: src,
                    cached: cached,
                    loaded: win.$$sprite$$.loaded,
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
                        if(console) console.error("$$sprite$$.fetch :: " + event.toString());
                    }()
                };

                xhr.open("POST", src, true);
                xhr.send();
            }
        },
        loaded: function()
        {
            if(this.cached) CacheCode(this.src, this.txt_stream);

            try
            {
                win.doExe(this.txt_stream, win);
            }
            catch(ex){}

            win.$$sprite$$.registered[this.src] = true;

            if(this.callback)
            {
                this.callback.call(null, [{src: this.src, txt_stream: this.txt_stream}]);
            }

            this.xhr = null; delete this.xhr;
            this.loaded = null; delete this.loaded;
            this.callback = null; delete this.callback;
        }
    };

    win.jetpack = function()
    {
        //ajax task package
    };

    /**
     @param {object|string|Array} [tasks]
     @param {function} [callback]
     @return {void}
     */
    win.getScript = function (tasks, callback)
    {
        var queue = tasks instanceof Array == true ? tasks : [tasks];

        var __sprite__ = win.$$sprite$$,
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

                if(!__sprite__.registered[src])
                    continue;

                count++;
            }

            if(total == count && total != 0)
            {
                queue.callback();
                return true;
            }

            return false;
        };

        __sprite__.task_queue.push(queue);

        for(var i = 0; i < len; i++)
        {
            qer = queue[i];
            src = typeof qer == 'string' ? qer : qer['url'];

            if(!src || src.trim() == "" || __sprite__.task_types[src]) continue;

            __sprite__.fetch(src, function()
            {
                var task_queue = __sprite__.task_queue,
                    index = 0, queue;
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
            }, qer['cached']);
        }
    };

})(window);