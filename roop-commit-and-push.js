const fs = require('fs');
const { promisify } = require( 'util' )
const simpleGit = require('simple-git');
const child_process = require('node:child_process');
const _ = require('lodash');
const git = simpleGit();

const limitFileSize = 1900000000;

async function executeCommitAndPushRoutine(){
  let remainFileCount = 0;
  do {
    const statusResult = await git.status();
    const notAddFileCount = statusResult.created.length + statusResult.not_added.length;
    // ダブっているファイルがあるためSetにして除去する
    const addFileSet = new Set();
    const createdFilePromises = [];
    // すでに git add されているファイルの容量を計算して、残りまだgit addできるもののみを全てgit addする
    for(const addedFile of statusResult.created){
      createdFilePromises.push(promisify(fs.stat)(addedFile));
    }
    const createdFileStats = await Promise.all(createdFilePromises);
    let sumSize = 0;
    for(const fileStat of createdFileStats) {
        sumSize = sumSize + fileStat.size;
    }
    console.log(`createdFileSize:${sumSize} willPushFileSize:${statusResult.not_added.length}`);
    if(sumSize <= limitFileSize) {
      const fileStatPromises = statusResult.not_added.map((notAddFile) => promisify(fs.stat)(notAddFile))
      const willAddFiles = await Promise.all(fileStatPromises);
      for (let i = 0;i < statusResult.not_added.length; ++i) {
        const notAddFile = statusResult.not_added[i];
        const fileStat = willAddFiles[i];
        if (!fileStat || ((sumSize + fileStat.size) > limitFileSize)) {
          break;
        }
        sumSize = sumSize + fileStat.size;
        addFileSet.add(notAddFile.toString());
      }
    }
    const totalFileCount = addFileSet.size;
    remainFileCount = notAddFileCount - totalFileCount;
    console.log(`add files:${totalFileCount.toString()} fileSize:${sumSize}`);
    const fileChunkedList = _.chunk(Array.from(addFileSet), 100)
    for(const files of fileChunkedList){
      // 非同期で複数ファイルをaddしようとするとエラーになるので一つずつaddする
      child_process.execSync(['git', 'add', ...files].join(' '))
    }
    console.log("add file completed:" + totalFileCount.toString());
    const nowDate = new Date();
    const dateString = [nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate()].join("/");
    const timeString = [nowDate.getHours(), nowDate.getMinutes(), nowDate.getSeconds()].join(":");
    const commitMessage = [dateString, timeString, totalFileCount, "files add"].join(" ");
    console.log(commitMessage);
    await git.commit(commitMessage);
    console.log("committed " + totalFileCount.toString() + " files");
    await git.push();
    console.log("pushed and remained " + remainFileCount.toString() + " files");
  } while (remainFileCount > 0);
}

executeCommitAndPushRoutine();