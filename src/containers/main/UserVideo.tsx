"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Scene,
  Bone,
  Mesh,
  Object3D,
  Material,
  MeshStandardMaterial,
  Texture,
  HemisphereLight,
  VideoTexture,
  TextureLoader,
  RepeatWrapping,
} from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { useRecoilValue } from "recoil";
import { avatarState } from "@/app/store/avatar";

interface BlendshapeCategory {
  categoryName: string;
  score: number;
}

interface Blendshapes {
  categories: BlendshapeCategory[];
}

class Avatar {
  scene: Scene | null = null;
  gltf: GLTF | null = null;
  root: Bone | null = null;
  morphTargetMeshes: Mesh[] = [];
  avatarName: string | null = null;

  constructor(avatarName: string | null) {
    this.gltf = null;
    this.morphTargetMeshes = [];
    this.avatarName = avatarName;
  }

  async init() {
    const url = `/avatar/${this.avatarName}.glb`;
    const gltf: GLTF = await new Promise(resolve => {
      const loader = new GLTFLoader();
      loader.load(url, (gltf: GLTF) => {
        resolve(gltf);
      });
    });

    // 모델 뼈대 구조 파악
    gltf.scene.traverse(object => {
      if ((object as Bone).isBone && !this.root) {
        this.root = object as Bone; // as THREE.Bone;
      }
      if (!(object as Mesh).isMesh) return;
      const mesh = object as Mesh;

      // 모델 형태 변경 정보 파악
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      this.morphTargetMeshes.push(mesh);
    });
    this.gltf = gltf;
  }

  // 모델 돌면서 자원 해제
  disposeResources(): void {
    const scene = this.gltf?.scene;
    scene?.traverse((object: Object3D) => {
      if (!(object as Mesh).isMesh) {
        const mesh = object as Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(mesh.material);
          }
        }
        return;
      }
    });
  }

  disposeMaterial(material: Material): void {
    const materialsWithMaps = [
      "map",
      "lightMap",
      "bumpMap",
      "normalMap",
      "envMap",
    ] as const;

    materialsWithMaps.forEach(mapName => {
      const materialWithMap = material as MeshStandardMaterial;
      if (materialWithMap[mapName]) {
        (materialWithMap[mapName] as Texture).dispose();
      }
    });

    material.dispose();
  }

  // 모델 형태 변환
  updateBlendshapes(blendshapes: Blendshapes) {
    const categories = blendshapes.categories;
    const coefsMap = new Map();
    for (let i = 0; i < categories.length; ++i) {
      coefsMap.set(categories[i].categoryName, categories[i].score);
    }
    for (const mesh of this.morphTargetMeshes) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
        continue;
      }
      for (const [name, value] of coefsMap) {
        if (!Object.keys(mesh.morphTargetDictionary).includes(name)) {
          continue;
        }
        const idx = mesh.morphTargetDictionary[name];
        mesh.morphTargetInfluences[idx] = value;
      }
    }
  }
}

const logMemoryUsage = (label: string) => {
  if ("memory" in performance) {
    const memory: any = (performance as any).memory;
    console.log(
      `${label} - JS Heap Size: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    );
  } else {
    console.log("Memory performance API is not available in this browser.");
  }
};

function ARComponent() {
  const avatarName = useRecoilValue(avatarState);
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatar] = useState<Avatar>(new Avatar(avatarName));

  useEffect(() => {
    const loadMindAR = async () => {
      logMemoryUsage("Before setup");

      const { MindARThree } = await import(
        "mind-ar/dist/mindar-face-three.prod.js"
      );
      const mindarThree = new MindARThree({
        container: containerRef.current,
      });

      const { renderer, scene, camera } = mindarThree;
      renderer.setClearColor(0x000000, 0);
      const light = new HemisphereLight(0xffffff, 0xbbbbff, 2.5);
      scene.add(light);

      const anchor = mindarThree.addAnchor(1);

      const setup = async () => {
        await avatar?.init();
        if (avatar?.gltf?.scene) {
          avatar.gltf.scene.scale.set(2, 2, 2);
          anchor.group.add(avatar.gltf.scene);
        }

        await mindarThree.start();

        const video = document.querySelector("video");
        if (!video) {
          console.error("비디오 없음!!!");
          return;
        }

        const videoTexture = new VideoTexture(video);
        videoTexture.wrapS = RepeatWrapping;
        videoTexture.repeat.x = -1;

        scene.background = videoTexture;

        const imgTexture = new TextureLoader().load(
          `/avatar/${avatarName}.png`,
        );
        imgTexture.wrapS = RepeatWrapping;
        imgTexture.wrapT = RepeatWrapping;

        let frame = 0;
        renderer.setAnimationLoop(() => {
          const estimate = mindarThree.getLatestEstimate();
          if (estimate?.blendshapes) {
            avatar.updateBlendshapes(estimate.blendshapes);
            scene.background = videoTexture;
          } else {
            scene.background = imgTexture;
          }
          renderer.render(scene, camera);

          if (frame % 60 === 0) {
            logMemoryUsage("Memory check during animation");
          }
          frame += 1;
        });
      };

      const cleanUp = (mindarThree: any) => {
        window.removeEventListener(
          "resize",
          mindarThree._resize.bind(mindarThree),
        );
        mindarThree.stop();
        mindarThree.scene.clear();
        mindarThree.cssScene.clear();
        mindarThree.renderer.dispose();
        mindarThree.anchors = [];
        mindarThree.faceMeshes = [];

        const video = containerRef.current?.querySelector("video");
        if (video) {
          console.log("비디오 제거");
          video.pause();
          video.srcObject = null;
        }
        const mindarElements = document.querySelectorAll("[class^='mindar-']");
        mindarElements.forEach(element => element.remove());

        const script = document.querySelector(
          "script[src='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm/vision_wasm_internal.js']",
        );
        if (script) {
          script.remove();
        }

        const memoryLogInterval = setInterval(() => {
          logMemoryUsage("Memory check");
        }, 60000);

        return () => {
          clearInterval(memoryLogInterval);
        };
      };

      await setup();

      return () => {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        scene.clear();
        avatar?.disposeResources();
        cleanUp(mindarThree);
      };
    };

    loadMindAR();
  }, [avatarName]);

  return (
    <>
      <div ref={containerRef} className="relative"></div>
    </>
  );
}

export default ARComponent;
