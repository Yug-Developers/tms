const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function deferred() {
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    return { promise, resolve, reject }
}

function home(offline = false) {
    const requests = []
    const stats = deferred(), sync = deferred(), summary = deferred()
    const store = {
        offline, activeTrips: [], closedStatusesIds: [],
        getStats() { requests.push('stats'); return stats.promise },
        pullTripsData() { requests.push('sync'); return sync.promise },
        getTripSummaries() { requests.push('summary'); return summary.promise }
    }
    const sandbox = {
        module: { exports: {} }, console: { error() {} }, useAppStore: () => store, useDisplay: () => ({}),
        ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }),
        onMounted: callback => { sandbox.mount = callback }
    }
    const source = fs.readFileSync(path.join(__dirname, '../src/pages/Home.vue'), 'utf8').match(/<script setup>([\s\S]*?)<\/script>/)[1]
    vm.runInNewContext(source.replace(/^import .*$/gm, '') + '\nmodule.exports = { filteredTrips, tripsLoading, statsLoading, summaries }', sandbox)
    return { ...sandbox.module.exports, store, requests, stats, sync, summary, mount: sandbox.mount }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('cards render before slow statistics and synchronization, then switch to full local documents', async () => {
    const page = home()
    const pending = page.mount()
    assert.deepEqual(page.requests, ['stats', 'sync', 'summary'])
    page.summary.resolve([{ _id: '1', executionStatus: 200 }, { _id: '2', executionStatus: 300 }])
    await tick()
    assert.equal(page.tripsLoading.value, false)
    assert.equal(page.statsLoading.value, true)
    assert.equal(page.filteredTrips.value.length, 1)
    page.store.activeTrips = [{ _id: 'full' }]
    page.sync.resolve()
    await tick()
    assert.equal(page.summaries.value, null)
    assert.equal(page.filteredTrips.value[0]._id, 'full')
    page.stats.resolve()
    await pending
    assert.equal(page.statsLoading.value, false)
})

test('late summaries cannot replace completed local synchronization', async () => {
    const page = home()
    const pending = page.mount()
    page.store.activeTrips = [{ _id: 'fresh' }]
    page.sync.resolve()
    await tick()
    page.summary.resolve([{ _id: 'older', executionStatus: 100 }])
    page.stats.resolve()
    await pending
    assert.equal(page.summaries.value, null)
    assert.equal(page.filteredTrips.value[0]._id, 'fresh')
})

test('offline home uses local documents without requesting summaries', async () => {
    const page = home(true)
    const pending = page.mount()
    assert.deepEqual(page.requests, ['stats', 'sync'])
    page.store.activeTrips = [{ _id: 'offline' }]
    page.sync.resolve()
    page.stats.resolve()
    await pending
    assert.equal(page.filteredTrips.value[0]._id, 'offline')
    assert.equal(page.tripsLoading.value, false)
})

test('summary and statistics failures allow local synchronization to render cards', async () => {
    const page = home()
    const pending = page.mount()
    page.summary.reject(new Error('summary unavailable'))
    page.stats.reject(new Error('stats unavailable'))
    await tick()
    assert.equal(page.tripsLoading.value, true)
    page.store.activeTrips = [{ _id: 'fallback' }]
    page.sync.resolve()
    await pending
    assert.equal(page.filteredTrips.value[0]._id, 'fallback')
    assert.equal(page.statsLoading.value, false)
})

test('a synchronization failure retains successful summaries and clears loading', async () => {
    const page = home()
    const pending = page.mount()
    page.sync.reject(new Error('sync unavailable'))
    page.stats.resolve()
    page.summary.resolve([{ _id: 'summary', executionStatus: 100 }])
    await pending
    assert.equal(page.filteredTrips.value[0]._id, 'summary')
    assert.equal(page.tripsLoading.value, false)
})
