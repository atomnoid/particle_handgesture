import * as THREE from "three";

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17]
];

export class HandScene{

    constructor(canvas,video){

        this.video=video;

        this.renderer=new THREE.WebGLRenderer({
            canvas,
            antialias:true,
            alpha:true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        this.scene=new THREE.Scene();

        this.camera=new THREE.OrthographicCamera(
            -1,
            1,
            1,
            -1,
            0.1,
            100
        );

        this.camera.position.z=5;

        this.createBackground();

        this.createLandmarks();

        window.addEventListener("resize",()=>{

            this.renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );

        });

    }

    createBackground(){

        this.videoTexture=new THREE.VideoTexture(this.video);

        this.videoTexture.minFilter=THREE.LinearFilter;
        this.videoTexture.magFilter=THREE.LinearFilter;

        const geo=new THREE.PlaneGeometry(2,2);

        const mat=new THREE.MeshBasicMaterial({

            map:this.videoTexture

        });

        this.bg=new THREE.Mesh(geo,mat);

        this.bg.scale.x=-1;

        this.bg.position.z=-5;

        this.scene.add(this.bg);

    }

    createLandmarks(){

        this.points=[];

        const geo=new THREE.SphereGeometry(
            0.02,
            20,
            20
        );

        for(let i=0;i<21;i++){

            const color=i===8
            ?0xff3333
            :0x00ffff;

            const mat=new THREE.MeshBasicMaterial({

                color

            });

            const sphere=new THREE.Mesh(
                geo,
                mat
            );

            sphere.visible=false;

            this.scene.add(sphere);

            this.points.push(sphere);

        }

        const positions=new Float32Array(
            CONNECTIONS.length*2*3
        );

        this.lineGeometry=new THREE.BufferGeometry();

        this.lineGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );

        const lineMaterial=new THREE.LineBasicMaterial({

            color:0xffffff

        });

        this.lines=new THREE.LineSegments(
            this.lineGeometry,
            lineMaterial
        );

        this.lines.visible=false;

        this.scene.add(this.lines);

    }

    convert(lm){

        return{

            x:-(lm.x*2-1),
            y:-(lm.y*2-1),
            z:-lm.z

        };

    }

    updateLandmarks(handList){

        if(!handList || handList.length===0){

            this.points.forEach(p=>p.visible=false);

            this.lines.visible=false;

            return;

        }

        const hand=handList[0];

        hand.forEach((lm,i)=>{

            const p=this.convert(lm);

            this.points[i].visible=true;

            this.points[i].position.set(
                p.x,
                p.y,
                p.z
            );

            if(i===8){

                this.points[i].scale.setScalar(1.8);

            }else{

                this.points[i].scale.setScalar(1);

            }

        });

        const pos=this.lineGeometry.attributes.position;

        CONNECTIONS.forEach((c,index)=>{

            const a=this.convert(hand[c[0]]);

            const b=this.convert(hand[c[1]]);

            pos.setXYZ(
                index*2,
                a.x,
                a.y,
                a.z
            );

            pos.setXYZ(
                index*2+1,
                b.x,
                b.y,
                b.z
            );

        });

        pos.needsUpdate=true;

        this.lines.visible=true;

    }

    render(){

        if(this.video.readyState>=2){

            this.videoTexture.needsUpdate=true;

        }

        this.renderer.render(
            this.scene,
            this.camera
        );

    }

}