"use strict";(self.webpackChunkludex_join_solana=self.webpackChunkludex_join_solana||[]).push([[522],{48522:(e,n,r)=>{r.r(n),r.d(n,{getED25519Key:()=>s});var a=r(99130),t=r.n(a),f=r(30261).Buffer;const o=t().lowlevel;function s(e){let n;n="string"===typeof e?f.from(e,"hex"):e;const r=new Uint8Array(64),a=[o.gf(),o.gf(),o.gf(),o.gf()],t=new Uint8Array([...new Uint8Array(n),...new Uint8Array(32)]),s=new Uint8Array(32);o.crypto_hash(r,t,32),r[0]&=248,r[31]&=127,r[31]|=64,o.scalarbase(a,r),o.pack(s,a);for(let f=0;f<32;f+=1)t[f+32]=s[f];return{sk:f.from(t),pk:f.from(s)}}}}]);
//# sourceMappingURL=522.5b86af7d.chunk.js.map