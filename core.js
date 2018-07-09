//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
var VMODELS = avalon.vmodels = {} //所有vmodel都储存在这里
avalon.define = function (source) {
    var $id = source.$id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    var vmodel = modelFactory(source)
    vmodel.$id = $id
    return VMODELS[$id] = vmodel
}

//一些不需要被监听的属性
var $$skipArray = oneObject("$id,$watch,$fire,$events,$model,$skipArray,$active,$pathname,$up,$ups,$track,$accessors")

//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现

function modelFactory(source, options) {
    options = options || {}
    options.watch = true
    return observeObject(source, options)
}

//监听对象属性值的变化(注意,数组元素不是数组的属性),通过对劫持当前对象的访问器实现
//监听对象或数组的结构变化, 对对象的键值对进行增删重排, 或对数组的进行增删重排,都属于这范畴
//   通过比较前后代理VM顺序实现
function Component() {
    
}

function observeObject(source, options) {
    if (!source || (source.$id && source.$accessors) || (source.nodeName && source.nodeType > 0)) {
        return source
    }
    //source为原对象,不能是元素节点或null
    //options,可选,配置对象,里面有old, force, watch这三个属性
    options = options || nullObject
    var force = options.force || nullObject
    var old = options.old
    var oldAccessors = old && old.$accessors || nullObject
    var $vmodel = new Component() //要返回的对象, 它在IE6-8下可能被偷龙转凤
    var accessors = {} //监控属性
    var hasOwn = {}
    var skip = []
    var simple = []
    var $skipArray = {}
    if (source.$skipArray) {
        $skipArray = oneObject(source.$skipArray)
        delete source.$skipArray
    }
    //处理计算属性
    var computed = source.$computed
    if (computed) {
        delete source.$computed
        for (var name in computed) {
            hasOwn[name] = true;
            (function (key, value) {
                var old
                accessors[key] = {
                    get: function () {
                        return old = value.get.call(this)
                    },
                    set: function (x) {
                        if (typeof value.set === "function") {
                            var older = old
                            value.set.call(this, x)
                            var newer = this[key]
                            if (this.$fire && (newer !== older)) {
                                this.$fire(key, newer, older)
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                }
            })(name, computed[name])// jshint ignore:line
        }
    }


    for (name in source) {
        var value = source[name]
        if (!$$skipArray[name])
            hasOwn[name] = true
        if (typeof value === "function" || (value && value.nodeName && value.nodeType > 0) ||
                (!force[name] && (name.charAt(0) === "$" || $$skipArray[name] || $skipArray[name]))) {
            skip.push(name)
        } else if (isComputed(value)) {
            log("warning:计算属性建议放在$computed对象中统一定义");
            (function (key, value) {
                var old
                accessors[key] = {
                    get: function () {
                        return old = value.get.call(this)
                    },
                    set: function (x) {
                        if (typeof value.set === "function") {
                            var older = old
                            value.set.call(this, x)
                            var newer = this[key]
                            if (this.$fire && (newer !== older)) {
                                this.$fire(key, newer, older)
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                }
            })(name, value)// jshint ignore:line
        } else {
            simple.push(name)
            if (oldAccessors[name]) {
                accessors[name] = oldAccessors[name]
            } else {
                accessors[name] = makeGetSet(name, value)
            }
        }
    }


    accessors["$model"] = $modelDescriptor
    $vmodel = Object.defineProperties($vmodel, accessors, source)
    function trackBy(name) {
        return hasOwn[name] === true
    }
    skip.forEach(function (name) {
        $vmodel[name] = source[name]
    })

    /* jshint ignore:start */
    hideProperty($vmodel, "$ups", null)
    hideProperty($vmodel, "$id", "anonymous")
    hideProperty($vmodel, "$up", old ? old.$up : null)
    hideProperty($vmodel, "$track", Object.keys(hasOwn))
    hideProperty($vmodel, "$active", false)
    hideProperty($vmodel, "$pathname", old ? old.$pathname : "")
    hideProperty($vmodel, "$accessors", accessors)
    hideProperty($vmodel, "hasOwnProperty", trackBy)
    if (options.watch) {
        hideProperty($vmodel, "$watch", function () {
            return $watch.apply($vmodel, arguments)
        })
        hideProperty($vmodel, "$fire", function (path, a) {
            if (path.indexOf("all!") === 0) {
                var ee = path.slice(4)
                for (var i in avalon.vmodels) {
                    var v = avalon.vmodels[i]
                    v.$fire && v.$fire.apply(v, [ee, a])
                }
            } else {
                $emit.call($vmodel, path, [a])
            }
        })
    }
    /* jshint ignore:end */

    //必须设置了$active,$events
    simple.forEach(function (name) {
        var oldVal = old && old[name]
        var val = $vmodel[name] = source[name]
        if (val && typeof val === "object") {
            val.$up = $vmodel
            val.$pathname = name
        }
        $emit.call($vmodel, name,[val,oldVal])
    })
    for (name in computed) {
        value = $vmodel[name]
    }
    $vmodel.$active = true
    return $vmodel
}