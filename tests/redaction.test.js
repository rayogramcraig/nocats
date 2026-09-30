import test from 'node:test';import assert from 'node:assert/strict';import {redact} from '../transform.js';
test('redacts cat terms with case and punctuation',()=>{assert.equal(redact('Cats, CAT; kitten / felines.'),'████, ███; ██████ / ███████.');});
test('does not redact substrings',()=>{assert.equal(redact('education category concatenate bobcat'),'education category concatenate bobcat');});
test('repeat calls are stable',()=>{assert.equal(redact('cat'),'███');assert.equal(redact('cat'),'███');});
