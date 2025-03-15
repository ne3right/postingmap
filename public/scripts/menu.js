async function getblockList() {
    const areablockResponse = await fetch('/data/areablock.json');
    const areablock = await areablockResponse.json();
    return areablock;
  }

  function generateMenu(areablock) {
    const container = document.getElementById('container'); // コンテナの要素を取得
    areablock.forEach(area => {
        // リストアイテムを作成
        const linkElement = document.createElement('a');
        linkElement.href = `./map?block=${area.block_key}`;
        linkElement.classList.add('list-group-item', 'list-group-item-action');
        linkElement.textContent = area.block_name;

        // コンテナに追加
        container.appendChild(linkElement);
    });
}

// ページがロードされた後に非同期でデータを取得し、メニューを生成
async function init() {
    try {
        const areablock = await getblockList(); // データを取得
        generateMenu(areablock); // 取得したデータを基にメニューを生成
    } catch (error) {
        console.error('Error fetching the data:', error); // エラーハンドリング
    }
}

// ページロード時にinit関数を呼び出す
init();
