const fs = require('fs');
const { promisify } = require( 'util' )
const simpleGit = require('simple-git');
const git = simpleGit();

async function executeGitStatus(){
  return git.status();
}

const limitFileSize = 1900000000;

const eachSlice = (arr, n = 2) => {
  const dup = [...arr]
  const result = [];
  let length = dup.length;

  while (0 < length) {
    result.push(dup.splice(0, n));
    length = dup.length
  }

  return result;
};


async function executeCommitAndPushRoutine(){
  let statusResult = await executeGitStatus();
  let remainFileCount = statusResult.created.length + statusResult.not_added.length;
  while(remainFileCount > 0){
    let sumSize = 0;
    // ダブっているファイルがあるためSetにして除去する
    const addFileSet = new Set();
    const createdFilePromises = [];
    // すでに git add されているファイルの容量を計算して、残りまだgit addできるもののみを全てgit addする
    for(const notAddFile of statusResult.created){
      const statPromise = promisify(fs.stat)(notAddFile).then(stat => {
        sumSize = sumSize + stat.size;
      });
      createdFilePromises.push(statPromise);
    }
    await Promise.all(createdFilePromises);
    console.log(sumSize);
    if(sumSize <= limitFileSize) {
      // 速度優先のため非同期でgit addするファイルの選別をファイルサイズを取得した上で行う
      const addFilePromises = [];
      for (const notAddFile of statusResult.not_added) {
        let isStop = false;
        const statPromise = promisify(fs.stat)(notAddFile).then(stat => {
          if(isStop){
            return sumSize;
          }
          if (sumSize + stat.size > limitFileSize) {
            isStop = true;
            return sumSize;
          }
          sumSize = sumSize + stat.size;
          addFileSet.add(notAddFile.toString());
          return sumSize;
        });
        addFilePromises.push(statPromise);
        if (isStop) {
          break;
        }
      }
      await Promise.all(addFilePromises);
    }
    console.log(sumSize);
    const total = addFileSet.size;
    remainFileCount = remainFileCount - total;
    console.log("add files:" + total.toString());
    // git addできるファイル数の上限が約2000。これ以上のファイル数をgit addするとエラーになるので分割する
    for(const files of eachSlice(Array.from(addFileSet), 2000)){
      await git.add(files).catch(err => {
        console.error(err);
      });
    }
    console.log("add file completed:" + total.toString());
    const nowDate = new Date();
    const dateString = [nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDay()].join("/");
    const timeString = [nowDate.getHours(), nowDate.getMinutes(), nowDate.getSeconds()].join(":");
    const commitMessage = [dateString, timeString, total, "image files add"].join(" ");
    console.log(commitMessage);
    await git.commit(commitMessage);
    console.log("committed " + total.toString() + " files");
    await git.push().catch(err => {
      console.error(err);
    });
    console.log("pushed and remained " + remainFileCount.toString() + " files");
    // git statusで取得できるファイル数には上限があるので、現状で取得できたファイルが無くなったら再度git statusを行なって補充できるか確認する
    if(remainFileCount <= 0) {
      statusResult = await executeGitStatus();
      remainFileCount = statusResult.created.length + statusResult.not_added.length;
    }
  }
}

executeCommitAndPushRoutine();