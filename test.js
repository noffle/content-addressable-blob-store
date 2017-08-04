var os = require('os')
var path = require('path')
var fs = require('fs')

var test = require('tape')
var rimraf = require('rimraf')
var abstractBlobTests = require('abstract-blob-store/tests')

var blobs = require('./')
var blobPath = path.join((os.tmpdir || os.tmpDir)(), 'fs-blob-store-tests')

var common = {
  setup: function(t, algo, cb) {
    if (cb === undefined && typeof algo === 'function') {
      cb = algo
      algo = undefined
    }
    rimraf(blobPath, function() {
      var storeOpts = { path: blobPath }
      if (algo) storeOpts.algo = algo
      var store = blobs(storeOpts)
      cb(null, store)
    })
  },
  teardown: function(t, store, blob, cb) {
    rimraf(blobPath, cb)
  }
}

abstractBlobTests(test, common)

test('remove file', function(t) {
  common.setup(t, function(err, store) {
    var w = store.createWriteStream()
    w.write('hello')
    w.write('world')
    w.end(function() {
      store.remove(w, function(err, deleted) {
        t.notOk(err, 'no err')
        t.ok(deleted, 'was deleted')
        common.teardown(t, null, null, function(err) {
          t.end()
        })
      })
    })
  })
})

test('seek blob', function(t) {
  common.setup(t, function(err, store) {
    var w = store.createWriteStream()
    w.write('hello')
    w.write('world')
    w.end(function() {
      var buff = ""
      var blob = store.createReadStream({ key: w.key, start: 5 })
      blob.on('data', function (data) { buff += data })
      blob.on('end', function () {
        t.equal(buff, 'world')
        common.teardown(t, null, null, function(err) {
          t.end()
        })
      })
    })
  })
})


test('resolve blob', function(t) {
  common.setup(t, function(err, store) {
    var w = store.createWriteStream()
    w.write('hello')
    w.write('world')
    w.end(function() {
      var buff = ""
      store.resolve({key: w.key}, function (err, path, stat) {
        t.error(err, 'no error')
        t.notEqual(path, false, 'path should not be false')
        t.notEqual(stat, null, 'path is not null')
        t.true(stat instanceof fs.Stats, 'stat is instanceof Stats')
        store.resolve('foo', function (err, path, stat) {
          t.equal(path, false, 'path should be false for missing key')
          t.equal(stat, null, 'path is null for missing key')
          common.teardown(t, null, null, function(err) {
            t.end()
          })
        })
      })
    })
  })
})

test('check metadata', function(t) {
  common.setup(t, function(err, store) {
    var w = store.createWriteStream(done)
    w.write('hello')
    w.write('world')
    w.end()

    function done (err, meta) {
      t.error(err)
      t.deepEquals(meta, {
        key: '936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af.sha256',
        size: 10
      })
      common.teardown(t, null, null, function(err) {
        t.end()
      })
    }
  })
})

test('alternate algo', function(t) {
  common.setup(t, 'sha512', function(err, store) {
    var w = store.createWriteStream(done)
    w.write('hello')
    w.write('world')
    w.end()

    function done (err, meta) {
      t.error(err)
      t.deepEquals(meta, {
        key: '1594244d52f2d8c12b142bb61f47bc2eaf503d6d9ca8480cae9fcf112f66e4967dc5e8fa98285e36db8af1b8ffa8b84cb15e0fbcf836c3deb803c13f37659a60.sha512',
        size: 10
      })
      common.teardown(t, null, null, function(err) {
        t.end()
      })
    }
  })
})

