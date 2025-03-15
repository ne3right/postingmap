#!/bin/env bash
set -euo pipefail

# 定数の定義
BASE_DIR=~/poster-map/
DATA_DIR=public/data
GCS_URL="https://script.google.com/macros/s/---/exec" # GASのURLを指定

# メイン処理
cd "$BASE_DIR"

git pull

# エリアリスト更新時のみ実施
#echo "データをダウンロード"
#curl -sL "$GCS_URL?sheetName=arealist" > "$DATA_DIR/arealist.csv"
#python3 bin/arealistcsv2json.py public/data/arealist.csv public/data/arealist.json

# 掲示板ピンマップデータをダウンロード
echo "データをダウンロード"
curl -sL "$GCS_URL?sheetName=postermapdata" > "$DATA_DIR/all.csv"

# all.json生成&分割
echo "ブロックごとに分割"
python3 bin/csv2json_small.py "$DATA_DIR/all.csv" "$DATA_DIR/arealist.csv" "$DATA_DIR/areablock.csv" "$DATA_DIR"

# summary.json
echo "達成率集計"
python3 bin/summarize_progress.py "$DATA_DIR/all.csv" "$DATA_DIR/arealist.csv" "$DATA_DIR/summary.json"

# summary_absolute.json
echo "残り数カウント"
python3 bin/summarize_progress_absolute.py "$DATA_DIR/all.csv" "$DATA_DIR/arealist.csv" "$DATA_DIR/summary_absolute.json"

# Git 操作
git add -N .

if ! git diff --exit-code --quiet
then
    git add .
    git commit -m "Data Update"
    git push
#    #source .env
#    #npx netlify-cli deploy --prod --message "Deploy" --dir=./public --auth $NETLIFY_AUTH_TOKEN
fi

