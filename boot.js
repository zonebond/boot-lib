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

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';

    function isFunction( obj )
    {
        return typeof obj == 'function';
    }

    var boot = {}, doc = document;

    function addMaskStyle(css)
    {
        var style=doc.createElement('style');
        style.type='text/css';
        try{
            style.appendChild(doc.createTextNode(css));
        }catch(ex){
            style.styleSheet.cssText=css;
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
                var node = doc.createElement('script');
                node.async = false;
                node.type = "text/javascript";

                var attrs = this.attrs;
                if(attrs)
                {
                    var len = attrs.length;
                    for (var i = 0; i < len; i++) {
                        var attr = attrs[i];
                        node.setAttribute(attr.name, attr.value);
                    }
                }

                if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera)
                {
                    node.onreadystatechange = function()
                    {
                        if(node.readyState == 'loaded')
                        {
                            callback.call(null);
                            node.onreadystatechange = null;
                        }
                    }
                }
                else
                {
                    node.addEventListener('load', callback, false);
                }

                node.src = src;
                doc.getElementsByTagName('head')[0].appendChild(node);
            }
        };
    };

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
            }

            loader.open("POST", href, false);
            loader.setRequestHeader("If-Modified-Since", "0");
            loader.send();
        }
    };

    boot.init = function()
    {
        var boot_script;
        var scripts = doc.scripts;
        var len = scripts.length;
        var root_path, config_path;
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

        var config_uri = config_path && config_path != "" ? config_path : boot.root + 'config.js'

        doc.getElementsByTagName('html')[0].style.opacity = '0';

        var config = boot.script(config_uri);
        config.alive(_boot.get);

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

        queueLaunch(queue);

        return;
    };

    function queueLaunch(queue)
    {
        var node = queue.shift();
        node.alive(function()
        {
            if(queue.length == 0)
            {
                return boot.launch.call(null);
            }
            queueLaunch(queue);
        });
        return;
    }

    boot.onLoadError = function()
    {
        alert('load error before ready!')
    };

    boot.launch = function()
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

        loadDefer();
    };

    var isDefer = false;
    function loadDefer() {
        _boot.$deferscripts$ = [];
        var defer_scripts = doc.querySelectorAll("defer-boot");
        if (defer_scripts && defer_scripts.length != 0)
        {
            for (var i = 0; i < defer_scripts.length; i++)
            {
                var defer = defer_scripts[i];
                var node = _boot.script(defer.getAttribute('src'), defer.attributes);

                _boot.$deferscripts$.push(node);

                doc.body.removeChild(defer);
            }

            _boot.$scripts$ = _boot.$deferscripts$.concat();

            queueDeferred();
        }
        else
        {
            _boot.complete();
        }
    }

    function queueDeferred()
    {
        if(!_boot.$scripts$ || _boot.$scripts$.length == 0)
        {
            _boot.complete();
            return;
        }

        var node = _boot.$scripts$.shift();
        node.alive(function()
        {
            return queueDeferred();
        });
    }

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

    boot.init();

})(window)