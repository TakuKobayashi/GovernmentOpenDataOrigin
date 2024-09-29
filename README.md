# GovernmentOpenDataOrigin

本リポジトリは政府がオープンデータとして公開しているデータのWebAPI化の基となるデータをダウンロードして管理しているリポジトリとなります
WebAPI化して公開しているプロジェクトは [こちら](https://github.com/TakuKobayashi/GovernmentOpenDataWebAPI) を参照してください

* [GovernmentOpenDataWebAPI](https://github.com/TakuKobayashi/GovernmentOpenDataWebAPI)

本リポジトリで管理しているデータは [東京都オープンデータカタログサイト](https://portal.data.metro.tokyo.lg.jp/) で公開されているオープンデータから、できる限りのデータをダウンロードして文字コードを `UTF-8` に変換したものを保管しているリポジトリとなります。

# 保存されているデータのデータ構造

ダウンロードしてきたデータは以下に基づいたファイルパスにダウンロードしてきたを格納しています

* {独自に設定したカテゴリー名}/{ダウンロード元のURLの内, `https://` または `http://` を除いた部分}
* {ファイル名より抽出した最適なキーワード名}/{ダウンロード元のURLの内, `https://` または `http://` を除いた部分}

求めているデータを探す場合は以上のルールを参考に探してみてください。

# データのダウンロード方法

本リポジトリはデータ量が大きいため (10GB以上あります)
以下のコマンドのように最新のコミットだけをダウンロードしてくることをおすすめします

```
git clone --depth 1 https://github.com/TakuKobayashi/GovernmentOpenDataOrigin.git
```