/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/*eslint-env node */
module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    var urllib = require("url");

//Node constructor
    function CallBranches(n) {
        RED.nodes.createNode(this,n);

        var clientid = n.clientid;
        var url = "https://eospu.esunbank.com.tw/esun/bank/data/branches?client_id="+ clientid;
        var opts = urllib.parse(url);
            opts.method = "GET";
            opts.headers = {};
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

            req.end();
        });
    }

    RED.nodes.registerType("Branches",CallBranches);
}
