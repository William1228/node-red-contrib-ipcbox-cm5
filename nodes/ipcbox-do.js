const { exec } = require('child_process');

module.exports = function(RED) {
    function IPCBoxDONode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.channel = config.channel;

        node.on('input', function(msg) {
            // 轉換輸入為 0 或 1
            var value = (msg.payload === true || msg.payload === 1 || msg.payload === "1" || msg.payload === "ON") ? 1 : 0;
            
            // run exec command
            var cmd = `gpioset gpiochip4 ${node.channel}=${value}`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    node.error(`DO Error: ${stderr}`);
                    node.status({fill:"red", shape:"ring", text:"error: busy or permission"});
                    return;
                }
                node.status({
                    fill: value ? "green" : "dot", 
                    shape: "dot", 
                    text: (node.channel === "27" ? "DO1" : "DO2") + ": " + (value ? "ON" : "OFF")
                });
                // 
                msg.payload = (value === 1);
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("ipcbox-do", IPCBoxDONode);
}
