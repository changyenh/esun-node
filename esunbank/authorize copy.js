module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    var urllib = require("url");
    var querystring = require("querystring");

//Node constructor
    function CallAuthorize(n) {
        RED.nodes.createNode(this,n);

        var username = n.username;
        var password = n.password;
        var req_body = querystring.stringify({
            grant_type: "password",
            username: username,
            password: password,
            scope: "/customers"
        });
        var auth = "Basic "+new Buffer(username+":"+password).toString("base64");
        var url = "https://eospu.esunbank.com.tw/esun/bank/customers/oauth/authorize";
        var opts = urllib.parse(url);
            opts.method = "POST";
            opts.headers = {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(req_body),
              "Authorization": auth;
            };
        this.ret = "txt";
        var node = this;
        var encoding ="utf8";

  //Receiving messages
        this.on("input",function(msg) {

            node.status({fill:"blue",shape:"dot",text:"httpin.status.requesting"});
            var req = ((/^https/.test(url))?https:http).request(opts,function(res) {
                res.setEncoding(encoding);
                msg.statusCode = res.statusCode;
                msg.headers = res.headers;
                msg.payload = "";
                msg.url = url;   // revert when warning above finally removed
                res.on('data',function(chunk) {
                    msg.payload += chunk;
                });

                res.on('end',function() {
                    if (node.ret === "obj") {
                        try { msg.payload = JSON.parse(msg.payload); }
                        catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    }
                    //Sending messages
                    node.send(msg);
                    node.status({});
                });
            });

            req.on('error',function(err) {
                msg.payload = err.toString() + " : " + url;
                msg.statusCode = err.code;
                node.send(msg);
                node.status({fill:"red",shape:"ring",text:err.code});
            });
            req.write(req_body);
            req.end();
        });
    }

    RED.nodes.registerType("Authorize",CallAuthorize);
}
