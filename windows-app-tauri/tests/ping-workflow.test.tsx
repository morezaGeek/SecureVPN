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
import { parseShareLink, parseSubscriptionData, generateShareLink } from '../src/utils/linkParser'
import { pingTone, sortProfilesByPing } from '../src/utils/profilePresentation'
import { effectiveXhttpMode, withEffectiveXhttpMode } from '../src/types'
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
const api={onVpnStateChanged:(fn:any)=>{vpnListener=fn;return ()=>{if(vpnListener===fn)vpnListener=()=>{}}},onVpnLog(){},onTrayConnect(){},onTrayDisconnect(){},onPingResult:(fn:any)=>pingListener=fn,
 batchRealDelay:(profiles:any[],url:any,requestId:string)=>{calls.push({ids:profiles.map(p=>p.id),requestId});return new Promise(resolve=>pending.push(resolve))},
 cancelPingTests:async()=>{},testLatency:()=>new Promise(resolve=>latencyPending.push(resolve)),fetchOriginalIp:async()=>null,
 tcpPing:async()=>({success:true,latency:41}),httpPing:async()=>({success:true,latency:42})}
;(window as any).electronAPI=api
const flush=async(fn?:()=>any)=>{await act(async()=>{await fn?.();await Promise.resolve()})}
function text(node:any):string {return Array.isArray(node)?node.map(text).join(''):typeof node==='object'&&node?text(node.children):String(node??'')}
function button(tree:any,label:string) {return tree.root.findAllByType('button').find((b:any)=>text(b.children).trim()===label)!}
function chip(tree:any,label:string) {return tree.root.findAllByType('div').find((b:any)=>b.props.className?.includes('profile-card') && text(b.children).trim()===label)!}
async function run(){
 const echLink='vless://00000000-0000-0000-0000-000000000001@example.com:443?security=tls&type=xhttp&mode=packet-up&ech=cloudflare-ech.com%2Budp%3A%2F%2F1.1.1.1&path=%2Ftest%252Fkeep#Finland';
 const ech=parseShareLink(echLink)!;assert.equal(ech.config.ech,'cloudflare-ech.com+udp://1.1.1.1');assert.equal(ech.config.path,'/test%2Fkeep');
 assert.deepEqual(parseShareLink(generateShareLink('vless',ech.name,ech.config)),ech);
 assert.equal(parseSubscriptionData(echLink,{},'https://example.com/sub').links.length,1);
 const xhttp=(mode?:string,xhttpModeOverride?:string)=>({...fixtures[0],xhttpModeOverride,singboxConfig:{transport:'xhttp',security:'tls',mode}}) as any;
 assert.equal(effectiveXhttpMode(xhttp('auto'),true),'stream-up','Auto links use stream-up by default');
 assert.equal(effectiveXhttpMode(xhttp(undefined),false),'auto');
 assert.equal(effectiveXhttpMode(xhttp('packet-up'),true),'packet-up','An explicit server mode is respected');
 assert.equal(effectiveXhttpMode(xhttp('stream-up','packet-up'),true),'packet-up','A profile choice wins');
 assert.equal(effectiveXhttpMode(fixtures[0] as any,true),undefined);
 assert.equal(withEffectiveXhttpMode(xhttp('auto'),true).singboxConfig?.mode,'stream-up');
 const gecko=parseShareLink('hysteria2://p%3A%40ss@example.com:443?obfs=gecko&obfs-password=test&minPacketSize=600&maxPacketSize=1300#Test')!;
 assert.equal(gecko.config.uuid,'p:@ss');assert.equal(gecko.config.hysteriaObfsMinPacketSize,600);
 assert.deepEqual(parseShareLink(generateShareLink('hysteria2',gecko.name,gecko.config)),gecko);
 const unicodeName = 'سرور آزمایشی 🇩🇪';
 const vmess = generateShareLink('vmess', unicodeName, { uuid: 'synthetic-id', address: 'example.com', port: 443, transport: 'tcp', security: 'tls' });
 assert.equal(parseShareLink(vmess)?.name, unicodeName);
 const thresholds = [undefined, -1, 0, 99, 100, 160, 161, 270, 271];
 assert.deepEqual(thresholds.map(pingTone), ['untested', 'red', 'blue', 'blue', 'green', 'green', 'yellow', 'yellow', 'red']);
 const ranked = [
  { ...fixtures[0], id:'untested', ping:undefined }, { ...fixtures[0], id:'slow', ping:400 },
  { ...fixtures[0], id:'timeout', ping:-1 }, { ...fixtures[0], id:'fast', ping:20 },
  { ...fixtures[0], id:'fast-tie', ping:20 }, { ...fixtures[0], id:'invalid', ping:NaN }
 ] as Parameters<typeof sortProfilesByPing>[0];
 assert.deepEqual(sortProfilesByPing(ranked).map(p=>p.id), ['fast', 'fast-tie', 'slow', 'untested', 'timeout', 'invalid']);
 assert.equal(ranked[0].id, 'untested', 'Sorting cannot change the stored order');
 let app:any;await flush(()=>{app=create(<App/>)});
 assert.ok(chip(app,'GozarVPN').props.className.includes('selected'))
 await act(()=>{button(app,'Test all').props.onClick()}); assert.deepEqual(calls[0].ids,['gozar-1','gozar-2'])
 await flush(()=>button(app,'Stop').props.onClick());
 await flush(()=>{pingListener({profileId:'gozar-1',latency:999,mode:'real',requestId:calls[0].requestId});pending.shift()!({'gozar-1':999})});
 assert.ok(!text(app.toJSON()).includes('999ms'))
 const sort = () => app.root.findAllByType('select').find((s:any)=>s.props.value === 'default' || s.props.value === 'ping');
 const order = () => app.root.findAllByType('button')
  .filter((r:any)=>r.props.className === 'config-card-select').map((r:any)=>r.props['aria-label']);
 assert.deepEqual(order(), ['Select gozar-1','Select gozar-2']);
 const storedOrder=JSON.stringify(JSON.parse(storage.get('vpn-profiles')!).map((p:any)=>p.id));
 await flush(()=>sort().props.onChange({target:{value:'ping'}}));
 assert.equal(storage.get('vpn-profile-sort'),'ping');
 const target=()=>app.root.findByProps({'aria-label':'Select gozar-2'});
 const actionBar=()=>app.root.findAllByProps({'aria-label':'Profile actions'});
 assert.equal(actionBar().length,0);
 const trigger={ scrollIntoView(){}, focus(){} };
 await flush(()=>target().props.onKeyDown({key:'F10',shiftKey:true,preventDefault(){},currentTarget:trigger}));
 assert.ok(text(actionBar()[0].children).includes('gozar-2'));
 assert.equal(storage.get('vpn-selected-profile'),undefined,'Actions must not select a connection');
 await flush(()=>button(app,'Edit').props.onClick());
 assert.ok(text(app.toJSON()).includes('Edit Profile'));
 assert.ok(app.root.findAllByType('input').some((i:any)=>i.props.value==='gozar-2'));
 await flush(()=>button(app,'Cancel').props.onClick());
 await flush(()=>target().props.onContextMenu({button:2,preventDefault(){},currentTarget:trigger}));
 let confirmed='';
 Object.assign(globalThis,{confirm:(message:string)=>{confirmed=message;return false}});
 await flush(()=>button(app,'Delete').props.onClick());
 assert.ok(confirmed.includes('gozar-2'));
 assert.deepEqual(order(), ['Select gozar-1','Select gozar-2']);
 await flush(()=>chip(app,'Sale').props.onClick());
 assert.deepEqual(order(), ['Select sale-1']);
 assert.equal(actionBar().length,0);
 await flush(()=>chip(app,'GozarVPN').props.onClick());
 assert.equal(JSON.stringify(JSON.parse(storage.get('vpn-profiles')!).map((p:any)=>p.id)),storedOrder);
 await flush(()=>button(app,'Connection').props.onClick());await flush(()=>button(app,'Profiles').props.onClick());
 assert.equal(sort().props.value,'ping','Sort survives leaving the profiles tab');
 assert.ok(chip(app,'GozarVPN').props.className.includes('selected'))
 await flush(()=>app.unmount());await flush(()=>{app=create(<App/>)});
 assert.ok(button(app,'Profiles').props.className.includes('active'));assert.ok(chip(app,'GozarVPN').props.className.includes('selected'));
 assert.equal(sort().props.value,'ping','Sort is restored on restart');
 await flush(()=>app.unmount());
 function Capture(){context=useVpn();return null}
 let tree:any;await flush(()=>{tree=create(<VpnProvider><Capture/><HomeScreen/></VpnProvider>)});
 await flush(()=>context.selectProfile(fixtures[2]));assert.equal(storage.get('vpn-selected-profile'),'sale-1');
 await flush(()=>tree.unmount());await flush(()=>{tree=create(<VpnProvider><Capture/><HomeScreen/></VpnProvider>)});
 assert.equal(context.currentProfile?.id,'sale-1','Manual profile choice survives application restart');
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
 const liveStats={uploadSpeed:8192,downloadSpeed:65536,totalUploaded:3000000,totalDownloaded:8000000,connectedTime:125000,privateIp:'172.19.0.1',publicIp:'1.2.3.4',mtu:1400};
 await flush(()=>vpnListener({status:'connected',profile:fixtures[2],stats:liveStats}));assert.ok(text(tree.toJSON()).includes('2:05'));
 await flush(()=>tree.update(<VpnProvider><Capture/></VpnProvider>));
 await flush(()=>vpnListener({status:'connected',profile:fixtures[2],stats:{...liveStats,connectedTime:126000,downloadSpeed:131072}}));
 await flush(()=>tree.update(<VpnProvider><Capture/><HomeScreen/></VpnProvider>));assert.ok(text(tree.toJSON()).includes('2:06'),'Tab remount uses service clock');assert.equal(context.stats.downloadSpeed,131072);
 await flush(()=>tree.unmount());
 let recovery:any;(api as any).getVpnState=()=>new Promise(resolve=>recovery=resolve);
 await flush(()=>{tree=create(<VpnProvider><Capture/></VpnProvider>)});
 await flush(()=>vpnListener({status:'connected',profile:fixtures[2],stats:liveStats}));
 await flush(()=>recovery({status:'disconnected',profile:null,stats:{...liveStats,connectedTime:0}}));
 assert.equal(context.connectionState,'connected','Older recovery response must not overwrite a newer live event');
 assert.equal(context.stats.connectedTime,125000);await flush(()=>tree.unmount());delete (api as any).getVpnState;
 (api as any).fetchSubscription=async()=>({success:true,content:'vless://00000000-0000-4000-8000-000000000001@renewed.example.com:443?security=tls&type=ws#gozar-1',headers:{}});
 await flush(()=>{tree=create(<VpnProvider><Capture/></VpnProvider>)});
 await flush(()=>context.selectProfile(context.profiles.find((p:any)=>p.id==='gozar-1')));
 await flush(()=>context.refreshSubscription('gozar'));
 assert.equal(context.currentProfile.id,'gozar-1','Subscription renewal keeps selected identity');assert.equal(context.currentProfile.serverAddress,'renewed.example.com');
 await flush(()=>tree.unmount());
 let routingCalls:any[]=[];let routingPending:((result:any)=>void)[]=[];let activeRouting=0,maxActiveRouting=0;
 (api as any).connect=(p:any)=>{
  routingCalls.push(p);activeRouting++;maxActiveRouting=Math.max(maxActiveRouting,activeRouting);
  return new Promise(resolve=>routingPending.push(result=>{activeRouting--;resolve(result)}))
 }
 await flush(()=>{tree=create(<ThemeProvider><VpnProvider><UpdateProvider><Capture/><SettingsScreen/></UpdateProvider></VpnProvider></ThemeProvider>)});
 await flush(()=>vpnListener({status:'connected',profile:fixtures[0]}));
 const dnsForm = () => tree.root.findByProps({className:'tunnel-dns-settings'});
 const dnsInput = () => tree.root.findByProps({id:'tunnel-doh-url'});
 assert.equal(dnsInput().props.value,'https://8.8.8.8/dns-query','An existing settings file gets the Google DNS default');
 await flush(()=>dnsInput().props.onChange({target:{value:'http://resolver.example.com/dns-query'}}));
 await flush(()=>dnsForm().props.onSubmit({preventDefault(){}}));
 assert.ok(tree.root.findByProps({role:'alert'}));
 await flush(()=>dnsInput().props.onChange({target:{value:'https://resolver.example.com/dns-query'}}));
 await flush(()=>dnsForm().props.onSubmit({preventDefault(){}}));
 assert.equal(context.settings.tunnelDnsUrl,'https://resolver.example.com/dns-query');
 assert.equal(routingCalls.length,0,'Saving Tunnel DNS waits for the next connection');
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
 assert.equal(routingCalls[1].tunnelDnsUrl,'https://resolver.example.com/dns-query');
 assert.equal(routingCalls[1].tunnelDnsFakeIp,false);
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
 assert.equal(saved.tunnelDnsUrl,'https://resolver.example.com/dns-query');
 await flush(()=>button(tree,'Use Google DNS').props.onClick());
 assert.equal(JSON.parse(storage.get('vpn-settings')!).tunnelDnsUrl,'https://8.8.8.8/dns-query');
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
