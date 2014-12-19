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

    if (!String.prototype.trim)
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

    var boot = {}, doc = win.document,
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        isBrowser = !!(typeof window !== 'undefined' && navigator && doc),
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;

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

    /** deprecated **/
    boot.httpLoader = function(href, callback)
    {
        var loader;
        if(win.XMLHttpRequest)
        {
            loader = new XMLHttpRequest();
        }
        else if(win.ActiveXObject)
        {
            loader = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if(loader)
        {
            loader.onreadystatechange = function()
            {
                if(loader.readyState == 4 && loader.status == 200)
                {
                    callback.call(null, loader.responseText);
                    loader = null;
                }
            };

            loader.open("POST", href, false);
            loader.setRequestHeader("If-Modified-Since", "0");
            loader.send();
        }
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

        boot.script(config_uri).alive(_boot.get);

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
                node = _boot.link(href);
                heads.appendChild(node);
            }
            else
            {
                node = _boot.script(href);
                queue.push(node);
            }
        }

        //attach css
        doc.getElementsByTagName("head")[0].appendChild(heads);

        dequeue(queue, boot._trigger_boot_ready_);

        return;
    };

    function dequeue(queue, clear)
    {
        if(!queue.length)
        {
            return clear ? clear.call(null) : null;
        }

        var item = queue.shift();

        item.alive(function()
        {
            return dequeue.call(null, queue, clear);
        });

        return;
    }

    boot.onLoadError = function()
    {
        alert('load error before ready!');
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
                    if(console)
                        console.log(e.toString());
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
            dequeue(queue, _boot.complete);
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