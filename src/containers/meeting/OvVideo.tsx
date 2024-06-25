import React from "react";
import { StreamManager } from "openvidu-browser";

import { useState, useEffect } from "react";
// import * as THREE from "three";
// import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
// import { MindARThree } from "mind-ar/dist/mindar-face-three.prod.js";
import "../../styles/App.css";

// interface BlendshapeCategory {
//   categoryName: string;
//   score: number;
// }

// interface Blendshapes {
//   categories: BlendshapeCategory[];
// }

// class Avatar {
//   scene: THREE.Scene | null = null;
//   gltf: GLTF | null = null;
//   root: THREE.Bone | null = null;
//   morphTargetMeshes: THREE.Mesh[] = [];

//   constructor() {
//     this.gltf = null;
//     this.morphTargetMeshes = [];
//   }
//   async init() {
//     const url = "/avatar/raccoon_head.glb";
//     console.log("Loading GLTF from URL:", url);
//     const gltf: GLTF = await new Promise((resolve) => {
//       const loader = new GLTFLoader();
//       loader.load(url, (gltf: GLTF) => {
//         console.log("GLTF Loaded:", gltf);
//         resolve(gltf);
//       });
//     });
//     gltf.scene.traverse((object) => {
//       if ((object as THREE.Bone).isBone && !this.root) {
//         this.root = object as THREE.Bone; // as THREE.Bone;
//       }
//       if (!(object as THREE.Mesh).isMesh) return;
//       const mesh = object as THREE.Mesh;
//       if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
//       this.morphTargetMeshes.push(mesh);
//     });
//     this.gltf = gltf;
//   }
//   updateBlendshapes(blendshapes: Blendshapes) {
//     const categories = blendshapes.categories;
//     let coefsMap = new Map<string, number>();
//     for (let i = 0; i < categories.length; ++i) {
//       coefsMap.set(categories[i].categoryName, categories[i].score);
//     }
//     for (const mesh of this.morphTargetMeshes) {
//       if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
//         continue;
//       }
//       for (const [name, value] of coefsMap) {
//         if (!Object.keys(mesh.morphTargetDictionary).includes(name)) {
//           continue;
//         }
//         const idx = mesh.morphTargetDictionary[name];
//         mesh.morphTargetInfluences[idx] = value;
//       }
//     }
//   }
// }

type Props = {
  streamManager: StreamManager;
  // socket: any;
};

const OpenViduVideoComponent = (props: Props) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLDivElement>(null);
  // const [avatar] = useState<Avatar>(new Avatar());
  const [isChosen, setIsChosen] = useState<boolean>(false);
  // const socket = props.socket;

  // useEffect(() => {
  //   const setup = async () => {
  //     const mindarThreeInstance = new MindARThree({
  //       container: containerRef.current!,
  //     });

  //     const { renderer, scene, camera } = mindarThreeInstance;
  //     const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  //     scene.add(light);

  //     const anchor = mindarThreeInstance.addAnchor(1);

  //     await avatar.init();
  //     if (avatar.gltf && avatar.gltf.scene) {
  //       avatar.gltf.scene.scale.set(2, 2, 2);
  //       anchor.group.add(avatar.gltf.scene);
  //     }

  //     await mindarThreeInstance.start();
  //     renderer.setAnimationLoop(() => {
  //       const estimate = mindarThreeInstance.getLatestEstimate();
  //       if (estimate && estimate.blendshapes) {
  //         avatar.updateBlendshapes(estimate.blendshapes);
  //       }
  //       renderer.render(scene, camera);
  //     });
  //   };

  //   if (containerRef.current) {
  //     setup();
  //   }
  // }, [containerRef, avatar]);

  useEffect(() => {
    if (props.streamManager && videoRef.current) {
      props.streamManager.addVideoElement(videoRef.current);
    }
  }, [videoRef, props.streamManager]);

  // const handleChoose = () => {
  //   const myName = document.querySelector(".pub").querySelector(".nickname");
  //   const currentNickname = containerRef.current.closest(".streamcomponent").querySelector(".nickname");
  //   console.log(currentNickname.textContent);
  //   if(isChosen) {
  //     containerRef.current.classList.remove("chosen-stream");
  //     setIsChosen(false);
  //     return;
  //   }
  //   containerRef.current.classList.add("chosen-stream");
  //   socket.emit('choose', {
  //     sender: myName.textContent,
  //     receiver: currentNickname.textContent
  //   })
  //   console.log(myName.textContent, currentNickname.textContent);
  //   setIsChosen(true);
  // }

  return (
    <>
      <div className="cam-wrapper" ref={containerRef}>
        <video autoPlay={true} ref={videoRef}></video>
        <div className="choose-btn hidden" onClick={()=>{}} ref={btnRef}></div>
      </div>
    </>
  );
};

export default OpenViduVideoComponent;
