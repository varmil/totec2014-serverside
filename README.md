## yamamoto-akihiro

## TOTEC2014 ServerSide Repo

#### 反省会：
* MySQLモジュールの使い方
* Pooling connectionsを使ったほうが良かった。（再接続の手間が省ける）

#### status400を確認する手法
* 単純にクエリを2回投げる方法でOK

#### No.10, 11　プレイリストの指定numberに楽曲を追加する。 ーupdateのインクリメントー
* `update playlist_detail set number = (number + 1) where number > ? and playlist_name = ?`
* としてから、 `insert into playlist_detail (playlist_name, number, music_id) values (?,?,?)`

#### No.12  プレイリストから楽曲を削除
* `delete from playlist_detail where playlist_name = ?`
* としてから、 `update playlist_detail set number = (number - 1) where number > ? and playlist_name = ?`

#### No.7　再生回数を取得  ーcount(*)とgroup byの併用ー
* ID指定がない場合：
 * まずmusicテーブルから最新の100件を取り出してきてから…それをwhere-in条件で使う。具体的には下記。
 * `select music_id, count(*) as times from play_history where music_id IN ? group by music_id`

* ID指定がある場合：
 * `select music_id, count(*) as times from play_history where music_id = ? group by music_id (limit 100)`
 * （limit指定はあってもなくても変わらない。取得するmusic_idの種類のlimitになるから）



#### No.8　重複を省きつつ最近再生された楽曲を取得　ーgroup byはorder byより先に処理されるー
* `max(created_at)` `min(created_at)` をselect時に用いて記憶しておき、そのエイリアスで `order by`
* 重複を省くには、 `distinct` か `group by` を用いるが後者のほうが扱いやすそう。 `offset` にも対応可。
* `select music_id,max(created_at) as max_created from play_history group by music_id order by max_created`
* 参考： [group byはorder byより先に処理される](http://webtech-walker.com/archive/2009/09/28232744.html)
