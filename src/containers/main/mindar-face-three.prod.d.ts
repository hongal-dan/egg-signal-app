declare module "mind-ar/dist/mindar-face-three.prod.js" {
  import * as THREE from "three"; // Three.js 모듈 import 추가

  export class MindARThree {
    constructor(config: any);
    start(): Promise<void>;
    addAnchor(anchorIndex: number): any;
    getLatestEstimate(): any;

    // renderer, scene, camera 속성 추가 및 타입 정의
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
  }
}
