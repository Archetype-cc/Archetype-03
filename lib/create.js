const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const userHome = require('user-home');
const { writeDir } = require('./filesystem');
const Dat = require('dat-node');


// Argv
argv.loc = argv.loc || path.join(userHome, '/Archetype_Archive');

createTheme = (dir, template) => {
  return new Promise(function(resolve, reject) {
    try {
      writeDir(dir);
      console.log(template);
      resolve("dir created");
    } catch (error) {
      console.error(error)
    }

  });
}

success = () => {
  console.log('success');
  return
}

createFiles = (dir, name, hex, files) => {

  importDat(dir, name, hex).then(console.log('ok'))

}

importDat = (dir, name, hex) => {
  return new Promise(function(resolve, reject) {
    try {
      Dat(`${argv.loc}/${dir}/${name}`, {
        key: hex // (a 64 character hash from above)
      }, function(err, dat) {
        if (err) throw err
        dat.joinNetwork()
        console.log("created");
      })
      resolve("dir created");
    } catch (error) {
      console.error(error)
    }

  });
}

deleteDat = (dir) => {
  return new Promise(function(resolve, reject) {
    try {

      setTimeout(function() {
        fse.remove(`${argv.loc}/${dir}/dat.json`)
          .then(() => {
            console.log('success dat json!')
          })
          .catch(err => {
            console.error(err)
          })

        fse.remove(`${argv.loc}/${dir}/.dat`)
          .then(() => {
            console.log('success . dat!')
          })
          .catch(err => {
            console.error(err)
          })
      }, 5000);

    } catch (error) {
      console.log(error);
    }
  });
}

syncDat = (dir) => {
  console.log(`importing ${argv.loc}/${dir}`);

  Dat(`${argv.loc}/${dir}`, function(err, dat) {
    if (err) throw err

    var network = dat.joinNetwork()
    network.once('connection', function() {
      console.log('Connected')
    })
    var progress = dat.importFiles(`${argv.loc}/${dir}`, {
      ignore: ['**/dat-node/node_modules/**']
    }, function(err) {
      if (err) throw err
      console.log('Done importing')
      console.log('Archive size:', dat.archive.content.byteLength)
    })
    progress.on('put', function(src, dest) {
      console.log('Added', dest.name)
    })

    console.log(`Sharing: ${dat.key.toString('hex')}\n`)
  })
}

createDat = (dir) => {
  return new Promise(function(resolve, reject) {
    try {
      setTimeout(function() {

        Dat(`${argv.loc}/${dir}`, function(err, dat) {
          if (err) throw err

          var network = dat.joinNetwork()
          network.once('connection', function() {
            console.log('Connected')
          })
          var progress = dat.importFiles(`${argv.loc}/${dir}`, {
            ignore: ['**/dat-node/node_modules/**']
          }, function(err) {
            if (err) throw err
            console.log('Done importing')
            console.log('Archive size:', dat.archive.content.byteLength)
          })
          progress.on('put', function(src, dest) {
            console.log('Added', dest.name)
          })

          console.log(`Sharing: ${dat.key.toString('hex')}\n`)


          fs.writeFile(`${argv.loc}/${dir}/dat.json`, `
{
  "title": "${dir}",
  "description": "Archetype for ${dir}",
  "url": "dat://${dat.key.toString('hex')}"
}`, function(err) {
            console.log(err);
          });


        })
      }, 10000);
    } catch (error) {
      console.log(error);
    }
  });
}

cloneFolder = (dir, files) => {
  return new Promise(function(resolve, reject) {
    console.log('cloning folder');
    files.map((f, i) => {
      fse.copy(f.path, `${argv.loc}/${dir}/${f.name}`)
      .then(() => console.log('success!'))
      .catch(err => console.error(err));
    });
  });
}


module.exports = {
  createTheme,
  createFiles,
  syncDat,
  cloneFolder,
  importDat,
  deleteDat,
  createDat,
  success
}
