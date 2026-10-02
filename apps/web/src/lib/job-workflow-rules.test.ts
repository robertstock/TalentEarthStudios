import test from 'node:test';
import assert from 'node:assert/strict';
import {businessDay,jobNumber,canonicalHash,fullJobNumbers,productionFolderName} from './job-workflow-rules.ts';
test('Pacific date crosses UTC midnight and DST without using workspace timezone',()=>{
 assert.equal(businessDay(new Date('2026-10-03T06:59:59Z'),'America/Los_Angeles'),'2026_10_02');
 assert.equal(businessDay(new Date('2026-10-03T07:00:00Z'),'America/Los_Angeles'),'2026_10_03');
 assert.equal(businessDay(new Date('2026-11-01T08:30:00Z'),'America/Los_Angeles'),'2026_11_01');
 assert.equal(businessDay(new Date('2026-11-01T09:30:00Z'),'America/Los_Angeles'),'2026_11_01');
 assert.throws(()=>businessDay(new Date(),''));
});
test('daily sequence expands rather than wrapping; hashes ignore key ordering',()=>{
 assert.equal(jobNumber('2026_10_02',1),'TE_2026_10_02_001');
 assert.equal(jobNumber('2026_10_02',1000),'TE_2026_10_02_1000');
 assert.throws(()=>jobNumber('2026_10_02',0));
 assert.equal(canonicalHash({b:2,a:1}),canonicalHash({a:1,b:2}));
});
test('full evidence only: reject invalid dates, retain conflicts, never match by name or PO',()=>{
 assert.deepEqual(fullJobNumbers(['K&L 48139 Actors Gang PO Actors Gang9-25']),[]);
 assert.deepEqual(fullJobNumbers(['Invoice [TE_2026_10_02_001]','TE_2026_10_02_001.pdf']),['TE_2026_10_02_001']);
 assert.equal(fullJobNumbers(['TE_2026_10_02_001 TE_2026_10_02_002']).length,2);
 assert.deepEqual(fullJobNumbers(['XTE_2026_10_02_001','TE_2026_10_02_001suffix']),[]);
 assert.throws(()=>fullJobNumbers(['TE_2026_02_30_001']));
 assert.throws(()=>fullJobNumbers(['TE_2026_10_02_000']));
});
test('Mac folder names replace only invalid characters and retain full identity',()=>{
 assert.equal(productionFolderName('Actors/Gang: PYOB','TE_2026_10_02_001'),'Actors_Gang_ PYOB — TE_2026_10_02_001');
 assert.throws(()=>productionFolderName('x'.repeat(255),'TE_2026_10_02_001'));
});
