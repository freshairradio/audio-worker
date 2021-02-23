!function(e){var t={};function s(i){if(t[i])return t[i].exports;var n=t[i]={i:i,l:!1,exports:{}};return e[i].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=e,s.c=t,s.d=function(e,t,i){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)s.d(i,n,function(t){return e[t]}.bind(null,n));return i},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=1)}([function(e,t,s){!function(e){"use strict";
/**
   * @license MIT <https://opensource.org/licenses/MIT>
   * @copyright Michael Hart 2018
   */const t=new TextEncoder,s={appstream2:"appstream",cloudhsmv2:"cloudhsm",email:"ses",marketplace:"aws-marketplace",mobile:"AWSMobileHubService",pinpoint:"mobiletargeting",queue:"sqs","git-codecommit":"codecommit","mturk-requester-sandbox":"mturk-requester","personalize-runtime":"personalize"},i=["authorization","content-type","content-length","user-agent","presigned-expires","expect","x-amzn-trace-id","range"];class n{constructor({method:e,url:t,headers:n,body:r,accessKeyId:a,secretAccessKey:o,sessionToken:h,service:d,region:u,cache:l,datetime:p,signQuery:y,appendSessionToken:g,allHeaders:m,singleEncode:f}){if(null==t)throw new TypeError("url is a required option");if(null==a)throw new TypeError("accessKeyId is a required option");if(null==o)throw new TypeError("secretAccessKey is a required option");let w,A;this.method=e||(r?"POST":"GET"),this.url=new URL(t),this.headers=new Headers(n||{}),this.body=r,this.accessKeyId=a,this.secretAccessKey=o,this.sessionToken=h,d&&u||([w,A]=function(e,t){const{hostname:i,pathname:n}=e,r=i.replace("dualstack.","").match(/([^.]+)\.(?:([^.]*)\.)?amazonaws\.com(?:\.cn)?$/);let[a,o]=(r||["",""]).slice(1,3);if("us-gov"===o)o="us-gov-west-1";else if("s3"===o||"s3-accelerate"===o)o="us-east-1",a="s3";else if("iot"===a)a=i.startsWith("iot.")?"execute-api":i.startsWith("data.jobs.iot.")?"iot-jobs-data":"/mqtt"===n?"iotdevicegateway":"iotdata";else if("autoscaling"===a){const e=(t.get("X-Amz-Target")||"").split(".")[0];"AnyScaleFrontendService"===e?a="application-autoscaling":"AnyScaleScalingPlannerFrontendService"===e&&(a="autoscaling-plans")}else null==o&&a.startsWith("s3-")?(o=a.slice(3).replace(/^fips-|^external-1/,""),a="s3"):a.endsWith("-fips")?a=a.slice(0,-5):o&&/-\d$/.test(a)&&!/-\d$/.test(o)&&([a,o]=[o,a]);return[s[a]||a,o]}(this.url,this.headers)),this.service=d||w||"",this.region=u||A||"us-east-1",this.cache=l||new Map,this.datetime=p||(new Date).toISOString().replace(/[:-]|\.\d{3}/g,""),this.signQuery=y,this.appendSessionToken=g||"iotdevicegateway"===this.service,this.headers.delete("Host");const S=this.signQuery?this.url.searchParams:this.headers;if("s3"!==this.service||this.headers.has("X-Amz-Content-Sha256")||this.headers.set("X-Amz-Content-Sha256","UNSIGNED-PAYLOAD"),S.set("X-Amz-Date",this.datetime),this.sessionToken&&!this.appendSessionToken&&S.set("X-Amz-Security-Token",this.sessionToken),this.signableHeaders=["host",...this.headers.keys()].filter(e=>m||!i.includes(e)).sort(),this.signedHeaders=this.signableHeaders.join(";"),this.canonicalHeaders=this.signableHeaders.map(e=>e+":"+("host"===e?this.url.host:(this.headers.get(e)||"").replace(/\s+/g," "))).join("\n"),this.credentialString=[this.datetime.slice(0,8),this.region,this.service,"aws4_request"].join("/"),this.signQuery&&("s3"!==this.service||S.has("X-Amz-Expires")||S.set("X-Amz-Expires","86400"),S.set("X-Amz-Algorithm","AWS4-HMAC-SHA256"),S.set("X-Amz-Credential",this.accessKeyId+"/"+this.credentialString),S.set("X-Amz-SignedHeaders",this.signedHeaders)),"s3"===this.service)try{this.encodedPath=decodeURIComponent(this.url.pathname.replace(/\+/g," "))}catch(e){this.encodedPath=this.url.pathname}else this.encodedPath=this.url.pathname.replace(/\/+/g,"/");f||(this.encodedPath=encodeURIComponent(this.encodedPath).replace(/%2F/g,"/")),this.encodedPath=c(this.encodedPath);const b=new Set;this.encodedSearch=[...this.url.searchParams].filter(([e])=>{if(!e)return!1;if("s3"===this.service){if(b.has(e))return!1;b.add(e)}return!0}).map(e=>e.map(e=>c(encodeURIComponent(e)))).sort(([e,t],[s,i])=>e<s?-1:e>s?1:t<i?-1:t>i?1:0).map(e=>e.join("=")).join("&")}async sign(){return this.signQuery?(this.url.searchParams.set("X-Amz-Signature",await this.signature()),this.sessionToken&&this.appendSessionToken&&this.url.searchParams.set("X-Amz-Security-Token",this.sessionToken)):this.headers.set("Authorization",await this.authHeader()),{method:this.method,url:this.url,headers:this.headers,body:this.body}}async authHeader(){return["AWS4-HMAC-SHA256 Credential="+this.accessKeyId+"/"+this.credentialString,"SignedHeaders="+this.signedHeaders,"Signature="+await this.signature()].join(", ")}async signature(){const e=this.datetime.slice(0,8),t=[this.secretAccessKey,e,this.region,this.service].join();let s=this.cache.get(t);if(!s){const i=await r("AWS4"+this.secretAccessKey,e),n=await r(i,this.region),a=await r(n,this.service);s=await r(a,"aws4_request"),this.cache.set(t,s)}return o(await r(s,await this.stringToSign()))}async stringToSign(){return["AWS4-HMAC-SHA256",this.datetime,this.credentialString,o(await a(await this.canonicalString()))].join("\n")}async canonicalString(){return[this.method.toUpperCase(),this.encodedPath,this.encodedSearch,this.canonicalHeaders+"\n",this.signedHeaders,await this.hexBodyHash()].join("\n")}async hexBodyHash(){let e=this.headers.get("X-Amz-Content-Sha256");if(null==e){if(this.body&&"string"!=typeof this.body&&!("byteLength"in this.body))throw new Error("body must be a string, ArrayBuffer or ArrayBufferView, unless you include the X-Amz-Content-Sha256 header");e=o(await a(this.body||""))}return e}}async function r(e,s){const i=await crypto.subtle.importKey("raw","string"==typeof e?t.encode(e):e,{name:"HMAC",hash:{name:"SHA-256"}},!1,["sign"]);return crypto.subtle.sign("HMAC",i,t.encode(s))}async function a(e){return crypto.subtle.digest("SHA-256","string"==typeof e?t.encode(e):e)}function o(e){return Array.prototype.map.call(new Uint8Array(e),e=>("0"+e.toString(16)).slice(-2)).join("")}function c(e){return e.replace(/[!'()*]/g,e=>"%"+e.charCodeAt(0).toString(16).toUpperCase())}e.AwsClient=class{constructor({accessKeyId:e,secretAccessKey:t,sessionToken:s,service:i,region:n,cache:r,retries:a,initRetryMs:o}){if(null==e)throw new TypeError("accessKeyId is a required option");if(null==t)throw new TypeError("secretAccessKey is a required option");this.accessKeyId=e,this.secretAccessKey=t,this.sessionToken=s,this.service=i,this.region=n,this.cache=r||new Map,this.retries=null!=a?a:10,this.initRetryMs=o||50}async sign(e,t){if(e instanceof Request){const{method:s,url:i,headers:n,body:r}=e;null==(t=Object.assign({method:s,url:i,headers:n},t)).body&&n.has("Content-Type")&&(t.body=null!=r&&n.has("X-Amz-Content-Sha256")?r:await e.clone().arrayBuffer()),e=i}const s=new n(Object.assign({url:e},t,this,t&&t.aws)),i=Object.assign({},t,await s.sign());return delete i.aws,new Request(i.url.toString(),i)}async fetch(e,t){for(let s=0;s<=this.retries;s++){const i=fetch(await this.sign(e,t));if(s===this.retries)return i;const n=await i;if(n.status<500&&429!==n.status)return n;await new Promise(e=>setTimeout(e,Math.random()*this.initRetryMs*Math.pow(2,s)))}throw new Error("An unknown error occurred, ensure retries is not negative")}},e.AwsV4Signer=n,Object.defineProperty(e,"__esModule",{value:!0})}(t)},function(e,t,s){"use strict";s.r(t);var i=s(0);const n=new i.AwsClient({accessKeyId:"LF77PO4N7FOBIXXFEYKA",secretAccessKey:"myfFXlTxbyxaRtJPo1drn8zWAXDdAN88XZaIYvz1cEM",region:""});async function r(e){let t=await fetch("https://api.freshair.radio/public/shows").then(e=>e.json());await Promise.all(t.map(e=>e.slug).map(async e=>{let t=await fetch("https://api.freshair.radio/rss/"+e).then(e=>e.text()),s=await n.fetch("https://freshair.nyc3.digitaloceanspaces.com?Key=rssfeed/"+e+".xml",{body:t,aws:{service:"s3"}});console.log(s)}))}addEventListener("scheduled",e=>{e.respondWith(r(e.request))}),addEventListener("fetch",e=>{e.respondWith(r(e.request))})}]);