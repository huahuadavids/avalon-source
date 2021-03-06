/*********************************************************************
 *                    全局变量及方法                                  *
 **********************************************************************/
var expose = Date.now()
//http://stackoverflow.com/questions/7290086/javascript-use-strict-and-nicks-find-global-function
var DOC = window.document
var head = DOC.head //HEAD元素
// 在head标签 开始后 ，可选四个位置 开始前后，结束前后 
head.insertAdjacentHTML("afterBegin", 
'<avalon ms-skip class="avalonHide"><style id="avalonStyle">.avalonHide{ display: none!important }</style></avalon>')
var ifGroup = head.firstChild

function log() {
    if (avalon.config.debug) {
    // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        console.log.apply(console, arguments)
    }
}

var subscribers = "$" + expose
var nullObject = {}   //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rw20g = /\w+/g
var rsvg = /^\[object SVG\w*Element\]$/
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/



var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice

var W3C = window.dispatchEvent
var root = DOC.documentElement
/**
 * @DocumentFragment节点不属于文档树，继承的parentNode属性总是null。
 * 它有一个很实用的特点，当请求把一个DocumentFragment节点插入文档树时，
 * 插入的不是DocumentFragment自身，而是它的所有子孙节点。这个特性使得DocumentFragment成了占位符，
 * 暂时存放那些一次插入文档的节点
 * @当需要添加多个dom元素时，如果先将这些元素添加到DocumentFragment中，
 * 再统一将DocumentFragment添加到页面，会减少页面渲染dom的次数，效率会明显提升
 */
var avalonFragment = DOC.createDocumentFragment()
var cinerator = DOC.createElement("div")
var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})
function scpCompile(array){
    return Function.apply(noop,array)
}
function noop(){}

function oneObject(array, val) {
    if (typeof array === "string") {
        array = array.match(rword) || []
    }
    var result = {},
            value = val !== void 0 ? val : 1
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value
    }
    return result
}

//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = function (prefix) {
    prefix = prefix || "avalon"
    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, prefix)
}
function IE() {
    if (window.VBArray) {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    } else {
        return NaN
    }
}
var IEVersion = IE()

avalon = function (el) { //创建jQuery式的无new 实例化结构
    return new avalon.init(el)
}




/*
* @target 根据浏览器情况采用最快的异步回调
* @description 浏览器为了避免setTimeout嵌套可能出现卡死ui线程的情况，
* 为setTimeout设置了最小的执行时间间隔，不同浏览器的最小执行时间间隔都不一样。
* chrome下测试 setTimeout 0 的实际执行时间间隔大概在12ms左右
*/

// 来自网上
var setZeroTimeout = (function(){
  if(window.setImmediate){
    //IE10+版本，使用原生setImmediate
    return window.setImmediate;
  }
  else if("onreadystatechange" in document.createElement("script")){
    return function(){
        /* 使用onreadystatechange的版本 */
    }
  }
  else if(window.postMessage){
    return function(){
        /* 使用onmessage的异步执行版本 */
    }
  }
  else {
    return window.setTimeout;
  }

})();

avalon.nextTick = new function () {


    //IE 10+ node 支持 最快实现异步回调
    var tickImmediate = window.setImmediate

    // Mutation Observer API 用来监视 DOM 变动 它的特点： H5接口
    // 1. 它等待所有脚本任务完成后，才会运行（即异步触发方式）。
    // 2. 它把 DOM 变动记录封装成一个数组进行处理，而不是一条条个别处理 DOM 变动。
    // 3. 它既可以观察 DOM 的所有类型变动，也可以指定只观察某一类变动。
    var tickObserver = window.MutationObserver
    // 老版本的谷歌和火狐，则需要使用带前缀的 MO
    // var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
    if (tickImmediate) {
        return tickImmediate.bind(window)
    }

    // 取出事件队列中的事件执行
    var queue = []
    function callback() {
        var n = queue.length
        for (var i = 0; i < n; i++) {
            queue[i]()
        }
        queue = queue.slice(n)
        // todo
        // 返回空数组 为何不直接 = []
    }

    if (tickObserver) {
        var node = document.createTextNode("avalon")
        new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
        var bool = false
        return function (fn) {
            queue.push(fn)
            bool = !bool
            node.data = bool
        }
    }


    return function (fn) {
        setTimeout(fn, 4)
    }
}

/*
* @MutationObserver 测试
*     var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          console.log(mutation);
          console.log(mutation.type);
        })
      })

      // 传入目标节点和观察选项
      observer.observe(document.querySelector('#a'), { attributes: true,
        childList: true,
        characterData: true
      });

      // 随后,你还可以停止观察
      //  observer.disconnect();

      setTimeout(function(){
        document.querySelector('#a').innerHTML = "change"
      },1111)
    </script>
*/