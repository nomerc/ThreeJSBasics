'use strict';

import * as THREE from "three";
import * as dat from 'dat.gui';
import TweenMax, {Power2} from "gsap/TweenMax";
import {TimelineLite} from "gsap/TimelineLite";
import {TimelineMax} from "gsap/TimelineMax";

//TODO
//вид на все кубики под прямым углом, как будто они находятся по центру
//загрузка фото - куда , как, какой размер(что делать если разный) количество
//дизайн страницы( canvas, контролы) React?
//выгрузка готового эффекта пользователю
//разные настройки для разных эффектов(контролы перестраивать через React?
//совместить 2d 3d canvas

//разрешение текстуры(или увеличивать текстуру или уменьшать канвас)


window.onload = function () {

    atlas(1, 1);
    // multipleCubes(2, 1);
    // severalCameras();
    // textExample();
    // textureExample();
    // texturedCube();
    // texturedCube2();

    function atlas(nx, ny) {
        let canvas = document.querySelector("#js-intro-canvas-3d"),

            //ThreeJS primitives for rendering
            renderer = new THREE.WebGLRenderer({canvas: canvas}),
            scene = new THREE.Scene(),
            factor = canvas.clientWidth / canvas.clientHeight,
            camera,
            geometry, splitGeometry,
            material,

            //Object dimensions
            objH = 500,
            objW = objH * factor * ny / nx,
            objDepth = objH,
            halfObjH = objH / 2,
            halfObjW = objW / 2,
            objZ = 200,

            //Frustum dimensions
            distance = 2000,
            FOV,
            height = objH * ny,
            halfH = height / 2,
            width = objW * nx,
            halfW = width / 2,

            //Controls variables
            options = {
                numberX: 1,
                numberY: 1,
                offsetX: 0,
                offsetY: 0
            },

            angle = Math.PI / 2;

        //calculating Frustum field of view
        FOV = 2 * Math.atan(height / (2 * (distance - objZ - objDepth / 2))) * 180 / Math.PI;

        ///setting camera
        camera = new THREE.PerspectiveCamera(FOV, factor, 0.1, distance);
        // camera.lookAt(0,0,0);
        camera.position.set(1, 0, distance);

        //computingn geometry for all boxes
        geometry = new THREE.BoxGeometry(objW, objH, objDepth);

        //creating boxes material (for all six sides)
        material = createBoxMaterial();

        scene.background = new THREE.Color(0xaaaaaa);

        for (let i = 0; i !== nx; i++) {
            for (let j = 0; j !== ny; j++) {

                //splitting image between all boxes
                splitGeometry = splitTextureImage(i, j, nx, ny, geometry);
                let object = new THREE.Mesh(splitGeometry, material);

                //placing boxes to fill canvas
                object.position.set(i * objW - halfW + halfObjW,
                    j * objH - halfH + halfObjH, objZ);

                // object.scale.set(.7, .7, .7);
                scene.add(object);
            }
        }

        showDatGUIControls();
        // setLights();
        animateScene(scene);

        render();

        function render() {

            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }

            requestAnimationFrame(render);
            // for (let i = 0; i !== 6; i++) {
            // let sinX = Math.sin(scene.children[i].rotation.x);
            // scene.children[i].scale.set(sinX, sinX, sinX);
            // scene.children[i].rotation.x += 0.01;
            // }
            renderer.render(scene, camera);
        }

        function animateScene(scene) {
            let timeLine = new TimelineLite({
                onComplete: function () {
                    angle += Math.PI / 2;
                    animateScene(scene);
                }
            });//{repeat: 100}
            let t1 = .5,
                t2 = .2;

            for (let i = 0; i !== nx * ny; i++) {
                timeLine.to(scene.children[i].scale, t1, {x: .7, y: .7, z: .7}, i * t2)
                    .to(scene.children[i].rotation, t2, {ease: Power2.easeOut, x: angle}, i * t2 + t1)
                    .to(scene.children[i].scale, t1, {x: 1, y: 1, z: 1}, i * t2 + t1 + t2);
            }
        }

        function splitTextureImage(i, j, nx, ny, geometry) {

            let gm = geometry.clone();

            for (let k = 0; k <= gm.faceVertexUvs[0].length - 1; k += 2) {
                //upperTriangle
                gm.faceVertexUvs[0].splice(k, 1,
                    [new THREE.Vector2(i / nx, (j + 1) / ny),
                        new THREE.Vector2(i / nx, j / ny),
                        new THREE.Vector2((i + 1) / nx, (j + 1) / ny)]
                );

                //lowerTriangle
                gm.faceVertexUvs[0].splice(k + 1, 1,
                    [new THREE.Vector2(i / nx, j / ny),
                        new THREE.Vector2((i + 1) / nx, j / ny),
                        new THREE.Vector2((i + 1) / nx, (j + 1) / ny)]
                );
            }

            //rotating box back face, to make it look normal after rotation
            //upperTriangle
            gm.faceVertexUvs[0].splice(10, 1,
                [new THREE.Vector2((i + 1) / nx, j / ny),
                    new THREE.Vector2((i + 1) / nx, (j + 1) / ny),
                    new THREE.Vector2(i / nx, j / ny)]
            );

            //lowerTriangle
            gm.faceVertexUvs[0].splice(11, 1,
                [new THREE.Vector2((i + 1) / nx, (j + 1) / ny),
                    new THREE.Vector2(i / nx, (j + 1) / ny),
                    new THREE.Vector2(i / nx, j / ny)]
            );

            return gm;
        }

        function setLights() {
            let ambientLight = new THREE.AmbientLight(0xffffff);
            ambientLight.position.set(0, 100, 100);
            scene.add(ambientLight);

            ambientLight = new THREE.AmbientLight(0xffffff);
            ambientLight.position.set(0, -100, 100);
            scene.add(ambientLight);

            let light = new THREE.SpotLight(0xFFFFFF, 0.5);
            light.position.set(10, 0, 80);
            scene.add(light);
        }

        function createBoxMaterial() {
            let textureImgs = [],
                material = [];

            textureImgs.push(new THREE.TextureLoader().load('imgs/panorama-11.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-12.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-13.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-14.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-15.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-16.jpg'));


            for (let i = 0; i !== textureImgs.length; i++) {
                textureImgs[i].magFilter = THREE.NearestFilter;
                material.push(new THREE.MeshBasicMaterial({map: textureImgs[i]}));
            }

            // material[textureImgs.length-1].map.matrix.rotate(Math.PI/2);
            return material;
        }

        function resizeRendererToDisplaySize(renderer) {
            const canvas = renderer.domElement;
            // const pixelRatio = window.devicePixelRatio;
            const width = canvas.clientWidth;//*pixelRatio
            const height = canvas.clientHeight;//*pixelRatio
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        }

        function showDatGUIControls() {
            if (document.getElementsByClassName('dg').length !== 0)
                return;
            // DAT.GUI Related Stuff
            let gui = new dat.GUI();

            let repeat = gui.addFolder('Slices');

            // repeat.add(options, 'numberX', 1, 20).name('X').listen();
            repeat.add(options, 'numberX', 1, 20).name('X').onChange(function () {
                atlas(Math.floor(options.numberX), Math.floor(options.numberY));
            });
            repeat.add(options, 'numberY', 1, 10).name('Y').onChange(function () {
                atlas(Math.floor(options.numberX), Math.floor(options.numberY));
            });
            repeat.open();
            /*
                        let offset = gui.addFolder('offset');

                        offset.add(options, 'offsetX', -1, 1).name('X').listen();
                        offset.add(options, 'offsetY', -1, 1).name('Y').listen();
                        offset.open();*/

        }
    }

    function multipleCubes(nx, ny) {
        let canvas = document.querySelector("#js-intro-canvas-3d"),
            renderer = new THREE.WebGLRenderer({canvas: canvas}),
            scene = new THREE.Scene(),
            factor = canvas.clientWidth / canvas.clientHeight,
            distance = 1000,
            objHeight = 500,
            objWidth = objHeight * factor * ny / nx,
            height = objHeight * ny,
            width = objWidth * nx,
            objDepth = 500,
            objZ = 200;

        let options = {
            repeatX: 1,
            repeatY: 1,
            offsetX: 0,
            offsetY: 0
        };

        let FOV = 2 * Math.atan(height / (2 * (distance - objZ - objDepth / 2))) * 180 / Math.PI;

        let camera = new THREE.PerspectiveCamera(FOV + 1, factor, 0.1, distance);

        camera.position.set(0, 0, distance);

        let geometry = new THREE.BoxGeometry(objWidth, objHeight, objDepth);
        let material = createBoxMaterial();

        for (let i = 0; i !== nx; i++) {
            for (let j = 0; j !== ny; j++) {
                let object = new THREE.Mesh(geometry, material);
                let texture = object.material[4].map;
                // object.material[4].map.matrix.autoUpdate = true;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1 / nx, 1 / ny);
                texture.offset.set(i * 0.5, options.offsetY);

                object.position.set(i * objWidth - width / 2 + objWidth / 2,
                    j * objHeight - height / 2 + objHeight / 2, objZ);

                scene.add(object);
            }
        }

        showDatGUIControls();
        setLights();
        render();

        function render() {
            requestAnimationFrame(render);
            // scene.children[0].material[4].map.repeat.set(options.repeatX, options.repeatY);
            // scene.children[0].material[4].map.offset.set(options.offsetX, options.offsetY);
            // scene.rotation.x += 0.01;
            renderer.render(scene, camera);
        }

        function setLights() {
            let ambientLight = new THREE.AmbientLight(0xffffff);
            ambientLight.position.set(0, 100, 100);
            scene.add(ambientLight);

            ambientLight = new THREE.AmbientLight(0xffffff);
            ambientLight.position.set(0, -100, 100);
            scene.add(ambientLight);

            let light = new THREE.SpotLight(0xFFFFFF, 0.5);
            light.position.set(10, 0, 80);
            scene.add(light);
        }

        function createBoxMaterial() {
            let textureImgs = [],
                material = [];

            textureImgs.push(new THREE.TextureLoader().load('imgs/panorama-1.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-2.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-3.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-4.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-1.jpg'),
                new THREE.TextureLoader().load('imgs/panorama-1.jpg'));

            for (let i = 0; i !== textureImgs.length; i++) {
                material.push(new THREE.MeshStandardMaterial({map: textureImgs[i]}));
            }

            return material;
        }

        function showDatGUIControls() {
            // DAT.GUI Related Stuff
            let gui = new dat.GUI();

            let repeat = gui.addFolder('repeat');

            repeat.add(options, 'repeatX', -2, 2).name('X').listen();
            repeat.add(options, 'repeatY', -2, 2).name('Y').listen();
            repeat.open();

            let offset = gui.addFolder('offset');

            offset.add(options, 'offsetX', -1, 1).name('X').listen();
            offset.add(options, 'offsetY', -1, 1).name('Y').listen();
            offset.open();

        }
    }

    function textureAtlas() {
        // json is a JSON atlas generated by TexturePacker
        // imagepath is a url to the full texture atlas image

        var atlasTexture = THREE.ImageUtils.loadTexture(imagepath, undefined, function () {

            for (var key in json.frames) {
                var tex = atlasTexture.clone();
                var frame = json.frames[key].frame;

                tex.repeat.x = (frame.w / atlasTexture.image.width);
                tex.repeat.y = (frame.h / atlasTexture.image.height);
                tex.offset.x = (Math.abs(frame.x) / atlasTexture.image.width);
                tex.offset.y = (Math.abs(frame.y) / atlasTexture.image.height);
                tex.needsUpdate = true;

                var material = new THREE.MeshPhongMaterial({transparent: true, map: tex, side: THREE.DoubleSide});
                scope.materials.push(material);
            }
        });
    }

    function severalCameras() {
        let camera, scene, mesh,
            canvas = document.querySelector("#js-intro-canvas-3d"),
            renderer = new THREE.WebGLRenderer({canvas: canvas});
        init();
        animate();

        function init() {
            const ASPECT_RATIO = canvas.clientWidth / canvas.clientHeight;
            const AMOUNT = 3;
            const WIDTH = (canvas.clientWidth / AMOUNT) * window.devicePixelRatio;
            const HEIGHT = (canvas.clientHeight / AMOUNT) * window.devicePixelRatio;
            const cameras = [];

            for (let y = 0; y < AMOUNT; y++) {
                for (let x = 0; x < AMOUNT; x++) {
                    let subcamera = new THREE.PerspectiveCamera(35, ASPECT_RATIO, 0.1, 10);
                    subcamera.viewport = new THREE.Vector4(Math.floor(x * WIDTH), Math.floor(y * HEIGHT), Math.ceil(WIDTH), Math.ceil(HEIGHT));
                    subcamera.position.x = (x / AMOUNT) - 0.5;
                    subcamera.position.y = 0.5 - (y / AMOUNT);
                    subcamera.position.z = 1.5;
                    subcamera.position.multiplyScalar(2);
                    subcamera.lookAt(0, 0, 0);
                    subcamera.updateMatrixWorld();
                    cameras.push(subcamera);
                }
            }
            camera = new THREE.ArrayCamera(cameras);
            camera.position.z = 3;
            scene = new THREE.Scene();
            scene.add(new THREE.AmbientLight(0x222244));
            var light = new THREE.DirectionalLight();
            light.position.set(0.5, 0.5, 1);
            light.castShadow = true;
            light.shadow.camera.zoom = 4; // tighter shadow map
            scene.add(light);
            let planeGeometry = new THREE.PlaneBufferGeometry(100, 100);
            let material = new THREE.MeshPhongMaterial({color: 0x000066});
            let background = new THREE.Mesh(planeGeometry, material);
            background.receiveShadow = true;
            background.position.set(0, 0, -1);
            scene.add(background);
            let cylinderGeometry = new THREE.CylinderBufferGeometry(0.5, 0.5, 1, 32);
            material = new THREE.MeshPhongMaterial({color: 0xff0000});
            mesh = new THREE.Mesh(cylinderGeometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            //
            window.addEventListener('resize', onWindowResize, false);
        }

        function onWindowResize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            // renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        function animate() {
            // mesh.rotation.x += 0.005;
            // mesh.rotation.z += 0.01;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
    }

    function textExample() {
        let canvas = document.querySelector("#js-intro-canvas-3d");
        var renderer = new THREE.WebGLRenderer({canvas: canvas});
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        var camera = new THREE.PerspectiveCamera(90, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);//window.innerWidth / window.innerHeight
        var lineMesh, text;

        var loader = new THREE.FontLoader();
        loader.load('fonts/helvetiker_bold.typeface.json', function (font) {

            var xMid;
            var color = 0x006699;
            var matDark = new THREE.LineBasicMaterial({
                color: color,
                side: THREE.DoubleSide
            });
            var matLite = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            var message = "   Three.js\nSimple text.";
            var shapes = font.generateShapes(message, 100);
            var geometry = new THREE.ShapeBufferGeometry(shapes);
            geometry.computeBoundingBox();
            xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            geometry.translate(xMid, 0, 0);
            // make shape ( N.B. edge view not visible )
            text = new THREE.Mesh(geometry, matLite);
            text.position.z = -150;
            scene.add(text);

            var lineText = new THREE.Object3D();
            for (var i = 0; i < shapes.length; i++) {
                var shape = shapes[i];
                var points = shape.getPoints();
                var geometry = new THREE.BufferGeometry().setFromPoints(points);
                geometry.translate(xMid, 0, 0);
                lineMesh = new THREE.Line(geometry, matDark);
                lineText.add(lineMesh);
            }
            scene.add(lineText);

            render();
        });

        var render = function () {
            requestAnimationFrame(render);
            text.rotation.x += 0.01;
            text.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
    }
}
;
