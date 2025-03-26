const outputDiv = document.getElementById("output");

// 出力を画面に表示するためのコールバック
window.output_callback = function(s) {
  outputDiv.textContent += s + "\n";
  outputDiv.scrollTop = outputDiv.scrollHeight;
};
let pyodide = null;
async function main() {
  try {
    outputDiv.textContent = "Pyodideをロード中…\n";
    pyodide = await loadPyodide();
    outputDiv.textContent += "Pyodideのロード完了\n";
    outputDiv.textContent += "micropipをロード中…\n";
    await pyodide.loadPackage("micropip");
    outputDiv.textContent += "micropipのロード完了\n";
    outputDiv.textContent += "msoffcrypto-toolをインストール中…\n";
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install("msoffcrypto-tool")
    `);
    outputDiv.textContent += "msoffcrypto-toolのインストール完了\n";
    // Pythonコード側で直接出力コールバックを呼ぶように修正
    const pythonCode = `
      import msoffcrypto
      import io
      import asyncio
      from itertools import product
      from js import output_callback
      def check_password(file_path: str, password: str) -> bool:
          try:
              with open(file_path, "rb") as f:
                  office_file = msoffcrypto.OfficeFile(f)
                  office_file.load_key(password=password)
                  decrypted = io.BytesIO()
                  office_file.decrypt(decrypted)
                  return True
          except Exception:
              return False
      async def run_crack(file_path: str, password_digits: int):
          chars = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
          for length in range(1, password_digits + 1):
              for combination in product(chars, repeat=length):
                  string = "".join(combination)
                  output_callback(string + "で解読不能")
                  await asyncio.sleep(0.05)
                  if check_password(file_path, string):
                      output_callback("検証結果 password:" + string)
                      return
    `;
    
    await pyodide.runPythonAsync(pythonCode);
    outputDiv.textContent += "Pythonコードの読み込み完了\n";
  
    document.getElementById("runBtn").disabled = false;
  } catch (error) {
    outputDiv.textContent += "エラー発生: " + error + "\n";
  }
}
main();
document.getElementById("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    pyodide.FS.writeFile("uploaded_file", uint8Array);
    outputDiv.textContent += "ファイルのアップロード完了\n";
  }
});
document.getElementById("runBtn").addEventListener("click", async () => {
  const digits = parseInt(document.getElementById("digitsInput").value);
  outputDiv.textContent += "実行中…\n";
  try {
    outputDiv.textContent += "パスワードの検証開始\n";
    await pyodide.runPythonAsync(`import asyncio; await run_crack("uploaded_file", ${digits})`);
    outputDiv.textContent += "処理完了\n";
  } catch (err) {
    outputDiv.textContent += "エラー発生: " + err + "\n";
  }
});

document.getElementById("runBtn").addEventListener("click", async () => {
  const digits = parseInt(document.getElementById("digitsInput").value);
  outputDiv.textContent += "実行中…\n";
  
  showLoading(true); // アニメーションを表示
  
  try {
      outputDiv.textContent += "パスワードの検証開始\n";
      await pyodide.runPythonAsync(`import asyncio; await run_crack("uploaded_file", ${digits})`);
      outputDiv.textContent += "処理完了\n";
  } catch (err) {
      outputDiv.textContent += "エラー発生: " + err + "\n";
  }
  
  showLoading(false); // 解析完了後にアニメーションを非表示
});

function showLoading(isLoading) {
  const loader = document.getElementById("loadingIcon"); // ローディングアイコン
  const button = document.getElementById("runBtn"); // 解析ボタン
  
  if (isLoading) {
      loader.style.display = "block"; // ローディングアイコンを表示
      button.disabled = true; // ボタンを無効化
      button.textContent = "解析中…"; // ボタンのテキスト変更
  } else {
      loader.style.display = "none"; // ローディングアイコンを非表示
      button.disabled = false; // ボタンを有効化
      button.textContent = "解析開始"; // 元のテキストに戻す
  }
}

document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const button = document.getElementById("toggleTheme");
  // if (document.body.classList.contains("dark-mode")) {
  //     button.textContent = "ライトモード";
  // } else {
  //     button.textContent = "ダークモード";
  // }
});

document.getElementById("customFileButton").addEventListener("click", () => {
  document.getElementById("fileInput").click(); // 実際のファイル選択をトリガー
});

document.getElementById("fileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  document.getElementById("customFileButton").textContent = file ? `選択したファイル:${file.name}` : "選択されたファイルなし";
});
