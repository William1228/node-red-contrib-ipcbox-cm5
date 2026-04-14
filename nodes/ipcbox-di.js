const { spawn, exec } = require('child_process');

module.exports = function (RED) {
    function IPCBoxDINode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.channel = config.channel;
        this.debounce = parseInt(config.debounce || 50);
        this.monitor = null;
        this.lastState = null;
        this.lastTime = 0;

        // --- 1. 立即讀取初始狀態並輸出 ---
        function fetchInitial() {
            exec(`gpioget gpiochip4 ${node.channel}`, (error, stdout, stderr) => {
                if (error) {
                    node.warn(`Initial read failed: ${stderr}`);
                    return;
                }
                const val = parseInt(stdout.trim());
                let isActive = (val !== 1); // 採用您測試正確的邏輯

                node.lastState = isActive;
                node.lastTime = Date.now();

                // 稍微延遲發送，確保 Node-RED 流程已完全啟動並連接好線路
                setTimeout(() => {
                    node.send({
                        topic: "input/DI" + (node.channel === "23" ? "1" : "2"),
                        payload: isActive,
                        initial: true,
                        timestamp: node.lastTime
                    });
                    // 增加一個日誌紀錄，方便在終端機確認是否有執行
                    node.log(`Initial payload sent for CH${node.channel}`);
                }, 500); // 增加到 500ms

                node.status({
                    fill: isActive ? "green" : "grey",
                    shape: "dot",
                    text: (node.channel === "23" ? "DI1: " : "DI2: ") + (isActive ? "ON" : "OFF") + " (init)"
                });
            });
        }

        // --- 2. 啟動監聽進程 ---
        function startMonitor() {
            // 直接啟動，不再等待 exec 回傳
            node.monitor = spawn('gpiomon', ['-b', '--format', '%e %o', 'gpiochip4', node.channel]);

            node.monitor.stdout.on('data', (data) => {
                const raw = data.toString().trim();
                const lines = raw.split(/\r?\n/);

                lines.forEach(lineStr => {
                    const parts = lineStr.trim().split(/\s+/);
                    if (parts.length < 2) return;

                    const event = parseInt(parts[0]);
                    const line = parts[1];

                    // 採用您確認正確的邏輯
                    let isActive = (event !== 1);

                    const now = Date.now();
                    // 狀態過濾與防彈跳
                    if (isActive === node.lastState) return;
                    if (node.debounce > 0 && (now - node.lastTime) < node.debounce) return;

                    node.lastState = isActive;
                    node.lastTime = now;

                    node.send({
                        topic: "input/DI" + (line === "23" ? "1" : "2"),
                        payload: isActive,
                        timestamp: now
                    });

                    node.status({
                        fill: isActive ? "green" : "grey",
                        shape: "dot",
                        text: (line === "23" ? "DI1: " : "DI2: ") + (isActive ? "ON" : "OFF")
                    });
                });
            });

            node.monitor.on('error', (err) => {
                node.status({ fill: "red", shape: "ring", text: "spawn error" });
                node.error("Failed to start gpiomon: " + err);
            });

            // 初始顯示為 listening，直到 exec 或 stdout 更新它
            if (node.lastState === null) {
                node.status({ fill: "blue", shape: "ring", text: "listening..." });
            }
        }

        // --- 執行啟動 ---
        fetchInitial();  // 讀取初始值
        startMonitor();  // 同時啟動監聽

        this.on('close', function (done) {
            if (node.monitor) {
                node.monitor.kill();
            }
            done();
        });
    }
    RED.nodes.registerType("ipcbox-di", IPCBoxDINode);
}
