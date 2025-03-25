const outputDiv = document.getElementById("output");

    // 出力を画面に表示するためのコールバック
    window.output_callback = function(s) {
      outputDiv.textContent += s + "\n";
      outputDiv.scrollTop = outputDiv.scrollHeight;
    };

    let pyodide = null;
    async function main() {
      try {
        outputDiv.textContent = "Pyodideをロード中なのだ...\n";
        pyodide = await loadPyodide();
        outputDiv.textContent += "Pyodideのロードが完了したのだ！\n";

        outputDiv.textContent += "micropipをロードするのだ...\n";
        await pyodide.loadPackage("micropip");
        outputDiv.textContent += "micropipのロードが完了したのだ！\n";

        outputDiv.textContent += "msoffcrypto-toolをインストールするのだ...\n";
        await pyodide.runPythonAsync(`
          import micropip
          await micropip.install("msoffcrypto-tool")
        `);
        outputDiv.textContent += "msoffcrypto-toolのインストールが完了したのだ！\n";

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
                      output_callback(string + " じゃダメなのだ…")
                      await asyncio.sleep(0.05)
                      if check_password(file_path, string):
                          output_callback("わかったのだ! " + string + " なのだ!")
                          return
        `;
        
        await pyodide.runPythonAsync(pythonCode);
        outputDiv.textContent += "Pythonコードの読み込みが完了したのだ！\n";
      
        document.getElementById("runBtn").disabled = false;
      } catch (error) {
        outputDiv.textContent += "エラーが発生したのだ: " + error + "\n";
      }
    }

    main();

    document.getElementById("fileInput").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.FS.writeFile("uploaded_file", uint8Array);
        outputDiv.textContent += "ファイルをアップロードしたのだ！\n";
      }
    });

    document.getElementById("runBtn").addEventListener("click", async () => {
      const digits = parseInt(document.getElementById("digitsInput").value);
      outputDiv.textContent += "実行中なのだ…\n";
      try {
        outputDiv.textContent += "パスワードを総当たりで試すのだ...\n";
        await pyodide.runPythonAsync(`import asyncio; await run_crack("uploaded_file", ${digits})`);
        outputDiv.textContent += "処理が完了したのだ！\n";
      } catch (err) {
        outputDiv.textContent += "エラーが発生したのだ: " + err + "\n";
      }
    });