const fs=require('fs'),vm=require('vm');
const noop=()=>{};
const element=new Proxy({getAttribute:()=>String(),style:{},classList:{add:noop,remove:noop},getContext:()=>new Proxy({},{get:()=>noop}),addEventListener:noop},{get:(o,k)=>k in o?o[k]:noop});
const context={console, setTimeout:()=>0,clearTimeout:noop,setInterval:()=>0,clearInterval:noop,URL,URLSearchParams,performance:{now:()=>0},location:{hostname:'localhost',search:'',href:'http://localhost/'},navigator:{language:'en',userAgent:'Node'},localStorage:{getItem:()=>null,setItem:noop},document:{createElement:()=>element,getElementById:()=>element,querySelector:()=>element,querySelectorAll:()=>[],addEventListener:noop,documentElement:element,head:element,body:element},Image:class{addEventListener(){}},Audio:class{},addEventListener:noop,requestAnimationFrame:noop};
context.window=context;context.globalThis=context;
context.CanvasRenderingContext2D=class{};
context.matchMedia=()=>({matches:false,addEventListener:noop});
vm.createContext(context);
let source=fs.readFileSync(require('path').join(__dirname,'../js/app.min.js'),'utf8');
// Stop before application startup while retaining the actual engine and data.
source=source.replace("_0x369baa['Flow']={'boot'()", "globalThis.__engine=_0x369baa;return;_0x369baa['Flow']={'boot'()");
try{vm.runInContext(source,context,{timeout:20000});}catch(e){console.error(e.stack.split(String.fromCharCode(10)).slice(-10).join(String.fromCharCode(10)));process.exit(1);}
module.exports={context,engine:context.__engine,vm};

