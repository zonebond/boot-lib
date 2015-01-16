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
                        console.log("调用 trim()函数 对象不是于String类型！");

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

    function isFunction( obj )
    {
        return typeof obj == 'function';
    }

    function addMaskStyle(css)
    {
        var style = doc.createElement('style');
        style.type = 'text/css';
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

    boot.link = function(href)
    {
        var link = doc.createElement('link');
        link.type = "text/css";
        link.rel  = "stylesheet";
        link.href = href;
        return link;
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
                }
            }
        };
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
                    boot._launch_defers_();
                }
            }
        };

        if (doc.attachEvent && !(doc.attachEvent.toString && doc.attachEvent.toString().indexOf('[native code') < 0) && !isOpera)
        {
            doc.attachEvent('onreadystatechange', handler, false);
        }
        else
        {
            doc.addEventListener('DOMContentLoaded', handler, false);
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
                node = boot.link(href);
                heads.appendChild(node);
            }
            else
            {
                node = boot.optimize ? boot.httpLoader(href) : boot.script(href);
                queue.push(node);
            }
        }

        //attach css
        doc.getElementsByTagName("head")[0].appendChild(heads);

        if(boot.optimize)
        {
            dequeuing(queue, function()
            {
                var temp_queue = this._temp_queue_;
                if(!temp_queue || temp_queue.length == 0)
                {
                    return;
                }

                dequeuing(temp_queue, boot._trigger_boot_ready_).sequence(function(item)
                {
                    boot.instance_script_node(item);

                    var local_cache = CacheCode(item);

                    if(local_cache)
                    {
                        try
                        {
                            win.eval(local_cache);
                        }
                        catch(ex)
                        {
                            if (window.console)
                                window.console.log("optimize ::" + ex);
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
            if(!who._temp_queue_)
            {
                who._temp_queue_ = [];
            }

            who._temp_queue_.push(this.href);

            if(who.queue.length == who._temp_queue_.length)
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

    boot._trigger_boot_ready_ = function()
    {
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
        if(!boot._dom_sync_ready_)
        {
            boot._dom_sync_ready_ = true;
            return;
        }

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

})(window)