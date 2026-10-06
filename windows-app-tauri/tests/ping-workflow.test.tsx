import React from 'react'
import assert from 'node:assert/strict'
import { create, act } from 'react-test-renderer'
import App from '../src/App'
import { VpnProvider, useVpn } from '../src/context/VpnContext'
import HomeScreen from '../src/screens/HomeScreen'
import SettingsScreen from '../src/screens/SettingsScreen'
import { ThemeProvider } from '../src/context/ThemeContext'
import { UpdateProvider } from '../src/context/UpdateContext'
import UpdateButton from '../src/components/UpdateButton'
const storage = new Map<string,string>()
Object.assign(globalThis, {
 localStorage: {getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)},
 document:{documentElement:{setAttribute(){}},activeElement:null,addEventListener(){},removeEventListener(){}},
 window:{addEventListener(){},removeEventListener(){},dispatchEvent(){},setInterval,clearInterval},
})
const profile = (id:string,sub:string) => ({id,name:id,subscriptionId:sub,protocol:'vless',serverAddress:'example.com',port:443,singboxConfig:{transport:'ws',security:'tls'}})
const fixtures = [profile('gozar-1','gozar'),profile('gozar-2','gozar'),profile('sale-1','sale')]
storage.set('vpn-storage-version','1.0.6'); storage.set('vpn-profiles',JSON.stringify(fixtures));
storage.set('vpn-subscriptions',JSON.stringify([{id:'gozar',name:'GozarVPN',url:'https://example.com/a'},{id:'sale',name:'Sale',url:'https://example.com/b'}]))
storage.set('vpn-last-screen','profiles');storage.set('vpn-selected-subscription','gozar')
let context:any, pingListener:any, vpnListener:any, calls:any[]=[]
let pending:((result:any)=>void)[]=[]
let latencyPending:((result:any)=>void)[]=[]
const api={onVpnStateChanged:(fn:any)=>vpnListener=fn,onVpnLog(){},onTrayConnect(){},onTrayDisconnect(){},onPingResult:(fn:any)=>pingListener=fn,
 batchRealDelay:(profiles:any[],url:any,requestId:string)=>{calls.push({ids:profiles.map(p=>p.id),requestId});return new Promise(resolve=>pending.push(resolve))},
 cancelPingTests:async()=>{},testLatency:()=>new Promise(resolve=>latencyPending.push(resolve)),fetchOriginalIp:async()=>null,
 tcpPing:async()=>({success:true,latency:41}),httpPing:async()=>({success:true,latency:42})}
;(window as any).electronAPI=api
const flush=async(fn?:()=>any)=>{await act(async()=>{await fn?.();await Promise.resolve()})}
function text(node:any):string {return Array.isArray(node)?node.map(text).join(''):typeof node==='object'&&node?text(node.children):String(node??'')}
function button(tree:any,label:string) {return tree.root.findAllByType('button').find((b:any)=>text(b.children)===label)!}
function chip(tree:any,label:string) {return tree.root.findAllByType('div').find((b:any)=>b.props.className?.includes('profile-card') && text(b.children).trim()===label)!}
async function run(){
 let app:any;await flush(()=>{app=create(<App/>)});
 assert.ok(chip(app,'GozarVPN').props.className.includes('selected'))
 await act(()=>{button(app,'Test all').props.onClick()}); assert.deepEqual(calls[0].ids,['gozar-1','gozar-2'])
 await flush(()=>button(app,'Stop').props.onClick());
 await flush(()=>{pingListener({profileId:'gozar-1',latency:999,mode:'real',requestId:calls[0].requestId});pending.shift()!({'gozar-1':999})});
 assert.ok(!text(app.toJSON()).includes('999ms'))
 await flush(()=>button(app,'Connection').props.onClick());await flush(()=>button(app,'Profiles').props.onClick());
 assert.ok(chip(app,'GozarVPN').props.className.includes('selected'))
 await flush(()=>app.unmount());await flush(()=>{app=create(<App/>)});
 assert.ok(button(app,'Profiles').props.className.includes('active'));assert.ok(chip(app,'GozarVPN').props.className.includes('selected'));
 await flush(()=>app.unmount());
 function Capture(){context=useVpn();return null}
 let tree:any;await flush(()=>{tree=create(<VpnProvider><Capture/><HomeScreen/></VpnProvider>)});
 let old:any;await flush(()=>{old=context.testAllPings('real',['gozar-1']);void context.testAllPings('real',['sale-1'])});
 assert.equal(calls.length,2,'Immediate duplicate requests are rejected')
 await flush(()=>context.cancelPings());let next:any;await flush(()=>{next=context.testAllPings('real',['sale-1'])});
 await flush(()=>pending.shift()!({'gozar-1':998}));await old;
 assert.equal(context.isTestingPings,true,'Old finalization must not reset newer run')
 await flush(()=>{pingListener({profileId:'sale-1',latency:123,mode:'real',requestId:calls.at(-1).requestId});pending.shift()!({'sale-1':123})});await next;
 assert.equal(context.profiles.find((p:any)=>p.id==='sale-1').ping,123);assert.equal(context.isTestingPings,false)
 await flush(()=>vpnListener({status:'connected',profile:fixtures[0]}));assert.equal(latencyPending.length,1)
 // Switching the session while an HTTP request is pending must ignore its result.
 await flush(()=>vpnListener({status:'disconnected'}));await flush(()=>vpnListener({status:'connected',profile:fixtures[2]}));
 await flush(()=>latencyPending.shift()!({success:true,latency:997}));assert.ok(!text(tree.toJSON()).includes('997ms'))
 await flush(()=>latencyPending.shift()!({success:true,latency:88}));assert.ok(text(tree.toJSON()).includes('88ms'))
 await flush(()=>tree.unmount());
 let routingCalls:any[]=[];let routingPending:((result:any)=>void)[]=[];let activeRouting=0,maxActiveRouting=0;
 (api as any).connect=(p:any)=>{
  routingCalls.push(p);activeRouting++;maxActiveRouting=Math.max(maxActiveRouting,activeRouting);
  return new Promise(resolve=>routingPending.push(result=>{activeRouting--;resolve(result)}))
 }
 await flush(()=>{tree=create(<ThemeProvider><VpnProvider><UpdateProvider><Capture/><SettingsScreen/></UpdateProvider></VpnProvider></ThemeProvider>)});
 await flush(()=>vpnListener({status:'connected',profile:fixtures[0]}));
 const inputs=()=>tree.root.findAllByType('textarea')
 for(let i=0;i<5;i++)await flush(()=>inputs()[1].props.onBlur());
 assert.equal(routingCalls.length,0,'Unchanged blur must not reconnect')
 await flush(()=>inputs()[1].props.onChange({target:{value:'1.1.1.1\n10.50.0.0/16'}}));
 await flush(()=>inputs()[1].props.onBlur());
 await act(()=>{tree.root.findByProps({'aria-label':'Save bypass IPs'}).props.onClick()});
 assert.equal(routingCalls.length,1,'Blur followed by Save must apply once')
 await flush(()=>inputs()[0].props.onChange({target:{value:'https://example.com/a\n*.example.com'}}));
 await flush(()=>inputs()[0].props.onBlur());
 assert.equal(routingCalls.length,1,'Domain edit must queue behind an in-flight IP apply')
 await flush(()=>routingPending.shift()!({success:true}));
 assert.equal(routingCalls.length,2);assert.equal(maxActiveRouting,1);
 assert.deepEqual(routingCalls[1].bypassDomains,['example.com']);assert.deepEqual(routingCalls[1].bypassIps,['1.1.1.1','10.50.0.0/16']);
 await flush(()=>routingPending.shift()!({success:true}));
 for(let i=0;i<5;i++)await flush(()=>{inputs()[0].props.onBlur();inputs()[1].props.onBlur()});
 assert.equal(routingCalls.length,2,'Neither input may restart repeatedly after save')
 ;(document as any).hasFocus=()=>false;
 await flush(()=>inputs()[1].props.onChange({target:{value:'192.168.10.5'}}));await flush(()=>inputs()[1].props.onBlur());
 assert.equal(routingCalls.length,2,'Losing application focus must not apply a partial edit')
 ;(document as any).hasFocus=()=>true;
 await act(()=>{tree.root.findByProps({'aria-label':'Save bypass IPs'}).props.onClick()});
 assert.equal(routingCalls.length,3);await flush(()=>routingPending.shift()!({success:true}));
 const saved=JSON.parse(storage.get('vpn-settings')!);assert.deepEqual(saved.bypassIps,['192.168.10.5']);assert.deepEqual(saved.bypassDomains,['example.com']);
 await flush(()=>tree.unmount());
 let checks=0,installs=0,externalOpens=0;let updatePending:((result:any)=>void)[]=[];
 ;(api as any).checkUpdate=()=>{checks++;return new Promise(resolve=>updatePending.push(resolve))};
 ;(api as any).installUpdate=async()=>{installs++};(api as any).openExternal=()=>{externalOpens++};
 await flush(()=>{tree=create(<UpdateProvider><UpdateButton compact/></UpdateProvider>)});
 assert.equal(checks,1);assert.equal(button(tree,'Checking…').props.disabled,true);
 await flush(()=>updatePending.shift()!(null));assert.ok(text(tree.toJSON()).includes('Up to date'));
 await flush(()=>button(tree,'Check for Updates').props.onClick());assert.equal(checks,2);
 await flush(()=>updatePending.shift()!({version:'2.0.38'}));assert.ok(button(tree,'Update'));
 assert.equal(externalOpens,0,'Sidebar manual check must call updater instead of opening releases');
 assert.equal(installs,0,'Checking must not install automatically');
 await flush(()=>button(tree,'Update').props.onClick());assert.equal(installs,1);
 await flush(()=>tree.unmount());console.log('PASS: ping workflows, persistence, bypass save deduplication/serialization/focus and sidebar manual update checking/installation')
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})
