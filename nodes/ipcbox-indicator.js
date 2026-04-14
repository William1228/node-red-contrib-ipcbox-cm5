const { exec } = require('child_process');

module.exports = function(RED) {
    function IPCBoxIndicatorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.channel = config.channel;

        node.on('input', function(msg) {
            // turn to 0 or 1 format
            var value = (msg.payload === true || msg.payload === 1 || msg.payload === "1" || msg.payload === "ON") ? 0 : 1;
            
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
                    text: (node.channel === "25" ? "USER1" : "USER2") + ": " + (value ? "ON" : "OFF")
                });
                // 
                msg.payload = (value === 1);
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("ipcbox-indicator", IPCBoxIndicatorNode);
}
