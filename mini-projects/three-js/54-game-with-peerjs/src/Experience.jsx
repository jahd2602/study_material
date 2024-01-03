// import { OrbitControls } from "@react-three/drei";
import Lights from "./Lights.jsx";
import Level from "./Level.jsx";
import { Physics } from "@react-three/rapier";
import Player from "./Player.jsx";
import useGame from "./stores/useGame.jsx";
import { Peer } from "peerjs";
import { useEffect } from "react";

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);


  useEffect(() => {
    // Define ENUM with all possible messages ids
    const MessageType = {
      'heartbeat': 0,
      'worldreset': 1,
    };


    let connectUsingId = (selfId) => {
      // Initialize connection to server
      const peerId = "ball-race-online-" + selfId;
      console.log("Trying to connect using peerId: " + peerId + "...");
      const peer = new Peer(peerId, {
        debug: 2,
      });
      peer.on("error", (err) => {
        if (err.type === "unavailable-id") {
          console.log("Peer ID already taken, trying next one...");
          connectUsingId(selfId + 1);
        }
      });

      peer.on("open", (serverId) => {
        // We have a connection to the server
        console.log("Connected to server with id: " + serverId);

        let otherId;
        if (selfId == 0) {
          otherId = "ball-race-online-1"
        } else if (selfId == 1) {
          otherId = "ball-race-online-0"
        }
        console.log("Trying to connect to peerId: " + otherId + "...");
        // Connect to other peer
        const conn = peer.connect(otherId);
        conn.on("open", () => {
          // --- puppet
          console.log("Connected to peer MASTER (as puppet)!");
          console.log("Sending hi!! every second")
          setInterval(() => {
            conn.send({
              type: MessageType.heartbeat,
              msg: 'hi!! from puppet'
            });
          }, 1000);

          conn.on('data', function (data) {
            console.log('Received data (as puppet):');
            console.log(data);
          });
        });

        peer.on('connection', function (conn) {
          // --- MASTER
          console.log("Connected to peer puppet (as MASTER)!");
          console.log("Sending hello every second")
          setInterval(() => {
            conn.send({
              type: MessageType.heartbeat,
              msg: 'hello from MASTER'
            });
          }, 1000);

          // Send world reset message after 1 ms
          setTimeout(() => {
            // TODO: Add block information to this message from Level
            conn.send({
              type: MessageType.worldreset,
              msg: 'reset world'
            });
          }, 1000);

          conn.on('data', function (data) {
            console.log("Received data (as MASTER):");
            console.log(data);
          });
        });

      });


    }
    connectUsingId(0);
  }, []);

  return (
    <>
      {/* <OrbitControls makeDefault /> */}
      <color args={["#bdedfc"]} attach="background" />

      <Physics debug={false}>
        <Lights />
        <Level count={blocksCount} seed={blocksSeed} />
        <Player />
      </Physics>
    </>
  );
}
