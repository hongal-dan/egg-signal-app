"use client";
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { MindARThree } from "mind-ar/dist/mindar-face-three.prod.js";

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

  constructor() {
    this.gltf = null;
    this.morphTargetMeshes = [];
  }

  async init() {
    const url = "/avatar/raccoon_head.glb";
    const gltf: GLTF = await new Promise(resolve => {
      const loader = new GLTFLoader();
      loader.load(url, (gltf: GLTF) => {
        resolve(gltf);
      });
    });
    gltf.scene.traverse(object => {
      if ((object as THREE.Bone).isBone && !this.root) {
        this.root = object as THREE.Bone; // as THREE.Bone;
      }
      if (!(object as THREE.Mesh).isMesh) return;
      const mesh = object as THREE.Mesh;
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      this.morphTargetMeshes.push(mesh);
    });
    this.gltf = gltf;
  }

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

function UserVideoComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatar] = useState<Avatar | null>(new Avatar());
  const mindarThreeRef = useRef<MindARThree | null>(null);

  useEffect(() => {
    const setup = async () => {
      const mindarThree = new MindARThree({
        container: containerRef.current!,
      });
      mindarThreeRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      const anchor = mindarThree.addAnchor(1);

      await avatar!.init();
      if (avatar!.gltf && avatar!.gltf.scene) {
        avatar!.gltf.scene.scale.set(2, 2, 2);
        anchor.group.add(avatar!.gltf.scene);
      }

      await mindarThree.start();
      renderer.setAnimationLoop(() => {
        const estimate = mindarThree.getLatestEstimate();
        if (estimate && estimate.blendshapes) {
          avatar!.updateBlendshapes(estimate.blendshapes);
        }
        renderer.render(scene, camera);
      });
    };

    setup();
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.style.backgroundColor = "black";
    }
  });

  return (
    <>
      <div ref={containerRef} className="relative"></div>
    </>
  );
}

export default React.memo(UserVideoComponent);
