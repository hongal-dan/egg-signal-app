"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { MindARThree } from "mind-ar/dist/mindar-face-three.prod.js";
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
  scene: THREE.Scene | null = null;
  gltf: GLTF | null = null;
  root: THREE.Bone | null = null;
  morphTargetMeshes: THREE.Mesh[] = [];
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
      if ((object as THREE.Bone).isBone && !this.root) {
        this.root = object as THREE.Bone; // as THREE.Bone;
      }
      if (!(object as THREE.Mesh).isMesh) return;
      const mesh = object as THREE.Mesh;

      // 모델 형태 변경 정보 파악
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      this.morphTargetMeshes.push(mesh);
    });
    this.gltf = gltf;
  }

  // 모델 돌면서 자원 해제
  disposeResources(): void {
    const scene = this.gltf?.scene;
    scene?.traverse((object: THREE.Object3D) => {
      if (!(object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
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

  disposeMaterial(material: THREE.Material): void {
    const materialsWithMaps = [
      "map",
      "lightMap",
      "bumpMap",
      "normalMap",
      "envMap",
    ] as const;

    materialsWithMaps.forEach(mapName => {
      const materialWithMap = material as THREE.MeshStandardMaterial;
      if (materialWithMap[mapName]) {
        (materialWithMap[mapName] as THREE.Texture).dispose();
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

function UserVideoComponent2() {
  const avatarName = useRecoilValue(avatarState);
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatar] = useState<Avatar>(new Avatar(avatarName));

  useEffect(() => {
    const mindarThree = new MindARThree({
      container: containerRef.current!,
    });

    const { renderer, scene, camera } = mindarThree;
    // 기본 배경색으로 변경
    // renderer.setClearColor(0xfae4c9, 1);
    renderer.setClearColor(0x000000, 0);
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2.5);
    scene.add(light);

    // 화면 상의 특정 위치를 기준으로 얼굴을 식별하고 추적 여기서 1은 그냥 식별자임
    const anchor = mindarThree.addAnchor(1);

    const setup = async () => {
      await avatar!.init();
      if (avatar!.gltf && avatar!.gltf.scene) {
        avatar!.gltf.scene.scale.set(2, 2, 2);
        /// 앵커에 아바타 추가
        anchor.group.add(avatar!.gltf.scene);
      }

      await mindarThree.start();

      const video = document.querySelector("video");
      if (!video) {
        console.error("비디오 없음!!!");
        return;
      }

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.wrapS = THREE.RepeatWrapping;
      videoTexture.repeat.x = -1; // 텍스처 좌우 반전

      scene.background = videoTexture;

      // 얼굴 인식 못할 때 scene 배경
      const imgTexture = new THREE.TextureLoader().load(
        `/avatar/${avatarName}.png`,
      );
      imgTexture.wrapS = THREE.RepeatWrapping;
      imgTexture.wrapT = THREE.RepeatWrapping;

      // 받은 정보로 프레임마다 아바타 모양 렌더링
      renderer.setAnimationLoop(() => {
        // 가장 최근의 추정치를 가져옴
        const estimate = mindarThree.getLatestEstimate();
        if (estimate && estimate.blendshapes) {
          avatar!.updateBlendshapes(estimate.blendshapes);
          scene.background = videoTexture;
        } else {
          scene.background = imgTexture;
        }
        renderer.render(scene, camera);
      });
    };
    

    const cleanUp = (mindarThree: MindARThree) => {
      window.removeEventListener("resize", mindarThree._resize.bind(mindarThree));
      mindarThree.stop();

      // 씬 정리
      mindarThree.scene.clear();
      mindarThree.cssScene.clear();

      // 렌더러 정리
      mindarThree.renderer.dispose();

      // 앵커와 페이스 메쉬 배열 초기화
      mindarThree.anchors = [];
      mindarThree.faceMeshes = [];

      const video = containerRef.current?.querySelector("video");
      if (video) {
        console.log("비디오 제거");
        video.pause();
        video.srcObject = null;
      }
      const mindarElements = document.querySelectorAll("[class^='mindar-']");
      mindarElements.forEach(element => {
        element.remove();
      });

      const script = document.querySelector("script[src='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm/vision_wasm_internal.js']");
      if (script) {
        script.remove();
      }
      disposeAll();


    };

    setup();

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      scene.clear();

      if (avatar) {
        avatar.disposeResources();
      };
      cleanUp(mindarThree);
    };
  }, [avatarName]);

  return (
    <>
      <div ref={containerRef} className="relative"></div>
    </>
  );
}

export default UserVideoComponent2;
